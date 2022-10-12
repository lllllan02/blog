import{_ as n}from"./plugin-vue_export-helper.21dcd24c.js";import{o as e,c as a,a as s}from"./app.5d82fd04.js";const l={},i=s(`<h2 id="http" tabindex="-1"><a class="header-anchor" href="#http" aria-hidden="true">#</a> HTTP</h2><p>\u627E\u5230 <code>/apache/conf/httpd.conf</code> \uFF0C\u5728\u6587\u4EF6\u672B\u6DFB\u52A0\u4F60\u9700\u8981\u7BA1\u7406\u7684\u57DF\u540D</p><div class="language-bash ext-sh line-numbers-mode"><pre class="language-bash"><code><span class="token operator">&lt;</span>VirtualHost *:8<span class="token operator"><span class="token file-descriptor important">0</span>&gt;</span>
	DocumentRoot <span class="token string">&quot;*/data/www/default/project&quot;</span> 	<span class="token comment"># \u9879\u76EE\u7684\u8DEF\u5F84</span>
	ServerName project.lllllan.cn 				<span class="token comment"># \u57DF\u540D</span>
<span class="token operator">&lt;</span>/VirtualHost<span class="token operator">&gt;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="https" tabindex="-1"><a class="header-anchor" href="#https" aria-hidden="true">#</a> HTTPS</h2><p>\u914D\u7F6E\u8BC1\u4E66\u89C1\u{1F449} <a href="config-ssl-certificate">Apache\u914D\u7F6ESSL\u8BC1\u4E66</a></p><div class="language-bash ext-sh line-numbers-mode"><pre class="language-bash"><code><span class="token operator">&lt;</span>VirtualHost <span class="token number">0.0</span>.0.0:44<span class="token operator"><span class="token file-descriptor important">3</span>&gt;</span>
		<span class="token comment">#\u4F60\u81EA\u5DF1\u9879\u76EE\u5B58\u653E\u7684\u76EE\u5F55</span>
        DocumentRoot <span class="token string">&quot;/data/www/default/personal_data/course/&quot;</span>
        
        <span class="token comment">#\u586B\u5199\u8BC1\u4E66\u540D\u79F0</span>
        ServerName course.lllllan.cn
        
        <span class="token comment">#\u542F\u7528 SSL \u529F\u80FD</span>
        SSLEngine on 
        
        <span class="token comment">#\u8BC1\u4E66\u6587\u4EF6\u7684\u8DEF\u5F84</span>
        SSLCertificateFile /usr/local/apache/conf/ssl/course.lllllan.cn.crt 
        
        <span class="token comment">#\u79C1\u94A5\u6587\u4EF6\u7684\u8DEF\u5F84</span>
        SSLCertificateKeyFile /usr/local/apache/conf/ssl/course.lllllan.cn.key 
        
        <span class="token comment">#\u8BC1\u4E66\u94FE\u6587\u4EF6\u7684\u8DEF\u5F84</span>
        SSLCertificateChainFile /usr/local/apache/conf/ssl/root_bundle.crt 
<span class="token operator">&lt;</span>/VirtualHost<span class="token operator">&gt;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="\u91CD\u542F\u670D\u52A1\u5668" tabindex="-1"><a class="header-anchor" href="#\u91CD\u542F\u670D\u52A1\u5668" aria-hidden="true">#</a> \u91CD\u542F\u670D\u52A1\u5668</h2><div class="language-bash ext-sh line-numbers-mode"><pre class="language-bash"><code><span class="token function">service</span> httpd restart
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div>`,8),t=[i];function c(r,o){return e(),a("div",null,t)}var m=n(l,[["render",c],["__file","domain-name-management.html.vue"]]);export{m as default};
