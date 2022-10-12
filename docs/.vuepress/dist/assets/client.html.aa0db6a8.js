import{_ as n}from"./plugin-vue_export-helper.21dcd24c.js";import{o as s,c as a,a as t}from"./app.5d82fd04.js";const e={},p=t(`<h2 id="\u5BA2\u6237\u7AEF" tabindex="-1"><a class="header-anchor" href="#\u5BA2\u6237\u7AEF" aria-hidden="true">#</a> \u5BA2\u6237\u7AEF</h2><p>\u867D\u7136\u57FA\u672C\u529F\u80FD\u5DF2\u7ECF\u5B8C\u6210\u4E86\uFF0C\u4F46\u662F\u4E0D\u81F3\u4E8E\u8BF4\u8BA9\u771F\u6B63\u7684\u7528\u6237\u4E5F\u6839\u636E\u8FD9\u4E48\u591A\u8981\u6C42\u8FDB\u884C\u8F93\u5165\u3002\u6211\u4EEC\u53EF\u4EE5\u5F00\u542F\u4E00\u4E2A\u5BA2\u6237\u7AEF\uFF0C\u63D0\u4F9B\u66F4\u52A0\u7B80\u5355\u7684\u65B9\u6CD5\u5171\u7528\u6237\u4F7F\u7528\u3002</p><p>\uFF08\u521B\u5EFA <code>client.go</code>\uFF09</p><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token keyword">package</span> main

<span class="token keyword">import</span> <span class="token punctuation">(</span>
	<span class="token string">&quot;fmt&quot;</span>
	<span class="token string">&quot;io&quot;</span>
	<span class="token string">&quot;net&quot;</span>
	<span class="token string">&quot;os&quot;</span>
<span class="token punctuation">)</span>

<span class="token keyword">type</span> Client <span class="token keyword">struct</span> <span class="token punctuation">{</span>
	ServerIp   <span class="token builtin">string</span>
	ServerPort <span class="token builtin">int</span>
	Name       <span class="token builtin">string</span>
	conn       net<span class="token punctuation">.</span>Conn
	code       <span class="token builtin">int</span> <span class="token comment">// \u5F53\u524D\u6A21\u5F0F</span>
<span class="token punctuation">}</span>

<span class="token keyword">func</span> <span class="token function">NewClient</span><span class="token punctuation">(</span>serverIp <span class="token builtin">string</span><span class="token punctuation">,</span> serverPort <span class="token builtin">int</span><span class="token punctuation">)</span> <span class="token operator">*</span>Client <span class="token punctuation">{</span>
	client <span class="token operator">:=</span> <span class="token operator">&amp;</span>Client<span class="token punctuation">{</span>
		ServerIp<span class="token punctuation">:</span>   serverIp<span class="token punctuation">,</span>
		ServerPort<span class="token punctuation">:</span> serverPort<span class="token punctuation">,</span>
		code<span class="token punctuation">:</span>       <span class="token number">999</span><span class="token punctuation">,</span>
	<span class="token punctuation">}</span>

	conn<span class="token punctuation">,</span> err <span class="token operator">:=</span> net<span class="token punctuation">.</span><span class="token function">Dial</span><span class="token punctuation">(</span><span class="token string">&quot;tcp&quot;</span><span class="token punctuation">,</span> fmt<span class="token punctuation">.</span><span class="token function">Sprintf</span><span class="token punctuation">(</span><span class="token string">&quot;%s:%d&quot;</span><span class="token punctuation">,</span> serverIp<span class="token punctuation">,</span> serverPort<span class="token punctuation">)</span><span class="token punctuation">)</span>
	<span class="token keyword">if</span> err <span class="token operator">!=</span> <span class="token boolean">nil</span> <span class="token punctuation">{</span>
		fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;net.Dial err:&quot;</span><span class="token punctuation">,</span> err<span class="token punctuation">)</span>
		<span class="token keyword">return</span> <span class="token boolean">nil</span>
	<span class="token punctuation">}</span>

	client<span class="token punctuation">.</span>conn <span class="token operator">=</span> conn

	<span class="token keyword">return</span> client
<span class="token punctuation">}</span>

<span class="token keyword">func</span> <span class="token punctuation">(</span>client <span class="token operator">*</span>Client<span class="token punctuation">)</span> <span class="token function">Run</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
	<span class="token keyword">for</span> client<span class="token punctuation">.</span>code <span class="token operator">!=</span> <span class="token number">0</span> <span class="token punctuation">{</span>
	<span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token comment">// \u5904\u7406 server \u56DE\u5E94\u7684\u6570\u636E\uFF0C\u76F4\u63A5\u663E\u793A\u5230\u4FBF\u51C6\u8F93\u51FA\u5373\u53EF</span>
<span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>Client<span class="token punctuation">)</span> <span class="token function">DealResponse</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
	<span class="token comment">// \u4E00\u65E6 client.conn \u6709\u6570\u636E\uFF0C\u5C31\u76F4\u63A5 copy \u5230 stdout \u6807\u51C6\u8F93\u51FA\u4E0A</span>
	<span class="token comment">// \u6C38\u4E45\u963B\u585E\u76D1\u542C</span>
	io<span class="token punctuation">.</span><span class="token function">Copy</span><span class="token punctuation">(</span>os<span class="token punctuation">.</span>Stdout<span class="token punctuation">,</span> this<span class="token punctuation">.</span>conn<span class="token punctuation">)</span>

	<span class="token comment">// \u4E0A\u4E0B\u4E24\u79CD\u5199\u6CD5\u7684\u6548\u679C\u7B49\u4EF7</span>
	<span class="token comment">//for {</span>
	<span class="token comment">//	buf := make([]byte, 4096)</span>
	<span class="token comment">//	client.conn.Read(buf)</span>
	<span class="token comment">//	fmt.Println(buf)</span>
	<span class="token comment">//}</span>
<span class="token punctuation">}</span>

<span class="token keyword">func</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
	client <span class="token operator">:=</span> <span class="token function">NewClient</span><span class="token punctuation">(</span><span class="token string">&quot;127.0.0.1&quot;</span><span class="token punctuation">,</span> <span class="token number">8888</span><span class="token punctuation">)</span>
	<span class="token keyword">if</span> client <span class="token operator">==</span> <span class="token boolean">nil</span> <span class="token punctuation">{</span>
		fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;&gt;&gt;&gt;\u670D\u52A1\u5668\u8FDE\u63A5\u5931\u8D25...&quot;</span><span class="token punctuation">)</span>
		<span class="token keyword">return</span>
	<span class="token punctuation">}</span>

	<span class="token comment">// \u5355\u72EC\u5F00\u542F\u4E00\u4E2A goroutine \u53BB\u5904\u7406 server \u7684\u56DE\u6267\u6D88\u606F</span>
	<span class="token keyword">go</span> client<span class="token punctuation">.</span><span class="token function">DealResponse</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
	client<span class="token punctuation">.</span><span class="token function">Run</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="\u5BA2\u6237\u7AEF\u8BF7\u6C42" tabindex="-1"><a class="header-anchor" href="#\u5BA2\u6237\u7AEF\u8BF7\u6C42" aria-hidden="true">#</a> \u5BA2\u6237\u7AEF\u8BF7\u6C42</h2><p>\uFF08\u8865\u5145 <code>client.go</code>\uFF09</p><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>Client<span class="token punctuation">)</span> <span class="token function">Run</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token comment">// \u53EA\u8981\u5BA2\u6237\u7AEF\u8FD8\u5728\u7EBF\uFF0C\u5C31\u4F1A\u4E00\u76F4\u5FAA\u73AF\u6267\u884C</span>
	<span class="token keyword">for</span> this<span class="token punctuation">.</span>code <span class="token operator">!=</span> <span class="token number">0</span> <span class="token punctuation">{</span>
        
        <span class="token comment">// \u6BCF\u6B21\u90FD\u4F1A\u6253\u5370\u83DC\u5355\u4F9B\u7528\u6237\u9009\u62E9</span>
		<span class="token keyword">for</span> this<span class="token punctuation">.</span><span class="token function">menu</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">!=</span> <span class="token boolean">true</span> <span class="token punctuation">{</span>
		<span class="token punctuation">}</span>

        <span class="token comment">// \u7B49\u5F85\u7528\u6237\u7684\u9009\u62E9\u505A\u51FA\u76F8\u5173\u54CD\u5E94</span>
		<span class="token keyword">switch</span> this<span class="token punctuation">.</span>code <span class="token punctuation">{</span>
		<span class="token keyword">case</span> Rename<span class="token punctuation">:</span>
			fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;\u66F4\u6539\u7528\u6237\u540D&quot;</span><span class="token punctuation">)</span>
			<span class="token keyword">break</span>
		<span class="token keyword">case</span> PrivateChat<span class="token punctuation">:</span>
			fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;\u79C1\u804A\u6A21\u5F0F&quot;</span><span class="token punctuation">)</span>
			<span class="token keyword">break</span>
		<span class="token keyword">case</span> PublicChat<span class="token punctuation">:</span>
			fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;\u516C\u804A\u6A21\u5F0F&quot;</span><span class="token punctuation">)</span>
			<span class="token keyword">break</span>
		<span class="token punctuation">}</span>
	<span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>Client<span class="token punctuation">)</span> <span class="token function">menu</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token builtin">bool</span> <span class="token punctuation">{</span>
	<span class="token keyword">var</span> code <span class="token builtin">int</span>

	fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;1.\u66F4\u6539\u7528\u6237\u540D&quot;</span><span class="token punctuation">)</span>
	fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;2.\u79C1\u804A\u6A21\u5F0F&quot;</span><span class="token punctuation">)</span>
	fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;3.\u516C\u804A\u6A21\u5F0F&quot;</span><span class="token punctuation">)</span>
	fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;0.\u9000\u51FA&quot;</span><span class="token punctuation">)</span>

	fmt<span class="token punctuation">.</span><span class="token function">Scanln</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>code<span class="token punctuation">)</span>

	<span class="token keyword">if</span> code <span class="token operator">&gt;=</span> <span class="token number">0</span> <span class="token operator">&amp;&amp;</span> code <span class="token operator">&lt;=</span> <span class="token number">3</span> <span class="token punctuation">{</span>
		this<span class="token punctuation">.</span>code <span class="token operator">=</span> code
		<span class="token keyword">return</span> <span class="token boolean">true</span>
	<span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
		fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;&gt;&gt;&gt;\u8BF7\u8F93\u5165\u5408\u6CD5\u8303\u56F4\u5185\u7684\u6570\u5B57...&quot;</span><span class="token punctuation">)</span>
		<span class="token keyword">return</span> <span class="token boolean">false</span>
	<span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="\u6539\u540D\u529F\u80FD" tabindex="-1"><a class="header-anchor" href="#\u6539\u540D\u529F\u80FD" aria-hidden="true">#</a> \u6539\u540D\u529F\u80FD</h2><p>\uFF08\u4FEE\u6539 <code>client.go/Run()</code>\uFF09</p><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>Client<span class="token punctuation">)</span> <span class="token function">Run</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
	<span class="token operator">...</span>

		<span class="token keyword">switch</span> this<span class="token punctuation">.</span>code <span class="token punctuation">{</span>
		<span class="token keyword">case</span> Rename<span class="token punctuation">:</span>
			fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;\u66F4\u6539\u7528\u6237\u540D&quot;</span><span class="token punctuation">)</span>
			this<span class="token punctuation">.</span><span class="token function">Rename</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
			<span class="token keyword">break</span>
            
	<span class="token operator">...</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>\uFF08\u6DFB\u52A0 <code>client.go/Rename()</code>\uFF09</p><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token comment">// Rename \u4FEE\u6539\u7528\u6237\u540D</span>
<span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>Client<span class="token punctuation">)</span> <span class="token function">Rename</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
	fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;&gt;&gt;&gt;\u8BF7\u8F93\u5165\u7528\u6237\u540D...&quot;</span><span class="token punctuation">)</span>

	<span class="token keyword">var</span> newName <span class="token builtin">string</span>
	fmt<span class="token punctuation">.</span><span class="token function">Scanln</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>newName<span class="token punctuation">)</span>

	sendMsg <span class="token operator">:=</span> <span class="token string">&quot;rename|&quot;</span> <span class="token operator">+</span> newName <span class="token operator">+</span> <span class="token string">&quot;\\n&quot;</span>
	<span class="token boolean">_</span><span class="token punctuation">,</span> err <span class="token operator">:=</span> this<span class="token punctuation">.</span>conn<span class="token punctuation">.</span><span class="token function">Write</span><span class="token punctuation">(</span><span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token function">byte</span><span class="token punctuation">(</span>sendMsg<span class="token punctuation">)</span><span class="token punctuation">)</span>
	<span class="token keyword">if</span> err <span class="token operator">!=</span> <span class="token boolean">nil</span> <span class="token punctuation">{</span>
		fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;conn.Write err:&quot;</span><span class="token punctuation">,</span> err<span class="token punctuation">)</span>
		<span class="token keyword">return</span>
	<span class="token punctuation">}</span>

<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="\u79C1\u804A\u529F\u80FD" tabindex="-1"><a class="header-anchor" href="#\u79C1\u804A\u529F\u80FD" aria-hidden="true">#</a> \u79C1\u804A\u529F\u80FD</h2><p>\uFF08\u4FEE\u6539 <code>client.go/Run()</code>\uFF09</p><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>Client<span class="token punctuation">)</span> <span class="token function">Run</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
	<span class="token operator">...</span>
    <span class="token keyword">case</span> PrivateChat<span class="token punctuation">:</span>
			this<span class="token punctuation">.</span><span class="token function">PrivateChat</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
			<span class="token keyword">break</span>
    <span class="token operator">...</span>    
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="\u9009\u62E9\u7528\u6237" tabindex="-1"><a class="header-anchor" href="#\u9009\u62E9\u7528\u6237" aria-hidden="true">#</a> \u9009\u62E9\u7528\u6237</h3><p>\uFF08\u6DFB\u52A0 <code>client.go/SelectUsers()</code>\uFF09</p><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token comment">// SelectUsers \u67E5\u8BE2\u5728\u7EBF\u7528\u6237</span>
<span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>Client<span class="token punctuation">)</span> <span class="token function">SelectUsers</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
	sendMsg <span class="token operator">:=</span> <span class="token string">&quot;who\\n&quot;</span>
	<span class="token boolean">_</span><span class="token punctuation">,</span> err <span class="token operator">:=</span> this<span class="token punctuation">.</span>conn<span class="token punctuation">.</span><span class="token function">Write</span><span class="token punctuation">(</span><span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token function">byte</span><span class="token punctuation">(</span>sendMsg<span class="token punctuation">)</span><span class="token punctuation">)</span>

	<span class="token keyword">if</span> err <span class="token operator">!=</span> <span class="token boolean">nil</span> <span class="token punctuation">{</span>
		fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;con Write err:&quot;</span><span class="token punctuation">,</span> err<span class="token punctuation">)</span>
		<span class="token keyword">return</span>
	<span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="\u8FDB\u884C\u79C1\u804A" tabindex="-1"><a class="header-anchor" href="#\u8FDB\u884C\u79C1\u804A" aria-hidden="true">#</a> \u8FDB\u884C\u79C1\u804A</h3><p>\uFF08\u6DFB\u52A0 <code>client.go/PrivateChat()</code>\uFF09</p><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token comment">// \u5904\u7406 server \u56DE\u5E94\u7684\u6570\u636E\uFF0C\u76F4\u63A5\u663E\u793A\u5230\u4FBF\u51C6\u8F93\u51FA\u5373\u53EF</span>
<span class="token comment">// PrivateChat \u9009\u62E9\u7528\u6237\u8FDB\u884C\u79C1\u804A</span>
<span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>Client<span class="token punctuation">)</span> <span class="token function">PrivateChat</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
	<span class="token keyword">var</span> remoteName <span class="token builtin">string</span>
	chatMsg <span class="token operator">:=</span> <span class="token string">&quot;&quot;</span>

	this<span class="token punctuation">.</span><span class="token function">SelectUsers</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
	fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;&gt;&gt;&gt;\u8BF7\u8F93\u5165\u804A\u5929\u5BF9\u8C61[\u7528\u6237\u540D]\uFF0C\u56DE\u8F66\u9000\u51FA&quot;</span><span class="token punctuation">)</span>
	fmt<span class="token punctuation">.</span><span class="token function">Scanln</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>remoteName<span class="token punctuation">)</span>

	<span class="token keyword">for</span> remoteName <span class="token operator">!=</span> <span class="token string">&quot;&quot;</span> <span class="token operator">&amp;&amp;</span> chatMsg <span class="token operator">!=</span> <span class="token string">&quot;exit&quot;</span> <span class="token punctuation">{</span>

		fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;&gt;&gt;&gt;\u8BF7\u8F93\u5165\u804A\u5929\u5185\u5BB9\uFF0Cexit\u9000\u51FA.&quot;</span><span class="token punctuation">)</span>

		fmt<span class="token punctuation">.</span><span class="token function">Scanln</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>chatMsg<span class="token punctuation">)</span>

		<span class="token keyword">if</span> <span class="token function">len</span><span class="token punctuation">(</span>chatMsg<span class="token punctuation">)</span> <span class="token operator">!=</span> <span class="token number">0</span> <span class="token operator">&amp;&amp;</span> chatMsg <span class="token operator">!=</span> <span class="token string">&quot;exit&quot;</span> <span class="token punctuation">{</span>
			sendMsg <span class="token operator">:=</span> <span class="token string">&quot;to|&quot;</span> <span class="token operator">+</span> remoteName <span class="token operator">+</span> <span class="token string">&quot;|&quot;</span> <span class="token operator">+</span> chatMsg <span class="token operator">+</span> <span class="token string">&quot;\\n&quot;</span>
			<span class="token boolean">_</span><span class="token punctuation">,</span> err <span class="token operator">:=</span> this<span class="token punctuation">.</span>conn<span class="token punctuation">.</span><span class="token function">Write</span><span class="token punctuation">(</span><span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token function">byte</span><span class="token punctuation">(</span>sendMsg<span class="token punctuation">)</span><span class="token punctuation">)</span>
			<span class="token keyword">if</span> err <span class="token operator">!=</span> <span class="token boolean">nil</span> <span class="token punctuation">{</span>
				fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;conn Write err:&quot;</span><span class="token punctuation">,</span> err<span class="token punctuation">)</span>
				<span class="token keyword">break</span>
			<span class="token punctuation">}</span>
		<span class="token punctuation">}</span>

	<span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="\u516C\u804A\u529F\u80FD" tabindex="-1"><a class="header-anchor" href="#\u516C\u804A\u529F\u80FD" aria-hidden="true">#</a> \u516C\u804A\u529F\u80FD</h2><p>\uFF08\u4FEE\u6539 <code>client.go/Run()</code>\uFF09</p><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>Client<span class="token punctuation">)</span> <span class="token function">Run</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
	<span class="token operator">...</span>
    <span class="token keyword">case</span> PublicChat<span class="token punctuation">:</span> 
			this<span class="token punctuation">.</span><span class="token function">PublicChat</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
			<span class="token keyword">break</span>
    <span class="token operator">...</span>    
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>\uFF08\u6DFB\u52A0 <code>client.go/PublicChat()</code>\uFF09</p><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token comment">// PublicChat \u516C\u804A</span>
<span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>Client<span class="token punctuation">)</span> <span class="token function">PublicChat</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
	chatMsg <span class="token operator">:=</span> <span class="token string">&quot;&quot;</span>

	<span class="token keyword">for</span> chatMsg <span class="token operator">!=</span> <span class="token string">&quot;exit&quot;</span> <span class="token punctuation">{</span>

		fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;&gt;&gt;&gt;\u8BF7\u8F93\u5165\u804A\u5929\u5185\u5BB9\uFF0Cexit\u9000\u51FA.&quot;</span><span class="token punctuation">)</span>

		fmt<span class="token punctuation">.</span><span class="token function">Scanln</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>chatMsg<span class="token punctuation">)</span>

		<span class="token keyword">if</span> <span class="token function">len</span><span class="token punctuation">(</span>chatMsg<span class="token punctuation">)</span> <span class="token operator">!=</span> <span class="token number">0</span> <span class="token operator">&amp;&amp;</span> chatMsg <span class="token operator">!=</span> <span class="token string">&quot;exit&quot;</span> <span class="token punctuation">{</span>
			sendMsg <span class="token operator">:=</span> <span class="token string">&quot;pub|&quot;</span> <span class="token operator">+</span> chatMsg <span class="token operator">+</span> <span class="token string">&quot;\\n&quot;</span>
			<span class="token boolean">_</span><span class="token punctuation">,</span> err <span class="token operator">:=</span> this<span class="token punctuation">.</span>conn<span class="token punctuation">.</span><span class="token function">Write</span><span class="token punctuation">(</span><span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token function">byte</span><span class="token punctuation">(</span>sendMsg<span class="token punctuation">)</span><span class="token punctuation">)</span>
			<span class="token keyword">if</span> err <span class="token operator">!=</span> <span class="token boolean">nil</span> <span class="token punctuation">{</span>
				fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;conn Write err:&quot;</span><span class="token punctuation">,</span> err<span class="token punctuation">)</span>
				<span class="token keyword">break</span>
			<span class="token punctuation">}</span>
		<span class="token punctuation">}</span>

	<span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,26),o=[p];function c(i,l){return s(),a("div",null,o)}var k=n(e,[["render",c],["__file","client.html.vue"]]);export{k as default};
