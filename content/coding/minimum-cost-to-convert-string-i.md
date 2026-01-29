---
title: 2976. 转换字符串的最小成本 I
aliases: f65764e4-cccd-4981-a226-250b7cc497b6
date: 2026-01-29 20:08:50
card: true
order:
tags: [最短路, Floyd, Dijkstra]
---

![[Pasted image 20260129201550.png]]

```go
func minimumCost(source string, target string, original []byte, changed []byte, cost []int) int64 {
    const INF = math.MaxInt / 2

    G := make([][]int64, 26)
    for i := range G {
        G[i] = make([]int64, 26)
        for j := range G[i] {
            G[i][j] = INF
        }
        G[i][i] = 0
    }

    for i, c := range cost {
		x := original[i] - 'a'
		y := changed[i] - 'a'
		G[x][y] = min(G[x][y], int64(c))
	}

    for k := 0; k < 26; k++ {
        for i := 0; i < 26; i++ {
            if G[i][k] == INF {
                continue
            }

            for j := 0; j < 26; j++ {
                if G[k][j] == INF {
                    continue
                }

                G[i][j] = min(G[i][j], G[i][k] + G[k][j])
            }
        }
    }

    var total int64
    for i, _source := range source {
        x := _source - 'a'
        y := target[i] - 'a'

        if G[x][y] == INF {
            return -1
        }

        total += G[x][y]
    }

    return total
}
```