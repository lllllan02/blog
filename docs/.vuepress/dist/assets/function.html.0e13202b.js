import{_ as n}from"./plugin-vue_export-helper.21dcd24c.js";import{o as s,c as a,a as t}from"./app.5d82fd04.js";var e="/assets/image-20220528002636146.c814b6fa.png";const p={},o=t(`<h2 id="\u63D0\u4F9B\u6539\u540D\u3001\u79C1\u804A\u3001\u516C\u804A\u529F\u80FD" tabindex="-1"><a class="header-anchor" href="#\u63D0\u4F9B\u6539\u540D\u3001\u79C1\u804A\u3001\u516C\u804A\u529F\u80FD" aria-hidden="true">#</a> \u63D0\u4F9B\u6539\u540D\u3001\u79C1\u804A\u3001\u516C\u804A\u529F\u80FD</h2><p>\u9700\u8981\u6839\u636E\u7528\u6237\u7684\u8F93\u5165\uFF0C\u53BB\u5224\u522B\u8BE5\u7528\u6237\u7684\u884C\u4E3A\u3002\u6211\u4EEC\u4E3A\u6B64\u521B\u5EFA <code>msg.go</code> \u5E76\u5B9A\u4E00\u4E2A\u65B0\u7684\u7C7B\u6765\u533A\u5206\u6216\u8005\u8BF4\u662F\u9274\u522B\u7528\u6237\u884C\u4E3A</p><h3 id="msg-\u7C7B" tabindex="-1"><a class="header-anchor" href="#msg-\u7C7B" aria-hidden="true">#</a> Msg \u7C7B</h3><ul><li>Msg \u7C7B\uFF0C\u5176\u4E2D str \u8868\u793A\u6574\u4E2A\u7528\u6237\u8F93\u5165\uFF0C\u5176\u4E2D code \u8868\u793A\u8BE5\u8F93\u5165\u7684\u884C\u4E3A\u7C7B\u522B</li><li>\u4E09\u4E2A\u5E38\u91CF\uFF0C\u5206\u522B\u662F\u6539\u540D\u3001\u79C1\u804A\u3001\u516C\u804A\u3001\u67E5\u8BE2\u5728\u7EBF\u7528\u6237\u7684\u4EE3\u53F7</li><li>calCode\uFF0C\u5728\u65B0\u5EFA Msg \u7684\u65F6\u5019\u4F1A\u6839\u636E\u7528\u6237\u7684\u8F93\u5165\u53BB\u5224\u5B9A\u7528\u6237\u884C\u4E3A</li></ul><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token keyword">package</span> main

<span class="token keyword">import</span> <span class="token string">&quot;strings&quot;</span>

<span class="token keyword">type</span> Msg <span class="token keyword">struct</span> <span class="token punctuation">{</span>
	str  <span class="token builtin">string</span>
	code <span class="token builtin">int</span>
<span class="token punctuation">}</span>

<span class="token keyword">const</span> <span class="token punctuation">(</span>
	Rename <span class="token operator">=</span> <span class="token boolean">iota</span> <span class="token operator">+</span> <span class="token number">1</span>
	PrivateChat
	PublicChat
	OnlineUserList
<span class="token punctuation">)</span>

<span class="token keyword">func</span> <span class="token function">NewMsg</span><span class="token punctuation">(</span>str <span class="token builtin">string</span><span class="token punctuation">)</span> <span class="token operator">*</span>Msg <span class="token punctuation">{</span>
	msg <span class="token operator">:=</span> <span class="token operator">&amp;</span>Msg<span class="token punctuation">{</span>
		str<span class="token punctuation">:</span>  str<span class="token punctuation">,</span>
		code<span class="token punctuation">:</span> <span class="token function">calCode</span><span class="token punctuation">(</span>str<span class="token punctuation">)</span><span class="token punctuation">,</span>
	<span class="token punctuation">}</span>

	<span class="token keyword">return</span> msg
<span class="token punctuation">}</span>

<span class="token comment">/*
	1 rename| \u6539\u540D
	2 to|toUser| \u79C1\u804A
	3 pub| \u516C\u804A
	0 &lt;else&gt; \u5176\u4ED6\u683C\u5F0F\u6682\u65F6\u4E0D\u7BA1
*/</span>
<span class="token keyword">func</span> <span class="token function">calCode</span><span class="token punctuation">(</span>str <span class="token builtin">string</span><span class="token punctuation">)</span> <span class="token builtin">int</span> <span class="token punctuation">{</span>
	n <span class="token operator">:=</span> <span class="token function">len</span><span class="token punctuation">(</span>strings<span class="token punctuation">.</span><span class="token function">Split</span><span class="token punctuation">(</span>str<span class="token punctuation">,</span> <span class="token string">&quot;|&quot;</span><span class="token punctuation">)</span><span class="token punctuation">)</span>

	<span class="token keyword">if</span> str <span class="token operator">==</span> <span class="token string">&quot;who&quot;</span> <span class="token punctuation">{</span>
		<span class="token keyword">return</span> OnlineUserList
	<span class="token punctuation">}</span>
    
	<span class="token keyword">if</span> <span class="token function">len</span><span class="token punctuation">(</span>str<span class="token punctuation">)</span> <span class="token operator">&gt;</span> <span class="token number">4</span> <span class="token operator">&amp;&amp;</span> str<span class="token punctuation">[</span><span class="token punctuation">:</span><span class="token number">4</span><span class="token punctuation">]</span> <span class="token operator">==</span> <span class="token string">&quot;pub|&quot;</span> <span class="token operator">&amp;&amp;</span> n <span class="token operator">==</span> <span class="token number">2</span> <span class="token punctuation">{</span>
		<span class="token keyword">return</span> PublicChat
	<span class="token punctuation">}</span>

	<span class="token keyword">if</span> <span class="token function">len</span><span class="token punctuation">(</span>str<span class="token punctuation">)</span> <span class="token operator">&gt;</span> <span class="token number">5</span> <span class="token operator">&amp;&amp;</span> str<span class="token punctuation">[</span><span class="token punctuation">:</span><span class="token number">3</span><span class="token punctuation">]</span> <span class="token operator">==</span> <span class="token string">&quot;to|&quot;</span> <span class="token operator">&amp;&amp;</span> n <span class="token operator">==</span> <span class="token number">3</span> <span class="token punctuation">{</span>
		<span class="token keyword">return</span> PrivateChat
	<span class="token punctuation">}</span>

	<span class="token keyword">if</span> <span class="token function">len</span><span class="token punctuation">(</span>str<span class="token punctuation">)</span> <span class="token operator">&gt;</span> <span class="token number">7</span> <span class="token operator">&amp;&amp;</span> str<span class="token punctuation">[</span><span class="token punctuation">:</span><span class="token number">7</span><span class="token punctuation">]</span> <span class="token operator">==</span> <span class="token string">&quot;rename|&quot;</span> <span class="token operator">&amp;&amp;</span> n <span class="token operator">==</span> <span class="token number">2</span> <span class="token punctuation">{</span>
		<span class="token keyword">return</span> Rename
	<span class="token punctuation">}</span>

	<span class="token keyword">return</span> <span class="token number">0</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="\u8F93\u5165\u76D1\u542C" tabindex="-1"><a class="header-anchor" href="#\u8F93\u5165\u76D1\u542C" aria-hidden="true">#</a> \u8F93\u5165\u76D1\u542C</h3><p>\uFF08\u8865\u5145 <code>user.go/ListenWrite()</code> \u65B9\u6CD5\uFF09\uFF0C\u4E3A\u6BCF\u4E2A\u7528\u6237\u7684\u8F93\u5165\u5206\u914D\u4E00\u4E2A\u521B\u5EFA Msg \u5B9E\u4F53\uFF0C\u6839\u636E\u5224\u5B9A\u7684\u7C7B\u522B\u53BB\u505A\u51FA\u76F8\u5E94\u7684\u56DE\u590D</p><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token comment">// ListenWrite \u76D1\u542C\u7528\u6237\u8F93\u5165</span>
<span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>User<span class="token punctuation">)</span> <span class="token function">ListenWrite</span><span class="token punctuation">(</span>server <span class="token operator">*</span>Server<span class="token punctuation">)</span> <span class="token punctuation">{</span>
	buf <span class="token operator">:=</span> <span class="token function">make</span><span class="token punctuation">(</span><span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token builtin">byte</span><span class="token punctuation">,</span> <span class="token number">4096</span><span class="token punctuation">)</span>

	<span class="token keyword">for</span> <span class="token punctuation">{</span>
		n<span class="token punctuation">,</span> err <span class="token operator">:=</span> this<span class="token punctuation">.</span>conn<span class="token punctuation">.</span><span class="token function">Read</span><span class="token punctuation">(</span>buf<span class="token punctuation">)</span>

		<span class="token operator">...</span>

		<span class="token comment">// \u83B7\u53D6\u7528\u6237\u8F93\u5165\uFF08\u53BB\u6389&#39;\\n&#39;\uFF09</span>
		msg <span class="token operator">:=</span> <span class="token function">NewMsg</span><span class="token punctuation">(</span><span class="token function">string</span><span class="token punctuation">(</span>buf<span class="token punctuation">[</span><span class="token punctuation">:</span>n<span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
		<span class="token keyword">switch</span> msg<span class="token punctuation">.</span>code <span class="token punctuation">{</span>
		<span class="token keyword">case</span> Rename<span class="token punctuation">:</span>
			this<span class="token punctuation">.</span><span class="token function">PrintMessage</span><span class="token punctuation">(</span><span class="token string">&quot;rename&quot;</span><span class="token punctuation">)</span>
			<span class="token keyword">break</span>
		<span class="token keyword">case</span> PrivateChat<span class="token punctuation">:</span>
			this<span class="token punctuation">.</span><span class="token function">PrintMessage</span><span class="token punctuation">(</span><span class="token string">&quot;private chat&quot;</span><span class="token punctuation">)</span>
			<span class="token keyword">break</span>
		<span class="token keyword">case</span> PublicChat<span class="token punctuation">:</span>
			this<span class="token punctuation">.</span><span class="token function">PrintMessage</span><span class="token punctuation">(</span><span class="token string">&quot;public chat&quot;</span><span class="token punctuation">)</span>
			<span class="token keyword">break</span>
		<span class="token keyword">case</span> OnlineUserList<span class="token punctuation">:</span>
			this<span class="token punctuation">.</span><span class="token function">PrintMessage</span><span class="token punctuation">(</span><span class="token string">&quot;who&quot;</span><span class="token punctuation">)</span>
			<span class="token keyword">break</span>
		<span class="token keyword">case</span> <span class="token number">0</span><span class="token punctuation">:</span>
			this<span class="token punctuation">.</span><span class="token function">PrintMessage</span><span class="token punctuation">(</span><span class="token string">&quot;[server]: \u6211\u4E0D\u7406\u89E3&quot;</span><span class="token punctuation">)</span>
			<span class="token keyword">break</span>
		<span class="token punctuation">}</span>
	<span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="\u6267\u884C\u6D4B\u8BD5" tabindex="-1"><a class="header-anchor" href="#\u6267\u884C\u6D4B\u8BD5" aria-hidden="true">#</a> \u6267\u884C\u6D4B\u8BD5</h3><div class="language-bash ext-sh line-numbers-mode"><pre class="language-bash"><code>go build -o server main.go server.go user.go msg.go
./server
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-bash ext-sh line-numbers-mode"><pre class="language-bash"><code><span class="token function">nc</span> <span class="token number">127.0</span>.0.1 <span class="token number">8888</span>
<span class="token function">rename</span><span class="token operator">|</span>rose
to<span class="token operator">|</span>rose<span class="token operator">|</span>hello
pub<span class="token operator">|</span>hello
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><img src="`+e+`" alt="image-20220528002636146" loading="lazy"></p><h2 id="\u6539\u540D\u529F\u80FD" tabindex="-1"><a class="header-anchor" href="#\u6539\u540D\u529F\u80FD" aria-hidden="true">#</a> \u6539\u540D\u529F\u80FD</h2><p>\u89C4\u5B9A\u6211\u4EEC\u7684\u6539\u540D\u683C\u5F0F\uFF1A<code>rename|new name</code></p><p>\u524D\u534A\u6BB5\u7684 <code>rename|</code> \u662F\u6539\u540D\u6307\u4EE4\uFF0C\u540E\u9762\u662F\u60F3\u8981\u4FEE\u6539\u7684\u65B0\u540D\u5B57\uFF0C\u8FD9\u91CC\u7684\u6307\u4EE4\u5224\u5B9A\u7531 <code>Msg</code> \u5B8C\u6210</p><p>\uFF08\u8865\u5145 <code>user.go/ListenWrite()</code> \u51FD\u6570\uFF09</p><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token comment">// ListenWrite \u76D1\u542C\u7528\u6237\u8F93\u5165</span>
<span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>User<span class="token punctuation">)</span> <span class="token function">ListenWrite</span><span class="token punctuation">(</span>server <span class="token operator">*</span>Server<span class="token punctuation">)</span> <span class="token punctuation">{</span>
	buf <span class="token operator">:=</span> <span class="token function">make</span><span class="token punctuation">(</span><span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token builtin">byte</span><span class="token punctuation">,</span> <span class="token number">4096</span><span class="token punctuation">)</span>

	<span class="token keyword">for</span> <span class="token punctuation">{</span>
        <span class="token operator">...</span>
        
		<span class="token keyword">switch</span> msg<span class="token punctuation">.</span>code <span class="token punctuation">{</span>
		<span class="token keyword">case</span> Rename<span class="token punctuation">:</span>
			str <span class="token operator">:=</span> strings<span class="token punctuation">.</span><span class="token function">Split</span><span class="token punctuation">(</span>msg<span class="token punctuation">.</span>str<span class="token punctuation">,</span> <span class="token string">&quot;|&quot;</span><span class="token punctuation">)</span><span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span>
			newName <span class="token operator">:=</span> strings<span class="token punctuation">.</span><span class="token function">TrimSpace</span><span class="token punctuation">(</span>str<span class="token punctuation">)</span>
			this<span class="token punctuation">.</span><span class="token function">Rename</span><span class="token punctuation">(</span>server<span class="token punctuation">,</span> newName<span class="token punctuation">)</span>
			<span class="token keyword">break</span>
        <span class="token operator">...</span>
		<span class="token punctuation">}</span>
	<span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>\uFF08\u6DFB\u52A0 <code>user.go/Renam()</code> \u51FD\u6570\uFF09</p><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>User<span class="token punctuation">)</span> <span class="token function">Rename</span><span class="token punctuation">(</span>server <span class="token operator">*</span>Server<span class="token punctuation">,</span> newName <span class="token builtin">string</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
	<span class="token keyword">if</span> newName <span class="token operator">==</span> <span class="token string">&quot;&quot;</span> <span class="token punctuation">{</span>
		this<span class="token punctuation">.</span><span class="token function">PrintMessage</span><span class="token punctuation">(</span><span class="token string">&quot;[\u4FEE\u6539\u5931\u8D25]: \u7528\u6237\u540D\u4E0D\u80FD\u4E3A\u7A7A&quot;</span><span class="token punctuation">)</span>
		<span class="token keyword">return</span>
	<span class="token punctuation">}</span>

	<span class="token boolean">_</span><span class="token punctuation">,</span> ok <span class="token operator">:=</span> server<span class="token punctuation">.</span>UserMap<span class="token punctuation">[</span>newName<span class="token punctuation">]</span>
	<span class="token keyword">if</span> ok <span class="token punctuation">{</span>
		this<span class="token punctuation">.</span><span class="token function">PrintMessage</span><span class="token punctuation">(</span><span class="token string">&quot;[\u4FEE\u6539\u5931\u8D25]: \u5F53\u524D\u7528\u6237\u540D\u5DF2\u5B58\u5728 &quot;</span><span class="token punctuation">)</span>
		<span class="token keyword">return</span>
	<span class="token punctuation">}</span>

	server<span class="token punctuation">.</span>mapLock<span class="token punctuation">.</span><span class="token function">Lock</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
	<span class="token function">delete</span><span class="token punctuation">(</span>server<span class="token punctuation">.</span>UserMap<span class="token punctuation">,</span> this<span class="token punctuation">.</span>Name<span class="token punctuation">)</span>
	server<span class="token punctuation">.</span>UserMap<span class="token punctuation">[</span>newName<span class="token punctuation">]</span> <span class="token operator">=</span> this
	server<span class="token punctuation">.</span>mapLock<span class="token punctuation">.</span><span class="token function">Unlock</span><span class="token punctuation">(</span><span class="token punctuation">)</span>

	this<span class="token punctuation">.</span>Name <span class="token operator">=</span> newName
	this<span class="token punctuation">.</span><span class="token function">PrintMessage</span><span class="token punctuation">(</span><span class="token string">&quot;[\u4FEE\u6539\u6210\u529F]: &quot;</span> <span class="token operator">+</span> newName<span class="token punctuation">)</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="\u516C\u804A\u529F\u80FD" tabindex="-1"><a class="header-anchor" href="#\u516C\u804A\u529F\u80FD" aria-hidden="true">#</a> \u516C\u804A\u529F\u80FD</h2><p>\u516C\u804A\u529F\u80FD\u662F\u6700\u7B80\u5355\u7684\uFF0C\u53EA\u8981\u8C03\u7528\u6211\u4EEC\u5148\u524D\u5199\u597D\u7684 <code>Server.BroadCast()</code> \u65B9\u6CD5\u5373\u53EF</p><p>\uFF08\u8865\u5145 <code>user.go/ListenWrite()</code> \u51FD\u6570\uFF09</p><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>User<span class="token punctuation">)</span> <span class="token function">ListenWrite</span><span class="token punctuation">(</span>server <span class="token operator">*</span>Server<span class="token punctuation">)</span> <span class="token punctuation">{</span>
 	<span class="token operator">...</span>
    
    	<span class="token keyword">case</span> PublicChat<span class="token punctuation">:</span>
			this<span class="token punctuation">.</span><span class="token function">PublicChat</span><span class="token punctuation">(</span>server<span class="token punctuation">,</span> split<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">)</span>
			<span class="token keyword">break</span>
    
    <span class="token operator">...</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>\uFF08\u6DFB\u52A0 <code>user.go/PublicChat()</code> \u51FD\u6570\uFF09</p><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>User<span class="token punctuation">)</span> <span class="token function">PublicChat</span><span class="token punctuation">(</span>server <span class="token operator">*</span>Server<span class="token punctuation">,</span> msg <span class="token builtin">string</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
	server<span class="token punctuation">.</span><span class="token function">BroadCast</span><span class="token punctuation">(</span>this<span class="token punctuation">,</span> msg<span class="token punctuation">)</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="\u67E5\u8BE2\u7528\u6237" tabindex="-1"><a class="header-anchor" href="#\u67E5\u8BE2\u7528\u6237" aria-hidden="true">#</a> \u67E5\u8BE2\u7528\u6237</h2><p>\u56E0\u4E3A\u7528\u6237\u7684\u6539\u540D\uFF0C\u662F\u6CA1\u6709\u8FDB\u884C\u5E7F\u64AD\u7684\uFF08\u5F53\u7136\u4F60\u5B8C\u5168\u53EF\u4EE5\u53BB\u5E7F\u64AD\uFF09\uFF0C\u6211\u4EEC\u9700\u8981\u63D0\u4F9B\u65B9\u6CD5\u4F9B\u7528\u6237\u53BB\u67E5\u8BE2\u5176\u4ED6\u7528\u6237\u7684\u7528\u6237\u540D\uFF0C\u8FD9\u6837\u6211\u4EEC\u624D\u80FD\u6307\u5B9A\u7528\u6237\u8FDB\u884C\u79C1\u804A</p><p>\uFF08\u8865\u5145 <code>user.go/ListenWrite()</code>\uFF09</p><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>User<span class="token punctuation">)</span> <span class="token function">ListenWrite</span><span class="token punctuation">(</span>server <span class="token operator">*</span>Server<span class="token punctuation">)</span> <span class="token punctuation">{</span>
 	<span class="token operator">...</span>
    
	    <span class="token keyword">case</span> OnlineUserList<span class="token punctuation">:</span>
			this<span class="token punctuation">.</span><span class="token function">PrintOnlineUserList</span><span class="token punctuation">(</span>server<span class="token punctuation">)</span>
			<span class="token keyword">break</span>
    
    <span class="token operator">...</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>\uFF08\u6DFB\u52A0 <code>user.go/PrintOnlineUserList()</code> \u51FD\u6570\uFF09</p><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token comment">// PrintOnlineUserList \u67E5\u8BE2\u5728\u7EBF\u7528\u6237</span>
<span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>User<span class="token punctuation">)</span> <span class="token function">PrintOnlineUserList</span><span class="token punctuation">(</span>server <span class="token operator">*</span>Server<span class="token punctuation">)</span> <span class="token punctuation">{</span>
	server<span class="token punctuation">.</span>mapLock<span class="token punctuation">.</span><span class="token function">Lock</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
	<span class="token keyword">for</span> <span class="token boolean">_</span><span class="token punctuation">,</span> user <span class="token operator">:=</span> <span class="token keyword">range</span> server<span class="token punctuation">.</span>UserMap <span class="token punctuation">{</span>
		<span class="token keyword">if</span> user <span class="token operator">!=</span> this <span class="token punctuation">{</span>
			this<span class="token punctuation">.</span><span class="token function">PrintMessage</span><span class="token punctuation">(</span><span class="token string">&quot;[&quot;</span> <span class="token operator">+</span> user<span class="token punctuation">.</span>Name <span class="token operator">+</span> <span class="token string">&quot;]: \u5728\u7EBF&quot;</span><span class="token punctuation">)</span>
		<span class="token punctuation">}</span>
	<span class="token punctuation">}</span>
	server<span class="token punctuation">.</span>mapLock<span class="token punctuation">.</span><span class="token function">Unlock</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="\u79C1\u804A\u529F\u80FD" tabindex="-1"><a class="header-anchor" href="#\u79C1\u804A\u529F\u80FD" aria-hidden="true">#</a> \u79C1\u804A\u529F\u80FD</h2><p>\uFF08\u8865\u5145 <code>user.go/ListenWrite()</code> \u51FD\u6570\uFF09</p><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token comment">// ListenWrite \u76D1\u542C\u7528\u6237\u8F93\u5165</span>
<span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>User<span class="token punctuation">)</span> <span class="token function">ListenWrite</span><span class="token punctuation">(</span>server <span class="token operator">*</span>Server<span class="token punctuation">)</span> <span class="token punctuation">{</span>
	<span class="token operator">...</span>
    
		<span class="token keyword">case</span> PrivateChat<span class="token punctuation">:</span>
			to <span class="token operator">:=</span> strings<span class="token punctuation">.</span><span class="token function">TrimSpace</span><span class="token punctuation">(</span>split<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">)</span>
			this<span class="token punctuation">.</span><span class="token function">PrivateChatTo</span><span class="token punctuation">(</span>server<span class="token punctuation">,</span> to<span class="token punctuation">,</span> split<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">)</span>
			<span class="token keyword">break</span>
	
	<span class="token operator">...</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>\uFF08\u6DFB\u52A0 <code>user.go/PrivateChat()</code> \u51FD\u6570\uFF09</p><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token comment">// PrivateChatTo \u79C1\u804A</span>
<span class="token keyword">func</span> <span class="token punctuation">(</span>this <span class="token operator">*</span>User<span class="token punctuation">)</span> <span class="token function">PrivateChatTo</span><span class="token punctuation">(</span>server <span class="token operator">*</span>Server<span class="token punctuation">,</span> to <span class="token builtin">string</span><span class="token punctuation">,</span> msg <span class="token builtin">string</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
	<span class="token keyword">if</span> to <span class="token operator">==</span> <span class="token string">&quot;&quot;</span> <span class="token punctuation">{</span>
		this<span class="token punctuation">.</span><span class="token function">PrintMessage</span><span class="token punctuation">(</span><span class="token string">&quot;[\u53D1\u9001\u5931\u8D25]: \u7528\u6237\u540D\u4E0D\u80FD\u4E3A\u7A7A&quot;</span><span class="token punctuation">)</span>
	<span class="token punctuation">}</span>

	user<span class="token punctuation">,</span> ok <span class="token operator">:=</span> server<span class="token punctuation">.</span>UserMap<span class="token punctuation">[</span>to<span class="token punctuation">]</span>
	<span class="token keyword">if</span> ok <span class="token punctuation">{</span>
		this<span class="token punctuation">.</span><span class="token function">PrintMessage</span><span class="token punctuation">(</span><span class="token string">&quot;[\u53D1\u9001\u6210\u529F]&quot;</span><span class="token punctuation">)</span>
		user<span class="token punctuation">.</span><span class="token function">PrintMessage</span><span class="token punctuation">(</span><span class="token string">&quot;[\u79C1\u804A\u6D88\u606F][&quot;</span> <span class="token operator">+</span> this<span class="token punctuation">.</span>Name <span class="token operator">+</span> <span class="token string">&quot;]: &quot;</span> <span class="token operator">+</span> msg<span class="token punctuation">)</span>
	<span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
		this<span class="token punctuation">.</span><span class="token function">PrintMessage</span><span class="token punctuation">(</span><span class="token string">&quot;[\u53D1\u9001\u5931\u8D25]: \u7528\u6237\u4E0D\u5B58\u5728&quot;</span><span class="token punctuation">)</span>
	<span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,36),c=[o];function i(l,u){return s(),a("div",null,c)}var k=n(p,[["render",i],["__file","function.html.vue"]]);export{k as default};
