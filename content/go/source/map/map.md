```go
// 版权所有 2014 The Go Authors。保留所有权利。
// 此源代码的使用受 BSD 风格的
// 许可证约束，该许可证可在 LICENSE 文件中找到。

package runtime

// 此文件包含 Go map 类型的实现。
//
// map 本质就是一个哈希表。数据被组织成
// 一个桶数组。每个桶最多存储
// 8 个键/值对。哈希值的低位比特
// 用于选择桶。每个桶中存储了每个哈希值的
// 几个高位比特，用于区分同一个桶内的条目。
//
// 如果超过 8 个键哈希到同一个桶，我们会
// 链式挂载额外的桶。
//
// 当哈希表扩容时，我们会分配一个
// 容量为原来两倍的新桶数组。桶会被增量式地
// 从旧桶数组复制到新桶数组。
//
// map 迭代器遍历桶数组，
// 并按遍历顺序返回键（先桶编号，再溢出链顺序，最后桶内索引）。
// 为了维持迭代语义，我们绝不会在桶内移动键的位置
//（如果移动，键可能会被返回 0 次或 2 次）。
// 当表扩容时，迭代器会继续遍历旧表，并且必须检查
// 它们正在遍历的桶是否已经被迁移（“转移”）到新表。

// 选择负载因子：太大则会产生大量溢出桶，
// 太小则会浪费大量空间。我编写了一个简单程序
// 测试不同负载下的统计数据：
// (64位系统，8字节键和值)
//  loadFactor    %overflow  bytes/entry     hitprobe    missprobe
//        4.00         2.13        20.77         3.00         4.00
//        4.50         4.05        17.30         3.25         4.50
//        5.00         6.85        14.77         3.50         5.00
//        5.50        10.55        12.94         3.75         5.50
//        6.00        15.27        11.67         4.00         6.00
//        6.50        20.90        10.79         4.25         6.50
//        7.00        27.14        10.15         4.50         7.00
//        7.50        34.03         9.73         4.75         7.50
//        8.00        41.10         9.40         5.00         8.00
//
// %overflow   = 包含溢出桶的桶占比
// bytes/entry = 每个键/值对的开销字节数
// hitprobe    = 查找存在的键时需要检查的条目数
// missprobe   = 查找不存在的键时需要检查的条目数
//
// 请注意，此数据是表达到最大负载时的统计，
// 即表即将扩容前。常规表的负载会略低一些。

import (
	"internal/abi"
	"internal/goarch"
	"runtime/internal/atomic"
	"runtime/internal/math"
	"unsafe"
)

const (
	// 单个桶能容纳的最大键/值对数量。
	bucketCntBits = abi.MapBucketCountBits
	bucketCnt     = abi.MapBucketCount

	// 触发扩容的桶最大平均负载为 bucketCnt*13/16（约 80% 容量）
	// 由于最小对齐规则，bucketCnt 至少为 8。
	// 用 loadFactorNum/loadFactorDen 表示，方便整数运算。
	loadFactorDen = 2
	loadFactorNum = (bucketCnt * 13 / 16) * loadFactorDen

	// 键或值可以内联存储的最大尺寸（而非为每个元素单独分配内存）。
	// 必须能存入 uint8。
	// 快速路径无法处理大值 - cmd/compile/internal/gc/walk.go 中
	// 快速路径的截断尺寸必须不大于此值。
	maxKeySize  = abi.MapMaxKeyBytes
	maxElemSize = abi.MapMaxElemBytes

	// 数据偏移量应为 bmap 结构体的大小，但需要
	// 正确对齐。对于 amd64p32，即使指针是 32 位，
	// 也意味着需要 64 位对齐。
	dataOffset = unsafe.Offsetof(struct {
		b bmap
		v int64
	}{}.v)

	// 可能的 tophash 值。我们保留几个值作为特殊标记。
	// 每个桶（包括其溢出桶）的所有条目
	// 要么全部处于转移状态，要么全部不处于
	//（evacuate() 方法执行期间除外，该方法仅在 map 写入时执行，
	// 此时其他协程无法观察 map）。
	emptyRest      = 0 // 此单元格为空，且更高索引/溢出位置无更多非空单元格
	emptyOne       = 1 // 此单元格为空
	evacuatedX     = 2 // 键/值有效。条目已迁移到更大表的前半部分
	evacuatedY     = 3 // 同上，迁移到更大表的后半部分
	evacuatedEmpty = 4 // 单元格为空，桶已完成迁移
	minTopHash     = 5 // 正常填充单元格的最小 tophash 值

	// 标志位
	iterator     = 1 // 可能有迭代器正在使用桶
	oldIterator  = 2 // 可能有迭代器正在使用旧桶
	hashWriting  = 4 // 有协程正在写入 map
	sameSizeGrow = 8 // 当前 map 扩容为相同大小的新 map

	// 迭代器检查用的哨兵桶 ID
	noCheck = 1<<(8*goarch.PtrSize) - 1
)

// isEmpty 判断给定的 tophash 数组条目是否表示空桶条目。
func isEmpty(x uint8) bool {
	return x <= emptyOne
}

// Go map 的头部结构体。
type hmap struct {
	// 注意：hmap 的格式也在 cmd/compile/internal/reflectdata/reflect.go 中编码。
	// 确保与编译器定义保持同步。
	count     int // 活跃单元格数量 == map 大小。必须是第一个字段（被 len() 内置函数使用）
	flags     uint8
	B         uint8  // 桶数量的以 2 为底的对数（最多容纳 loadFactor * 2^B 个元素）
	noverflow uint16 // 溢出桶的近似数量；详情见 incrnoverflow
	hash0     uint32 // 哈希种子

	buckets    unsafe.Pointer // 2^B 个桶的数组。count==0 时可能为 nil
	oldbuckets unsafe.Pointer // 扩容前的旧桶数组，仅扩容期间非 nil
	nevacuate  uintptr        // 迁移进度计数器（小于此值的桶已完成迁移）

	extra *mapextra // 可选字段
}

// mapextra 存储并非所有 map 都拥有的字段。
type mapextra struct {
	// 如果键和值都不包含指针且可内联，我们将桶类型
	// 标记为不包含指针。这可以避免扫描此类 map。
	// 但是 bmap.overflow 是指针。为了保持溢出桶存活，
	// 我们将所有溢出桶的指针存储在 hmap.extra.overflow 和 hmap.extra.oldoverflow 中。
	// overflow 和 oldoverflow 仅在键和值不包含指针时使用。
	// overflow 存储 hmap.buckets 的溢出桶。
	// oldoverflow 存储 hmap.oldbuckets 的溢出桶。
	// 间接存储允许在 hiter 中存储切片指针。
	overflow    *[]*bmap
	oldoverflow *[]*bmap

	// nextOverflow 指向空闲的溢出桶。
	nextOverflow *bmap
}

// Go map 的桶。
type bmap struct {
	// tophash 通常存储此桶中每个键的
	// 哈希值的最高字节。如果 tophash[0] < minTopHash，
	// tophash[0] 表示桶的迁移状态。
	tophash [bucketCnt]uint8
	// 后续依次是 bucketCnt 个键，然后是 bucketCnt 个值。
	// 注意：将所有键打包在一起，再打包所有值，
	// 代码会比 键/值/键/值... 交替存储更复杂，
	// 但可以消除内存填充，例如 map[int64]int8 场景。
	// 最后是溢出指针。
}

// 哈希迭代结构体。
// 如果修改 hiter，同时修改 cmd/compile/internal/reflectdata/reflect.go
// 和 reflect/value.go 以匹配此结构体的布局。
type hiter struct {
	key         unsafe.Pointer // 必须在第一个位置。写入 nil 表示迭代结束（见 cmd/compile/internal/walk/range.go）
	elem        unsafe.Pointer // 必须在第二个位置（见 cmd/compile/internal/walk/range.go）
	t           *maptype
	h           *hmap
	buckets     unsafe.Pointer // 迭代初始化时的桶指针
	bptr        *bmap          // 当前桶
	overflow    *[]*bmap       // 保持 hmap.buckets 的溢出桶存活
	oldoverflow *[]*bmap       // 保持 hmap.oldbuckets 的溢出桶存活
	startBucket uintptr        // 迭代起始桶
	offset      uint8          // 迭代时桶内起始偏移量（需足够容纳 bucketCnt-1）
	wrapped     bool           // 已从桶数组末尾绕回开头
	B           uint8
	i           uint8
	bucket      uintptr
	checkBucket uintptr
}

// bucketShift 返回 1<<b，为代码生成做了优化。
func bucketShift(b uint8) uintptr {
	// 掩码移位量可以消除溢出检查。
	return uintptr(1) << (b & (goarch.PtrSize*8 - 1))
}

// bucketMask 返回 1<<b - 1，为代码生成做了优化。
func bucketMask(b uint8) uintptr {
	return bucketShift(b) - 1
}

// tophash 计算哈希值的 tophash。
func tophash(hash uintptr) uint8 {
	top := uint8(hash >> (goarch.PtrSize*8 - 8))
	if top < minTopHash {
		top += minTopHash
	}
	return top
}

func evacuated(b *bmap) bool {
	h := b.tophash[0]
	return h > emptyOne && h < minTopHash
}

func (b *bmap) overflow(t *maptype) *bmap {
	return *(**bmap)(add(unsafe.Pointer(b), uintptr(t.BucketSize)-goarch.PtrSize))
}

func (b *bmap) setoverflow(t *maptype, ovf *bmap) {
	*(**bmap)(add(unsafe.Pointer(b), uintptr(t.BucketSize)-goarch.PtrSize)) = ovf
}

func (b *bmap) keys() unsafe.Pointer {
	return add(unsafe.Pointer(b), dataOffset)
}

// incrnoverflow 递增 h.noverflow。
// noverflow 统计溢出桶的数量。
// 用于触发同尺寸 map 扩容。
// 另见 tooManyOverflowBuckets。
// 为了保持 hmap 小巧，noverflow 是 uint16 类型。
// 桶数量较少时，noverflow 是精确计数。
// 桶数量较多时，noverflow 是近似计数。
func (h *hmap) incrnoverflow() {
	// 当溢出桶数量等于桶数量时，
	// 触发同尺寸 map 扩容。
	// 需要能计数到 1<<h.B。
	if h.B < 16 {
		h.noverflow++
		return
	}
	// 以 1/(1<<(h.B-15)) 的概率递增。
	// 当达到 1<<15 - 1 时，溢出桶数量
	// 近似等于桶数量。
	mask := uint32(1)<<(h.B-15) - 1
	// 示例：如果 h.B == 18，则 mask == 7，
	// fastrand & 7 == 0 的概率为 1/8。
	if fastrand()&mask == 0 {
		h.noverflow++
	}
}

func (h *hmap) newoverflow(t *maptype, b *bmap) *bmap {
	var ovf *bmap
	if h.extra != nil && h.extra.nextOverflow != nil {
		// 有预分配的溢出桶可用。
		// 详情见 makeBucketArray。
		ovf = h.extra.nextOverflow
		if ovf.overflow(t) == nil {
			// 未到预分配溢出桶末尾。移动指针。
			h.extra.nextOverflow = (*bmap)(add(unsafe.Pointer(ovf), uintptr(t.BucketSize)))
		} else {
			// 这是最后一个预分配溢出桶。
			// 重置此桶的溢出指针，
			// 该指针原本被设置为非空哨兵值。
			ovf.setoverflow(t, nil)
			h.extra.nextOverflow = nil
		}
	} else {
		ovf = (*bmap)(newobject(t.Bucket))
	}
	h.incrnoverflow()
	if t.Bucket.PtrBytes == 0 {
		h.createOverflow()
		*h.extra.overflow = append(*h.extra.overflow, ovf)
	}
	b.setoverflow(t, ovf)
	return ovf
}

func (h *hmap) createOverflow() {
	if h.extra == nil {
		h.extra = new(mapextra)
	}
	if h.extra.overflow == nil {
		h.extra.overflow = new([]*bmap)
	}
}

func makemap64(t *maptype, hint int64, h *hmap) *hmap {
	if int64(int(hint)) != hint {
		hint = 0
	}
	return makemap(t, int(hint), h)
}

// makemap_small 实现 Go map 的创建，
// 适用于 make(map[k]v) 和 make(map[k]v, hint)，
// 且编译期已知 hint 不超过 bucketCnt，
// 同时 map 需要在堆上分配。
func makemap_small() *hmap {
	h := new(hmap)
	h.hash0 = fastrand()
	return h
}

// makemap 实现 Go map 的创建 make(map[k]v, hint)。
// 如果编译器确定 map 或第一个桶
// 可以在栈上创建，h 和/或 bucket 可能非 nil。
// 如果 h != nil，map 可直接在 h 中创建。
// 如果 h.buckets != nil，指向的桶可用作第一个桶。
func makemap(t *maptype, hint int, h *hmap) *hmap {
	mem, overflow := math.MulUintptr(uintptr(hint), t.Bucket.Size_)
	if overflow || mem > maxAlloc {
		hint = 0
	}

	// 初始化 Hmap
	if h == nil {
		h = new(hmap)
	}
	h.hash0 = fastrand()

	// 找到能容纳请求元素数量的尺寸参数 B。
	// hint < 0 时 overLoadFactor 返回 false，因为 hint < bucketCnt。
	B := uint8(0)
	for overLoadFactor(hint, B) {
		B++
	}
	h.B = B

	// 分配初始哈希表
	// 如果 B == 0，buckets 字段会在后续延迟分配（在 mapassign 中）
	// 如果 hint 很大，清零这段内存会耗时较长。
	if h.B != 0 {
		var nextOverflow *bmap
		h.buckets, nextOverflow = makeBucketArray(t, h.B, nil)
		if nextOverflow != nil {
			h.extra = new(mapextra)
			h.extra.nextOverflow = nextOverflow
		}
	}

	return h
}

// makeBucketArray 初始化 map 桶的底层数组。
// 1<<b 是要分配的最小桶数量。
// dirtyalloc 要么为 nil，要么是之前
// 由 makeBucketArray 使用相同 t 和 b 参数分配的桶数组。
// 如果 dirtyalloc 为 nil，将分配新的底层数组；
// 否则清空 dirtyalloc 并复用为底层数组。
func makeBucketArray(t *maptype, b uint8, dirtyalloc unsafe.Pointer) (buckets unsafe.Pointer, nextOverflow *bmap) {
	base := bucketShift(b)
	nbuckets := base
	// b 较小时，溢出桶概率很低。
	// 避免计算开销。
	if b >= 4 {
		// 增加估算的溢出桶数量，
		// 用于插入此 b 值对应的中位数元素数量。
		nbuckets += bucketShift(b - 4)
		sz := t.Bucket.Size_ * nbuckets
		up := roundupsize(sz)
		if up != sz {
			nbuckets = up / t.Bucket.Size_
		}
	}

	if dirtyalloc == nil {
		buckets = newarray(t.Bucket, int(nbuckets))
	} else {
		// dirtyalloc 之前由
		// 上述 newarray(t.Bucket, int(nbuckets)) 生成，
		// 但可能非空。
		buckets = dirtyalloc
		size := t.Bucket.Size_ * nbuckets
		if t.Bucket.PtrBytes != 0 {
			memclrHasPointers(buckets, size)
		} else {
			memclrNoHeapPointers(buckets, size)
		}
	}

	if base != nbuckets {
		// 我们预分配了一些溢出桶。
		// 为了最小化跟踪这些溢出桶的开销，
		// 我们约定：如果预分配溢出桶的溢出指针为 nil，
		// 则通过移动指针可获取更多可用桶。
		// 最后一个溢出桶需要安全的非空指针；直接用 buckets。
		nextOverflow = (*bmap)(add(buckets, base*uintptr(t.BucketSize)))
		last := (*bmap)(add(buckets, (nbuckets-1)*uintptr(t.BucketSize)))
		last.setoverflow(t, (*bmap)(buckets))
	}
	return buckets, nextOverflow
}

// mapaccess1 返回指向 h[key] 的指针。绝不会返回 nil，
// 如果键不存在，会返回值类型的零对象引用。
// 注意：返回的指针可能会让整个 map 保持存活，
// 不要长时间持有它。
func mapaccess1(t *maptype, h *hmap, key unsafe.Pointer) unsafe.Pointer {
	if raceenabled && h != nil {
		callerpc := getcallerpc()
		pc := abi.FuncPCABIInternal(mapaccess1)
		racereadpc(unsafe.Pointer(h), callerpc, pc)
		raceReadObjectPC(t.Key, key, callerpc, pc)
	}
	if msanenabled && h != nil {
		msanread(key, t.Key.Size_)
	}
	if asanenabled && h != nil {
		asanread(key, t.Key.Size_)
	}
	if h == nil || h.count == 0 {
		if t.HashMightPanic() {
			t.Hasher(key, 0) // 见问题 23734
		}
		return unsafe.Pointer(&zeroVal[0])
	}
	if h.flags&hashWriting != 0 {
		fatal("并发的 map 读和 map 写")
	}
	hash := t.Hasher(key, uintptr(h.hash0))
	m := bucketMask(h.B)
	b := (*bmap)(add(h.buckets, (hash&m)*uintptr(t.BucketSize)))
	if c := h.oldbuckets; c != nil {
		if !h.sameSizeGrow() {
			// 之前桶数量是现在的一半；掩码再右移一位。
			m >>= 1
		}
		oldb := (*bmap)(add(c, (hash&m)*uintptr(t.BucketSize)))
		if !evacuated(oldb) {
			b = oldb
		}
	}
	top := tophash(hash)
bucketloop:
	for ; b != nil; b = b.overflow(t) {
		for i := uintptr(0); i < bucketCnt; i++ {
			if b.tophash[i] != top {
				if b.tophash[i] == emptyRest {
					break bucketloop
				}
				continue
			}
			k := add(unsafe.Pointer(b), dataOffset+i*uintptr(t.KeySize))
			if t.IndirectKey() {
				k = *((*unsafe.Pointer)(k))
			}
			if t.Key.Equal(key, k) {
				e := add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.KeySize)+i*uintptr(t.ValueSize))
				if t.IndirectElem() {
					e = *((*unsafe.Pointer)(e))
				}
				return e
			}
		}
	}
	return unsafe.Pointer(&zeroVal[0])
}

func mapaccess2(t *maptype, h *hmap, key unsafe.Pointer) (unsafe.Pointer, bool) {
	if raceenabled && h != nil {
		callerpc := getcallerpc()
		pc := abi.FuncPCABIInternal(mapaccess2)
		racereadpc(unsafe.Pointer(h), callerpc, pc)
		raceReadObjectPC(t.Key, key, callerpc, pc)
	}
	if msanenabled && h != nil {
		msanread(key, t.Key.Size_)
	}
	if asanenabled && h != nil {
		asanread(key, t.Key.Size_)
	}
	if h == nil || h.count == 0 {
		if t.HashMightPanic() {
			t.Hasher(key, 0) // 见问题 23734
		}
		return unsafe.Pointer(&zeroVal[0]), false
	}
	if h.flags&hashWriting != 0 {
		fatal("并发的 map 读和 map 写")
	}
	hash := t.Hasher(key, uintptr(h.hash0))
	m := bucketMask(h.B)
	b := (*bmap)(add(h.buckets, (hash&m)*uintptr(t.BucketSize)))
	if c := h.oldbuckets; c != nil {
		if !h.sameSizeGrow() {
			// 之前桶数量是现在的一半；掩码再右移一位。
			m >>= 1
		}
		oldb := (*bmap)(add(c, (hash&m)*uintptr(t.BucketSize)))
		if !evacuated(oldb) {
			b = oldb
		}
	}
	top := tophash(hash)
bucketloop:
	for ; b != nil; b = b.overflow(t) {
		for i := uintptr(0); i < bucketCnt; i++ {
			if b.tophash[i] != top {
				if b.tophash[i] == emptyRest {
					break bucketloop
				}
				continue
			}
			k := add(unsafe.Pointer(b), dataOffset+i*uintptr(t.KeySize))
			if t.IndirectKey() {
				k = *((*unsafe.Pointer)(k))
			}
			if t.Key.Equal(key, k) {
				e := add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.KeySize)+i*uintptr(t.ValueSize))
				if t.IndirectElem() {
					e = *((*unsafe.Pointer)(e))
				}
				return e, true
			}
		}
	}
	return unsafe.Pointer(&zeroVal[0]), false
}

// 同时返回键和值。被 map 迭代器使用。
func mapaccessK(t *maptype, h *hmap, key unsafe.Pointer) (unsafe.Pointer, unsafe.Pointer) {
	if h == nil || h.count == 0 {
		return nil, nil
	}
	hash := t.Hasher(key, uintptr(h.hash0))
	m := bucketMask(h.B)
	b := (*bmap)(add(h.buckets, (hash&m)*uintptr(t.BucketSize)))
	if c := h.oldbuckets; c != nil {
		if !h.sameSizeGrow() {
			// 之前桶数量是现在的一半；掩码再右移一位。
			m >>= 1
		}
		oldb := (*bmap)(add(c, (hash&m)*uintptr(t.BucketSize)))
		if !evacuated(oldb) {
			b = oldb
		}
	}
	top := tophash(hash)
bucketloop:
	for ; b != nil; b = b.overflow(t) {
		for i := uintptr(0); i < bucketCnt; i++ {
			if b.tophash[i] != top {
				if b.tophash[i] == emptyRest {
					break bucketloop
				}
				continue
			}
			k := add(unsafe.Pointer(b), dataOffset+i*uintptr(t.KeySize))
			if t.IndirectKey() {
				k = *((*unsafe.Pointer)(k))
			}
			if t.Key.Equal(key, k) {
				e := add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.KeySize)+i*uintptr(t.ValueSize))
				if t.IndirectElem() {
					e = *((*unsafe.Pointer)(e))
				}
				return k, e
			}
		}
	}
	return nil, nil
}

func mapaccess1_fat(t *maptype, h *hmap, key, zero unsafe.Pointer) unsafe.Pointer {
	e := mapaccess1(t, h, key)
	if e == unsafe.Pointer(&zeroVal[0]) {
		return zero
	}
	return e
}

func mapaccess2_fat(t *maptype, h *hmap, key, zero unsafe.Pointer) (unsafe.Pointer, bool) {
	e := mapaccess1(t, h, key)
	if e == unsafe.Pointer(&zeroVal[0]) {
		return zero, false
	}
	return e, true
}

// 与 mapaccess 类似，但如果键不存在，会为其分配插槽。
func mapassign(t *maptype, h *hmap, key unsafe.Pointer) unsafe.Pointer {
	if h == nil {
		panic(plainError("向 nil map 中的条目赋值"))
	}
	if raceenabled {
		callerpc := getcallerpc()
		pc := abi.FuncPCABIInternal(mapassign)
		racewritepc(unsafe.Pointer(h), callerpc, pc)
		raceReadObjectPC(t.Key, key, callerpc, pc)
	}
	if msanenabled {
		msanread(key, t.Key.Size_)
	}
	if asanenabled {
		asanread(key, t.Key.Size_)
	}
	if h.flags&hashWriting != 0 {
		fatal("并发的 map 写操作")
	}
	hash := t.Hasher(key, uintptr(h.hash0))

	// 调用 t.hasher 后再设置 hashWriting，
	// 因为 t.hasher 可能 panic，此时我们并未真正执行写入。
	h.flags ^= hashWriting

	if h.buckets == nil {
		h.buckets = newobject(t.Bucket) // newarray(t.Bucket, 1)
	}

again:
	bucket := hash & bucketMask(h.B)
	if h.growing() {
		growWork(t, h, bucket)
	}
	b := (*bmap)(add(h.buckets, bucket*uintptr(t.BucketSize)))
	top := tophash(hash)

	var inserti *uint8
	var insertk unsafe.Pointer
	var elem unsafe.Pointer
bucketloop:
	for {
		for i := uintptr(0); i < bucketCnt; i++ {
			if b.tophash[i] != top {
				if isEmpty(b.tophash[i]) && inserti == nil {
					inserti = &b.tophash[i]
					insertk = add(unsafe.Pointer(b), dataOffset+i*uintptr(t.KeySize))
					elem = add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.KeySize)+i*uintptr(t.ValueSize))
				}
				if b.tophash[i] == emptyRest {
					break bucketloop
				}
				continue
			}
			k := add(unsafe.Pointer(b), dataOffset+i*uintptr(t.KeySize))
			if t.IndirectKey() {
				k = *((*unsafe.Pointer)(k))
			}
			if !t.Key.Equal(key, k) {
				continue
			}
			// 键已存在映射。更新它。
			if t.NeedKeyUpdate() {
				typedmemmove(t.Key, k, key)
			}
			elem = add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.KeySize)+i*uintptr(t.ValueSize))
			goto done
		}
		ovf := b.overflow(t)
		if ovf == nil {
			break
		}
		b = ovf
	}

	// 未找到键的映射。分配新单元格并添加条目。

	// 如果达到最大负载因子或溢出桶过多，
	// 且未处于扩容中，则开始扩容。
	if !h.growing() && (overLoadFactor(h.count+1, h.B) || tooManyOverflowBuckets(h.noverflow, h.B)) {
		hashGrow(t, h)
		goto again // 扩容会使所有数据失效，重新尝试
	}

	if inserti == nil {
		// 当前桶及其所有关联溢出桶已满，分配新桶。
		newb := h.newoverflow(t, b)
		inserti = &newb.tophash[0]
		insertk = add(unsafe.Pointer(newb), dataOffset)
		elem = add(insertk, bucketCnt*uintptr(t.KeySize))
	}

	// 在插入位置存储新键/值
	if t.IndirectKey() {
		kmem := newobject(t.Key)
		*(*unsafe.Pointer)(insertk) = kmem
		insertk = kmem
	}
	if t.IndirectElem() {
		vmem := newobject(t.Elem)
		*(*unsafe.Pointer)(elem) = vmem
	}
	typedmemmove(t.Key, insertk, key)
	*inserti = top
	h.count++

done:
	if h.flags&hashWriting == 0 {
		fatal("并发的 map 写操作")
	}
	h.flags &^= hashWriting
	if t.IndirectElem() {
		elem = *((*unsafe.Pointer)(elem))
	}
	return elem
}

func mapdelete(t *maptype, h *hmap, key unsafe.Pointer) {
	if raceenabled && h != nil {
		callerpc := getcallerpc()
		pc := abi.FuncPCABIInternal(mapdelete)
		racewritepc(unsafe.Pointer(h), callerpc, pc)
		raceReadObjectPC(t.Key, key, callerpc, pc)
	}
	if msanenabled && h != nil {
		msanread(key, t.Key.Size_)
	}
	if asanenabled && h != nil {
		asanread(key, t.Key.Size_)
	}
	if h == nil || h.count == 0 {
		if t.HashMightPanic() {
			t.Hasher(key, 0) // 见问题 23734
		}
		return
	}
	if h.flags&hashWriting != 0 {
		fatal("并发的 map 写操作")
	}

	hash := t.Hasher(key, uintptr(h.hash0))

	// 调用 t.hasher 后再设置 hashWriting，
	// 因为 t.hasher 可能 panic，此时我们并未真正执行写入（删除）。
	h.flags ^= hashWriting

	bucket := hash & bucketMask(h.B)
	if h.growing() {
		growWork(t, h, bucket)
	}
	b := (*bmap)(add(h.buckets, bucket*uintptr(t.BucketSize)))
	bOrig := b
	top := tophash(hash)
search:
	for ; b != nil; b = b.overflow(t) {
		for i := uintptr(0); i < bucketCnt; i++ {
			if b.tophash[i] != top {
				if b.tophash[i] == emptyRest {
					break search
				}
				continue
			}
			k := add(unsafe.Pointer(b), dataOffset+i*uintptr(t.KeySize))
			k2 := k
			if t.IndirectKey() {
				k2 = *((*unsafe.Pointer)(k2))
			}
			if !t.Key.Equal(key, k2) {
				continue
			}
			// 仅当键包含指针时清空键。
			if t.IndirectKey() {
				*(*unsafe.Pointer)(k) = nil
			} else if t.Key.PtrBytes != 0 {
				memclrHasPointers(k, t.Key.Size_)
			}
			e := add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.KeySize)+i*uintptr(t.ValueSize))
			if t.IndirectElem() {
				*(*unsafe.Pointer)(e) = nil
			} else if t.Elem.PtrBytes != 0 {
				memclrHasPointers(e, t.Elem.Size_)
			} else {
				memclrNoHeapPointers(e, t.Elem.Size_)
			}
			b.tophash[i] = emptyOne
			// 如果桶现在以一连串 emptyOne 状态结尾，
			// 将这些状态改为 emptyRest。
			// 本想写成独立函数，但目前 for 循环无法内联。
			if i == bucketCnt-1 {
				if b.overflow(t) != nil && b.overflow(t).tophash[0] != emptyRest {
					goto notLast
				}
			} else {
				if b.tophash[i+1] != emptyRest {
					goto notLast
				}
			}
			for {
				b.tophash[i] = emptyRest
				if i == 0 {
					if b == bOrig {
						break // 初始桶开头，完成操作
					}
					// 找到前一个桶，从其最后一个条目继续。
					c := b
					for b = bOrig; b.overflow(t) != c; b = b.overflow(t) {
					}
					i = bucketCnt - 1
				} else {
					i--
				}
				if b.tophash[i] != emptyOne {
					break
				}
			}
		notLast:
			h.count--
			// 重置哈希种子，增加攻击者
			// 反复触发哈希碰撞的难度。见问题 25237。
			if h.count == 0 {
				h.hash0 = fastrand()
			}
			break search
		}
	}

	if h.flags&hashWriting == 0 {
		fatal("并发的 map 写操作")
	}
	h.flags &^= hashWriting
}

// mapiterinit 初始化用于遍历 map 的 hiter 结构体。
// 'it' 指向的 hiter 结构体由编译器
// 在栈上分配，或由 reflect_mapiterinit 在堆上分配。
// 两者都需要清零 hiter，因为结构体包含指针。
func mapiterinit(t *maptype, h *hmap, it *hiter) {
	if raceenabled && h != nil {
		callerpc := getcallerpc()
		racereadpc(unsafe.Pointer(h), callerpc, abi.FuncPCABIInternal(mapiterinit))
	}

	it.t = t
	if h == nil || h.count == 0 {
		return
	}

	if unsafe.Sizeof(hiter{})/goarch.PtrSize != 12 {
		throw("hash_iter 尺寸不正确") // 见 cmd/compile/internal/reflectdata/reflect.go
	}
	it.h = h

	// 获取桶状态快照
	it.B = h.B
	it.buckets = h.buckets
	if t.Bucket.PtrBytes == 0 {
		// 分配当前切片并记住当前和旧切片的指针。
		// 这能保持所有相关溢出桶存活，
		// 即使迭代期间表扩容和/或添加溢出桶。
		h.createOverflow()
		it.overflow = h.extra.overflow
		it.oldoverflow = h.extra.oldoverflow
	}

	// 决定起始位置
	var r uintptr
	if h.B > 31-bucketCntBits {
		r = uintptr(fastrand64())
	} else {
		r = uintptr(fastrand())
	}
	it.startBucket = r & bucketMask(h.B)
	it.offset = uint8(r >> h.B & (bucketCnt - 1))

	// 迭代器状态
	it.bucket = it.startBucket

	// 标记存在迭代器。
	// 可与另一个 mapiterinit() 并发执行。
	if old := h.flags; old&(iterator|oldIterator) != iterator|oldIterator {
		atomic.Or8(&h.flags, iterator|oldIterator)
	}

	mapiternext(it)
}

func mapiternext(it *hiter) {
	h := it.h
	if raceenabled {
		callerpc := getcallerpc()
		racereadpc(unsafe.Pointer(h), callerpc, abi.FuncPCABIInternal(mapiternext))
	}
	if h.flags&hashWriting != 0 {
		fatal("并发的 map 迭代和 map 写")
	}
	t := it.t
	bucket := it.bucket
	b := it.bptr
	i := it.i
	checkBucket := it.checkBucket

next:
	if b == nil {
		if bucket == it.startBucket && it.wrapped {
			// 迭代结束
			it.key = nil
			it.elem = nil
			return
		}
		if h.growing() && it.B == h.B {
			// 迭代器在扩容中途启动，且扩容尚未完成。
			// 如果正在查看的桶尚未填充（即旧桶未迁移），
			// 则需要遍历旧桶，仅返回会迁移到此桶的条目。
			oldbucket := bucket & it.h.oldbucketmask()
			b = (*bmap)(add(h.oldbuckets, oldbucket*uintptr(t.BucketSize)))
			if !evacuated(b) {
				checkBucket = bucket
			} else {
				b = (*bmap)(add(it.buckets, bucket*uintptr(t.BucketSize)))
				checkBucket = noCheck
			}
		} else {
			b = (*bmap)(add(it.buckets, bucket*uintptr(t.BucketSize)))
			checkBucket = noCheck
		}
		bucket++
		if bucket == bucketShift(it.B) {
			bucket = 0
			it.wrapped = true
		}
		i = 0
	}
	for ; i < bucketCnt; i++ {
		offi := (i + it.offset) & (bucketCnt - 1)
		if isEmpty(b.tophash[offi]) || b.tophash[offi] == evacuatedEmpty {
			// TODO：emptyRest 在此处难以使用，
			// 因为我们从桶中间开始迭代。可行但复杂。
			continue
		}
		k := add(unsafe.Pointer(b), dataOffset+uintptr(offi)*uintptr(t.KeySize))
		if t.IndirectKey() {
			k = *((*unsafe.Pointer)(k))
		}
		e := add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.KeySize)+uintptr(offi)*uintptr(t.ValueSize))
		if checkBucket != noCheck && !h.sameSizeGrow() {
			// 特殊情况：迭代器在扩容到更大尺寸时启动，
			// 且扩容尚未完成。我们正在处理的桶
			// 对应的旧桶尚未迁移。至少启动时未迁移。
			// 因此遍历旧桶，跳过会进入另一个新桶的键
			//（扩容时每个旧桶扩展为两个新桶）。
			if t.ReflexiveKey() || t.Key.Equal(k, k) {
				// 如果旧桶中的条目不属于
				// 当前迭代的新桶，跳过。
				hash := t.Hasher(k, uintptr(h.hash0))
				if hash&bucketMask(it.B) != checkBucket {
					continue
				}
			} else {
				// 如果 k != k（NaN），哈希不可重复。
				// 迁移时需要可重复且随机的方向选择。
				// 我们用 tophash 的最低位决定 NaN 的去向。
				// 注意：这就是我们需要两个迁移 tophash 值
				// evacuatedX 和 evacuatedY（最低位不同）的原因。
				if checkBucket>>(it.B-1) != uintptr(b.tophash[offi]&1) {
					continue
				}
			}
		}
		if (b.tophash[offi] != evacuatedX && b.tophash[offi] != evacuatedY) ||
			!(t.ReflexiveKey() || t.Key.Equal(k, k)) {
			// 这是原始数据，可以返回。
			// 或者
			// key!=key，条目无法被删除/更新，直接返回。
			// 很幸运，因为 key!=key 时无法成功查找。
			it.key = k
			if t.IndirectElem() {
				e = *((*unsafe.Pointer)(e))
			}
			it.elem = e
		} else {
			// 哈希表自迭代器启动后已扩容。
			// 此键的原始数据已在其他位置。
			// 检查当前哈希表获取数据。
			// 此代码处理键被删除、更新
			// 或删除后重新插入的情况。
			// 注意：需要重新获取键，因为它可能
			// 被更新为相等但不同的键（例如 +0.0 vs -0.0）。
			rk, re := mapaccessK(t, h, k)
			if rk == nil {
				continue // 键已被删除
			}
			it.key = rk
			it.elem = re
		}
		it.bucket = bucket
		if it.bptr != b { // 避免不必要的写屏障；见问题 14921
			it.bptr = b
		}
		it.i = i + 1
		it.checkBucket = checkBucket
		return
	}
	b = b.overflow(t)
	i = 0
	goto next
}

// mapclear 删除 map 中的所有键。
func mapclear(t *maptype, h *hmap) {
	if raceenabled && h != nil {
		callerpc := getcallerpc()
		pc := abi.FuncPCABIInternal(mapclear)
		racewritepc(unsafe.Pointer(h), callerpc, pc)
	}

	if h == nil || h.count == 0 {
		return
	}

	if h.flags&hashWriting != 0 {
		fatal("并发的 map 写操作")
	}

	h.flags ^= hashWriting

	// 标记桶为空，终止现有迭代器，见问题 #59411。
	markBucketsEmpty := func(bucket unsafe.Pointer, mask uintptr) {
		for i := uintptr(0); i <= mask; i++ {
			b := (*bmap)(add(bucket, i*uintptr(t.BucketSize)))
			for ; b != nil; b = b.overflow(t) {
				for i := uintptr(0); i < bucketCnt; i++ {
					b.tophash[i] = emptyRest
				}
			}
		}
	}
	markBucketsEmpty(h.buckets, bucketMask(h.B))
	if oldBuckets := h.oldbuckets; oldBuckets != nil {
		markBucketsEmpty(oldBuckets, h.oldbucketmask())
	}

	h.flags &^= sameSizeGrow
	h.oldbuckets = nil
	h.nevacuate = 0
	h.noverflow = 0
	h.count = 0

	// 重置哈希种子，增加攻击者
	// 反复触发哈希碰撞的难度。见问题 25237。
	h.hash0 = fastrand()

	// 保留 mapextra 分配，但清空额外信息。
	if h.extra != nil {
		*h.extra = mapextra{}
	}

	// makeBucketArray 清空 h.buckets 指向的内存，
	// 并恢复任何溢出桶，
	// 如同 h.buckets 是新分配的。
	_, nextOverflow := makeBucketArray(t, h.B, h.buckets)
	if nextOverflow != nil {
		// 如果创建了溢出桶，
		// h.extra 会在初始桶创建时分配。
		h.extra.nextOverflow = nextOverflow
	}

	if h.flags&hashWriting == 0 {
		fatal("并发的 map 写操作")
	}
	h.flags &^= hashWriting
}

func hashGrow(t *maptype, h *hmap) {
	// 如果达到负载因子，扩容。
	// 否则溢出桶过多，
	// 保持桶数量不变，横向“扩容”。
	bigger := uint8(1)
	if !overLoadFactor(h.count+1, h.B) {
		bigger = 0
		h.flags |= sameSizeGrow
	}
	oldbuckets := h.buckets
	newbuckets, nextOverflow := makeBucketArray(t, h.B+bigger, nil)

	flags := h.flags &^ (iterator | oldIterator)
	if h.flags&iterator != 0 {
		flags |= oldIterator
	}
	// 提交扩容（相对于 GC 原子操作）
	h.B += bigger
	h.flags = flags
	h.oldbuckets = oldbuckets
	h.buckets = newbuckets
	h.nevacuate = 0
	h.noverflow = 0

	if h.extra != nil && h.extra.overflow != nil {
		// 将当前溢出桶提升为旧一代。
		if h.extra.oldoverflow != nil {
			throw("oldoverflow 非空")
		}
		h.extra.oldoverflow = h.extra.overflow
		h.extra.overflow = nil
	}
	if nextOverflow != nil {
		if h.extra == nil {
			h.extra = new(mapextra)
		}
		h.extra.nextOverflow = nextOverflow
	}

	// 哈希表数据的实际复制
	// 由 growWork() 和 evacuate() 增量完成。
}

// overLoadFactor 判断 count 个元素放入 1<<B 个桶是否超过负载因子。
func overLoadFactor(count int, B uint8) bool {
	return count > bucketCnt && uintptr(count) > loadFactorNum*(bucketShift(B)/loadFactorDen)
}

// tooManyOverflowBuckets 判断对于 1<<B 个桶的 map，
// 溢出桶数量是否过多。
// 注意：大部分溢出桶必须是稀疏使用的；
// 如果密集使用，已经触发常规 map 扩容。
func tooManyOverflowBuckets(noverflow uint16, B uint8) bool {
	// 阈值太低会做多余工作。
	// 阈值太高，频繁扩容缩容的 map 会占用大量未使用内存。
	// “过多”指溢出桶数量近似等于常规桶数量。
	// 详情见 incrnoverflow。
	if B > 15 {
		B = 15
	}
	// 编译器无法识别 B < 16；掩码 B 生成更短的移位代码。
	return noverflow >= uint16(1)<<(B&15)
}

// growing 判断 h 是否正在扩容。扩容可能是同尺寸或更大尺寸。
func (h *hmap) growing() bool {
	return h.oldbuckets != nil
}

// sameSizeGrow 判断当前扩容是否为相同尺寸的 map。
func (h *hmap) sameSizeGrow() bool {
	return h.flags&sameSizeGrow != 0
}

// noldbuckets 计算当前 map 扩容前的桶数量。
func (h *hmap) noldbuckets() uintptr {
	oldB := h.B
	if !h.sameSizeGrow() {
		oldB--
	}
	return bucketShift(oldB)
}

// oldbucketmask 提供掩码，用于计算 n % noldbuckets()。
func (h *hmap) oldbucketmask() uintptr {
	return h.noldbuckets() - 1
}

func growWork(t *maptype, h *hmap, bucket uintptr) {
	// 确保迁移即将使用的桶
	// 对应的旧桶
	evacuate(t, h, bucket&h.oldbucketmask())

	// 再迁移一个旧桶，推进扩容进度
	if h.growing() {
		evacuate(t, h, h.nevacuate)
	}
}

func bucketEvacuated(t *maptype, h *hmap, bucket uintptr) bool {
	b := (*bmap)(add(h.oldbuckets, bucket*uintptr(t.BucketSize)))
	return evacuated(b)
}

// evacDst 是迁移目标。
type evacDst struct {
	b *bmap          // 当前目标桶
	i int            // 桶内键/值索引
	k unsafe.Pointer // 当前键存储指针
	e unsafe.Pointer // 当前值存储指针
}

func evacuate(t *maptype, h *hmap, oldbucket uintptr) {
	b := (*bmap)(add(h.oldbuckets, oldbucket*uintptr(t.BucketSize)))
	newbit := h.noldbuckets()
	if !evacuated(b) {
		// TODO：如果没有迭代器使用旧桶，复用溢出桶而非新建。
		//（即 !oldIterator 时）

		// xy 包含 x 和 y（低位/高位）迁移目标。
		var xy [2]evacDst
		x := &xy[0]
		x.b = (*bmap)(add(h.buckets, oldbucket*uintptr(t.BucketSize)))
		x.k = add(unsafe.Pointer(x.b), dataOffset)
		x.e = add(x.k, bucketCnt*uintptr(t.KeySize))

		if !h.sameSizeGrow() {
			// 仅在扩容更大时计算 y 指针。
			// 否则 GC 会看到无效指针。
			y := &xy[1]
			y.b = (*bmap)(add(h.buckets, (oldbucket+newbit)*uintptr(t.BucketSize)))
			y.k = add(unsafe.Pointer(y.b), dataOffset)
			y.e = add(y.k, bucketCnt*uintptr(t.KeySize))
		}

		for ; b != nil; b = b.overflow(t) {
			k := add(unsafe.Pointer(b), dataOffset)
			e := add(k, bucketCnt*uintptr(t.KeySize))
			for i := 0; i < bucketCnt; i, k, e = i+1, add(k, uintptr(t.KeySize)), add(e, uintptr(t.ValueSize)) {
				top := b.tophash[i]
				if isEmpty(top) {
					b.tophash[i] = evacuatedEmpty
					continue
				}
				if top < minTopHash {
					throw("错误的 map 状态")
				}
				k2 := k
				if t.IndirectKey() {
					k2 = *((*unsafe.Pointer)(k2))
				}
				var useY uint8
				if !h.sameSizeGrow() {
					// 计算哈希决定迁移方向
					//（将键/值发送到桶 x 还是 y）。
					hash := t.Hasher(k2, uintptr(h.hash0))
					if h.flags&iterator != 0 && !t.ReflexiveKey() && !t.Key.Equal(k2, k2) {
						// 如果键 != 键（NaN），哈希可能
						// 与旧哈希完全不同，且不可重复。
						// 存在迭代器时需要可重复性，
						// 迁移决策必须与迭代器一致。
						// 幸运的是，我们可以将这些键发送到任意方向。
						// 此外，tophash 对此类键无意义。
						// 用 tophash 最低位决定迁移方向。
						// 重新计算新的随机 tophash，
						// 多次扩容后这些键会均匀分布。
						useY = top & 1
						top = tophash(hash)
					} else {
						if hash&newbit != 0 {
							useY = 1
						}
					}
				}

				if evacuatedX+1 != evacuatedY || evacuatedX^1 != evacuatedY {
					throw("错误的 evacuatedN")
				}

				b.tophash[i] = evacuatedX + useY // evacuatedX + 1 == evacuatedY
				dst := &xy[useY]                 // 迁移目标

				if dst.i == bucketCnt {
					dst.b = h.newoverflow(t, dst.b)
					dst.i = 0
					dst.k = add(unsafe.Pointer(dst.b), dataOffset)
					dst.e = add(dst.k, bucketCnt*uintptr(t.KeySize))
				}
				dst.b.tophash[dst.i&(bucketCnt-1)] = top // 掩码 dst.i 优化，避免边界检查
				if t.IndirectKey() {
					*(*unsafe.Pointer)(dst.k) = k2 // 复制指针
				} else {
					typedmemmove(t.Key, dst.k, k) // 复制值
				}
				if t.IndirectElem() {
					*(*unsafe.Pointer)(dst.e) = *(*unsafe.Pointer)(e)
				} else {
					typedmemmove(t.Elem, dst.e, e)
				}
				dst.i++
				// 这些更新可能让指针超出键/值数组末尾，
				// 没关系，桶末尾的溢出指针会保护指针不越界。
				dst.k = add(dst.k, uintptr(t.KeySize))
				dst.e = add(dst.e, uintptr(t.ValueSize))
			}
		}
		// 解除溢出桶链接并清空键/值，辅助 GC。
		if h.flags&oldIterator == 0 && t.Bucket.PtrBytes != 0 {
			b := add(h.oldbuckets, oldbucket*uintptr(t.BucketSize))
			// 保留 b.tophash，因为迁移状态
			// 存储在此处。
			ptr := add(b, dataOffset)
			n := uintptr(t.BucketSize) - dataOffset
			memclrHasPointers(ptr, n)
		}
	}

	if oldbucket == h.nevacuate {
		advanceEvacuationMark(h, t, newbit)
	}
}

func advanceEvacuationMark(h *hmap, t *maptype, newbit uintptr) {
	h.nevacuate++
	// 实验表明 1024 远超所需。
	// 仍作为保障放入，确保 O(1) 行为。
	stop := h.nevacuate + 1024
	if stop > newbit {
		stop = newbit
	}
	for h.nevacuate != stop && bucketEvacuated(t, h, h.nevacuate) {
		h.nevacuate++
	}
	if h.nevacuate == newbit { // newbit == 旧桶数量
		// 扩容完成。释放旧主桶数组。
		h.oldbuckets = nil
		// 也可以释放旧溢出桶。
		// 如果仍被迭代器引用，
		// 迭代器持有切片指针。
		if h.extra != nil {
			h.extra.oldoverflow = nil
		}
		h.flags &^= sameSizeGrow
	}
}

// 反射桩函数。由 ../reflect/asm_*.s 调用

//go:linkname reflect_makemap reflect.makemap
func reflect_makemap(t *maptype, cap int) *hmap {
	// 检查不变量和反射计算。
	if t.Key.Equal == nil {
		throw("runtime.reflect_makemap: 不支持的 map 键类型")
	}
	if t.Key.Size_ > maxKeySize && (!t.IndirectKey() || t.KeySize != uint8(goarch.PtrSize)) ||
		t.Key.Size_ <= maxKeySize && (t.IndirectKey() || t.KeySize != uint8(t.Key.Size_)) {
		throw("键尺寸错误")
	}
	if t.Elem.Size_ > maxElemSize && (!t.IndirectElem() || t.ValueSize != uint8(goarch.PtrSize)) ||
		t.Elem.Size_ <= maxElemSize && (t.IndirectElem() || t.ValueSize != uint8(t.Elem.Size_)) {
		throw("值尺寸错误")
	}
	if t.Key.Align_ > bucketCnt {
		throw("键对齐过大")
	}
	if t.Elem.Align_ > bucketCnt {
		throw("值对齐过大")
	}
	if t.Key.Size_%uintptr(t.Key.Align_) != 0 {
		throw("键尺寸不是键对齐的倍数")
	}
	if t.Elem.Size_%uintptr(t.Elem.Align_) != 0 {
		throw("值尺寸不是值对齐的倍数")
	}
	if bucketCnt < 8 {
		throw("桶尺寸过小，无法正确对齐")
	}
	if dataOffset%uintptr(t.Key.Align_) != 0 {
		throw("桶需要键填充")
	}
	if dataOffset%uintptr(t.Elem.Align_) != 0 {
		throw("桶需要值填充")
	}

	return makemap(t, cap, nil)
}

//go:linkname reflect_mapaccess reflect.mapaccess
func reflect_mapaccess(t *maptype, h *hmap, key unsafe.Pointer) unsafe.Pointer {
	elem, ok := mapaccess2(t, h, key)
	if !ok {
		// 反射需要 nil 表示缺失元素
		elem = nil
	}
	return elem
}

//go:linkname reflect_mapaccess_faststr reflect.mapaccess_faststr
func reflect_mapaccess_faststr(t *maptype, h *hmap, key string) unsafe.Pointer {
	elem, ok := mapaccess2_faststr(t, h, key)
	if !ok {
		// 反射需要 nil 表示缺失元素
		elem = nil
	}
	return elem
}

//go:linkname reflect_mapassign reflect.mapassign0
func reflect_mapassign(t *maptype, h *hmap, key unsafe.Pointer, elem unsafe.Pointer) {
	p := mapassign(t, h, key)
	typedmemmove(t.Elem, p, elem)
}

//go:linkname reflect_mapassign_faststr reflect.mapassign_faststr0
func reflect_mapassign_faststr(t *maptype, h *hmap, key string, elem unsafe.Pointer) {
	p := mapassign_faststr(t, h, key)
	typedmemmove(t.Elem, p, elem)
}

//go:linkname reflect_mapdelete reflect.mapdelete
func reflect_mapdelete(t *maptype, h *hmap, key unsafe.Pointer) {
	mapdelete(t, h, key)
}

//go:linkname reflect_mapdelete_faststr reflect.mapdelete_faststr
func reflect_mapdelete_faststr(t *maptype, h *hmap, key string) {
	mapdelete_faststr(t, h, key)
}

//go:linkname reflect_mapiterinit reflect.mapiterinit
func reflect_mapiterinit(t *maptype, h *hmap, it *hiter) {
	mapiterinit(t, h, it)
}

//go:linkname reflect_mapiternext reflect.mapiternext
func reflect_mapiternext(it *hiter) {
	mapiternext(it)
}

//go:linkname reflect_mapiterkey reflect.mapiterkey
func reflect_mapiterkey(it *hiter) unsafe.Pointer {
	return it.key
}

//go:linkname reflect_mapiterelem reflect.mapiterelem
func reflect_mapiterelem(it *hiter) unsafe.Pointer {
	return it.elem
}

//go:linkname reflect_maplen reflect.maplen
func reflect_maplen(h *hmap) int {
	if h == nil {
		return 0
	}
	if raceenabled {
		callerpc := getcallerpc()
		racereadpc(unsafe.Pointer(h), callerpc, abi.FuncPCABIInternal(reflect_maplen))
	}
	return h.count
}

//go:linkname reflect_mapclear reflect.mapclear
func reflect_mapclear(t *maptype, h *hmap) {
	mapclear(t, h)
}

//go:linkname reflectlite_maplen internal/reflectlite.maplen
func reflectlite_maplen(h *hmap) int {
	if h == nil {
		return 0
	}
	if raceenabled {
		callerpc := getcallerpc()
		racereadpc(unsafe.Pointer(h), callerpc, abi.FuncPCABIInternal(reflect_maplen))
	}
	return h.count
}

const maxZero = 1024 // 必须与 reflect/value.go:maxZero、cmd/compile/internal/gc/walk.go:zeroValSize 中的值匹配
var zeroVal [maxZero]byte

// mapinitnoop 是 Go 链接器已知的空函数；
// 如果某个全局 map（尺寸合适）被判定为无用，
// 链接器会将包初始化函数中的重定位
// 从 map 初始化函数重写为此符号。
// 用汇编定义，避免 instrumentation（覆盖率等）干扰。
func mapinitnoop()

// mapclone 实现 maps.Clone
//
//go:linkname mapclone maps.clone
func mapclone(m any) any {
	e := efaceOf(&m)
	e.data = unsafe.Pointer(mapclone2((*maptype)(unsafe.Pointer(e._type)), (*hmap)(e.data)))
	return m
}

// moveToBmap 将桶从 src 移动到 dst。
// 返回目标桶（溢出时返回新目标桶）
// 和下一个键/值的写入位置，pos == bucketCnt 表示需要写入溢出桶。
func moveToBmap(t *maptype, h *hmap, dst *bmap, pos int, src *bmap) (*bmap, int) {
	for i := 0; i < bucketCnt; i++ {
		if isEmpty(src.tophash[i]) {
			continue
		}

		for ; pos < bucketCnt; pos++ {
			if isEmpty(dst.tophash[pos]) {
				break
			}
		}

		if pos == bucketCnt {
			dst = h.newoverflow(t, dst)
			pos = 0
		}

		srcK := add(unsafe.Pointer(src), dataOffset+uintptr(i)*uintptr(t.KeySize))
		srcEle := add(unsafe.Pointer(src), dataOffset+bucketCnt*uintptr(t.KeySize)+uintptr(i)*uintptr(t.ValueSize))
		dstK := add(unsafe.Pointer(dst), dataOffset+uintptr(pos)*uintptr(t.KeySize))
		dstEle := add(unsafe.Pointer(dst), dataOffset+bucketCnt*uintptr(t.KeySize)+uintptr(pos)*uintptr(t.ValueSize))

		dst.tophash[pos] = src.tophash[i]
		if t.IndirectKey() {
			srcK = *(*unsafe.Pointer)(srcK)
			if t.NeedKeyUpdate() {
				kStore := newobject(t.Key)
				typedmemmove(t.Key, kStore, srcK)
				srcK = kStore
			}
			// 注意：如果 NeedKeyUpdate 为 false，
			// 存储键的内存是不可变的，可在原 map 和克隆间共享。
			*(*unsafe.Pointer)(dstK) = srcK
		} else {
			typedmemmove(t.Key, dstK, srcK)
		}
		if t.IndirectElem() {
			srcEle = *(*unsafe.Pointer)(srcEle)
			eStore := newobject(t.Elem)
			typedmemmove(t.Elem, eStore, srcEle)
			*(*unsafe.Pointer)(dstEle) = eStore
		} else {
			typedmemmove(t.Elem, dstEle, srcEle)
		}
		pos++
		h.count++
	}
	return dst, pos
}

func mapclone2(t *maptype, src *hmap) *hmap {
	dst := makemap(t, src.count, nil)
	dst.hash0 = src.hash0
	dst.nevacuate = 0
	// 标志位无需复制，新 map 无标志位。

	if src.count == 0 {
		return dst
	}

	if src.flags&hashWriting != 0 {
		fatal("并发的 map 克隆和 map 写")
	}

	if src.B == 0 && !(t.IndirectKey() && t.NeedKeyUpdate()) && !t.IndirectElem() {
		// 小 map 快速复制。
		dst.buckets = newobject(t.Bucket)
		dst.count = src.count
		typedmemmove(t.Bucket, dst.buckets, src.buckets)
		return dst
	}

	if dst.B == 0 {
		dst.buckets = newobject(t.Bucket)
	}
	dstArraySize := int(bucketShift(dst.B))
	srcArraySize := int(bucketShift(src.B))
	for i := 0; i < dstArraySize; i++ {
		dstBmap := (*bmap)(add(dst.buckets, uintptr(i*int(t.BucketSize))))
		pos := 0
		for j := 0; j < srcArraySize; j += dstArraySize {
			srcBmap := (*bmap)(add(src.buckets, uintptr((i+j)*int(t.BucketSize))))
			for srcBmap != nil {
				dstBmap, pos = moveToBmap(t, dst, dstBmap, pos, srcBmap)
				srcBmap = srcBmap.overflow(t)
			}
		}
	}

	if src.oldbuckets == nil {
		return dst
	}

	oldB := src.B
	srcOldbuckets := src.oldbuckets
	if !src.sameSizeGrow() {
		oldB--
	}
	oldSrcArraySize := int(bucketShift(oldB))

	for i := 0; i < oldSrcArraySize; i++ {
		srcBmap := (*bmap)(add(srcOldbuckets, uintptr(i*int(t.BucketSize))))
		if evacuated(srcBmap) {
			continue
		}

		if oldB >= dst.B { // 目标桶主位宽小于源旧桶位宽
			dstBmap := (*bmap)(add(dst.buckets, (uintptr(i)&bucketMask(dst.B))*uintptr(t.BucketSize)))
			for dstBmap.overflow(t) != nil {
				dstBmap = dstBmap.overflow(t)
			}
			pos := 0
			for srcBmap != nil {
				dstBmap, pos = moveToBmap(t, dst, dstBmap, pos, srcBmap)
				srcBmap = srcBmap.overflow(t)
			}
			continue
		}

		// oldB < dst.B，单个源桶可能分到多个目标桶。
		// 逐条目处理。
		for srcBmap != nil {
			// 从旧桶移动到新桶
			for i := uintptr(0); i < bucketCnt; i++ {
				if isEmpty(srcBmap.tophash[i]) {
					continue
				}

				if src.flags&hashWriting != 0 {
					fatal("并发的 map 克隆和 map 写")
				}

				srcK := add(unsafe.Pointer(srcBmap), dataOffset+i*uintptr(t.KeySize))
				if t.IndirectKey() {
					srcK = *((*unsafe.Pointer)(srcK))
				}

				srcEle := add(unsafe.Pointer(srcBmap), dataOffset+bucketCnt*uintptr(t.KeySize)+i*uintptr(t.ValueSize))
				if t.IndirectElem() {
					srcEle = *((*unsafe.Pointer)(srcEle))
				}
				dstEle := mapassign(t, dst, srcK)
				typedmemmove(t.Elem, dstEle, srcEle)
			}
			srcBmap = srcBmap.overflow(t)
		}
	}
	return dst
}

// keys 实现 maps.keys
//
//go:linkname keys maps.keys
func keys(m any, p unsafe.Pointer) {
	e := efaceOf(&m)
	t := (*maptype)(unsafe.Pointer(e._type))
	h := (*hmap)(e.data)

	if h == nil || h.count == 0 {
		return
	}
	s := (*slice)(p)
	r := int(fastrand())
	offset := uint8(r >> h.B & (bucketCnt - 1))
	if h.B == 0 {
		copyKeys(t, h, (*bmap)(h.buckets), s, offset)
		return
	}
	arraySize := int(bucketShift(h.B))
	buckets := h.buckets
	for i := 0; i < arraySize; i++ {
		bucket := (i + r) & (arraySize - 1)
		b := (*bmap)(add(buckets, uintptr(bucket)*uintptr(t.BucketSize)))
		copyKeys(t, h, b, s, offset)
	}

	if h.growing() {
		oldArraySize := int(h.noldbuckets())
		for i := 0; i < oldArraySize; i++ {
			bucket := (i + r) & (oldArraySize - 1)
			b := (*bmap)(add(h.oldbuckets, uintptr(bucket)*uintptr(t.BucketSize)))
			if evacuated(b) {
				continue
			}
			copyKeys(t, h, b, s, offset)
		}
	}
	return
}

func copyKeys(t *maptype, h *hmap, b *bmap, s *slice, offset uint8) {
	for b != nil {
		for i := uintptr(0); i < bucketCnt; i++ {
			offi := (i + uintptr(offset)) & (bucketCnt - 1)
			if isEmpty(b.tophash[offi]) {
				continue
			}
			if h.flags&hashWriting != 0 {
				fatal("并发的 map 读和 map 写")
			}
			k := add(unsafe.Pointer(b), dataOffset+offi*uintptr(t.KeySize))
			if t.IndirectKey() {
				k = *((*unsafe.Pointer)(k))
			}
			if s.len >= s.cap {
				fatal("并发的 map 读和 map 写")
			}
			typedmemmove(t.Key, add(s.array, uintptr(s.len)*uintptr(t.KeySize)), k)
			s.len++
		}
		b = b.overflow(t)
	}
}

// values 实现 maps.values
//
//go:linkname values maps.values
func values(m any, p unsafe.Pointer) {
	e := efaceOf(&m)
	t := (*maptype)(unsafe.Pointer(e._type))
	h := (*hmap)(e.data)
	if h == nil || h.count == 0 {
		return
	}
	s := (*slice)(p)
	r := int(fastrand())
	offset := uint8(r >> h.B & (bucketCnt - 1))
	if h.B == 0 {
		copyValues(t, h, (*bmap)(h.buckets), s, offset)
		return
	}
	arraySize := int(bucketShift(h.B))
	buckets := h.buckets
	for i := 0; i < arraySize; i++ {
		bucket := (i + r) & (arraySize - 1)
		b := (*bmap)(add(buckets, uintptr(bucket)*uintptr(t.BucketSize)))
		copyValues(t, h, b, s, offset)
	}

	if h.growing() {
		oldArraySize := int(h.noldbuckets())
		for i := 0; i < oldArraySize; i++ {
			bucket := (i + r) & (oldArraySize - 1)
			b := (*bmap)(add(h.oldbuckets, uintptr(bucket)*uintptr(t.BucketSize)))
			if evacuated(b) {
				continue
			}
			copyValues(t, h, b, s, offset)
		}
	}
	return
}

func copyValues(t *maptype, h *hmap, b *bmap, s *slice, offset uint8) {
	for b != nil {
		for i := uintptr(0); i < bucketCnt; i++ {
			offi := (i + uintptr(offset)) & (bucketCnt - 1)
			if isEmpty(b.tophash[offi]) {
				continue
			}

			if h.flags&hashWriting != 0 {
				fatal("并发的 map 读和 map 写")
			}

			ele := add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.KeySize)+offi*uintptr(t.ValueSize))
			if t.IndirectElem() {
				ele = *((*unsafe.Pointer)(ele))
			}
			if s.len >= s.cap {
				fatal("并发的 map 读和 map 写")
			}
			typedmemmove(t.Elem, add(s.array, uintptr(s.len)*uintptr(t.ValueSize)), ele)
			s.len++
		}
		b = b.overflow(t)
	}
}
```