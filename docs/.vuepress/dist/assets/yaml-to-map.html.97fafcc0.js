import{_ as n}from"./plugin-vue_export-helper.21dcd24c.js";import{o as s,c as a,a as t}from"./app.5d82fd04.js";const e={},p=t(`<h2 id="yaml-\u6587\u4EF6\u5185\u5BB9" tabindex="-1"><a class="header-anchor" href="#yaml-\u6587\u4EF6\u5185\u5BB9" aria-hidden="true">#</a> yaml \u6587\u4EF6\u5185\u5BB9</h2><div class="language-yaml ext-yml line-numbers-mode"><pre class="language-yaml"><code><span class="token comment"># \u683C\u5F0F\u8BF4\u660E\uFF1A</span>
<span class="token comment"># &lt;\u8C03\u7528\u6A21\u5757&gt;:</span>
<span class="token comment">#   &lt;\u65B9\u6CD5\u540D&gt;: true</span>

<span class="token key atrule">turingstar.iam.v1.Authentication</span><span class="token punctuation">:</span>
  <span class="token key atrule">CreateSession</span><span class="token punctuation">:</span> <span class="token boolean important">true</span>
<span class="token key atrule">turingstar.iam.v1.Identity</span><span class="token punctuation">:</span>
  <span class="token key atrule">GetCurrentUser</span><span class="token punctuation">:</span> <span class="token boolean important">true</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="\u8BFB\u53D6\u6587\u4EF6\u5E76\u8F6C\u6210-map" tabindex="-1"><a class="header-anchor" href="#\u8BFB\u53D6\u6587\u4EF6\u5E76\u8F6C\u6210-map" aria-hidden="true">#</a> \u8BFB\u53D6\u6587\u4EF6\u5E76\u8F6C\u6210 map</h2><div class="language-go ext-go line-numbers-mode"><pre class="language-go"><code><span class="token keyword">func</span> <span class="token function">init</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
	f<span class="token punctuation">,</span> err <span class="token operator">:=</span> os<span class="token punctuation">.</span><span class="token function">Open</span><span class="token punctuation">(</span><span class="token string">&quot;/etc/turingstar/filterMethodList.yaml&quot;</span><span class="token punctuation">)</span>
	<span class="token keyword">if</span> err <span class="token operator">!=</span> <span class="token boolean">nil</span> <span class="token punctuation">{</span>
		log<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;open filterMethodList.yaml err:&quot;</span><span class="token punctuation">,</span> err<span class="token punctuation">)</span>
		<span class="token keyword">return</span>
	<span class="token punctuation">}</span>

	input<span class="token punctuation">,</span> <span class="token boolean">_</span> <span class="token operator">:=</span> ioutil<span class="token punctuation">.</span><span class="token function">ReadAll</span><span class="token punctuation">(</span>f<span class="token punctuation">)</span>
	<span class="token comment">// base64 \u7F16\u7801</span>
	encodeString <span class="token operator">:=</span> base64<span class="token punctuation">.</span>StdEncoding<span class="token punctuation">.</span><span class="token function">EncodeToString</span><span class="token punctuation">(</span>input<span class="token punctuation">)</span>

	<span class="token comment">// base64 \u89E3\u7801</span>
	decodeBytes<span class="token punctuation">,</span> err <span class="token operator">:=</span> base64<span class="token punctuation">.</span>StdEncoding<span class="token punctuation">.</span><span class="token function">DecodeString</span><span class="token punctuation">(</span>encodeString<span class="token punctuation">)</span>
	<span class="token keyword">if</span> err <span class="token operator">!=</span> <span class="token boolean">nil</span> <span class="token punctuation">{</span>
		log<span class="token punctuation">.</span><span class="token function">Fatalln</span><span class="token punctuation">(</span>err<span class="token punctuation">)</span>
		<span class="token keyword">return</span>
	<span class="token punctuation">}</span>

	<span class="token keyword">if</span> err <span class="token operator">:=</span> yaml<span class="token punctuation">.</span><span class="token function">Unmarshal</span><span class="token punctuation">(</span>decodeBytes<span class="token punctuation">,</span> <span class="token operator">&amp;</span>filterdList<span class="token punctuation">)</span><span class="token punctuation">;</span> err <span class="token operator">!=</span> <span class="token boolean">nil</span> <span class="token punctuation">{</span>
		log<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">&quot;yaml unmarshal err:&quot;</span><span class="token punctuation">,</span> err<span class="token punctuation">)</span>
	<span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,4),o=[p];function c(i,l){return s(),a("div",null,o)}var d=n(e,[["render",c],["__file","yaml-to-map.html.vue"]]);export{d as default};
