(() => {
  'use strict';
  const {url} = window.SiteLinks;
  const security = window.BlogSecurity;
  const postsURL = url('blog/posts.json');
  const postLink = slug => url('blog/posts/post.html?slug=' + encodeURIComponent(slug));
  const validPosts = data => Array.isArray(data?.posts) ? data.posts.filter(p => p && typeof p.slug === 'string' && p.slug && typeof p.title === 'string') : [];
  const dateText = value => /^\d{4}-\d{2}-\d{2}/.test(String(value)) ? String(value).slice(0,10).replaceAll('-','.') : '';
  function imageURL(value) {
    if (typeof value !== 'string') return '';
    const path = value.replace(/^\.\//, '');
    const relative = path.startsWith('/yoico-site/') ? path.slice(12) : path.replace(/^\/?images\//, 'images/');
    return security.imageURL(/^https?:\/\//i.test(path) ? path : url(relative));
  }
  function setStatus(container,text) {
    const p = document.createElement('p');
    p.className = 'status-box';
    p.textContent = text;
    container.replaceChildren(p);
  }
  function newsList(container,posts) {
    container.className = 'news-list';
    container.replaceChildren();
    posts.forEach(post => {
      const a = document.createElement('a');
      a.className = 'news-link';
      a.href = postLink(post.slug);
      const time = document.createElement('time');
      time.textContent = dateText(post.date);
      if (time.textContent) time.dateTime = String(post.date).slice(0,10);
      const h3 = document.createElement('h3');
      h3.textContent = post.title;
      const arrow = document.createElement('span');
      arrow.textContent = '↗';
      arrow.setAttribute('aria-hidden','true');
      a.append(time,h3,arrow);
      container.append(a);
    });
  }
  function noIndex() {
    document.querySelector('meta[name="robots"]')?.setAttribute('content','noindex,follow');
  }
  async function loadArticle(article) {
    const slug = new URLSearchParams(location.search).get('slug');
    if (!slug) {
      noIndex();
      document.getElementById('canonical-link').href = window.SITE_CONFIG.canonicalOrigin + window.SITE_CONFIG.basePath + 'blog/';
      document.getElementById('og-url').content = document.getElementById('canonical-link').href;
      setStatus(article,'記事が指定されていません。下のお知らせ一覧から記事をお選びください。');
      return;
    }
    // Resolve per-article canonical BEFORE fetching the CMS data.
    const canonical = window.SITE_CONFIG.canonicalOrigin + window.SITE_CONFIG.basePath + 'blog/posts/post.html?slug=' + encodeURIComponent(slug);
    document.getElementById('canonical-link').href = canonical;
    document.getElementById('og-url').content = canonical;
    try {
      const response = await fetch(postsURL,{cache:'no-store'});
      if (!response.ok) throw new Error('posts unavailable');
      const post = validPosts(await response.json()).find(p => p.slug === slug);
      if (!post) {
        noIndex();
        setStatus(article,'記事が見つかりませんでした。お知らせ一覧をご確認ください。');
        return;
      }
      document.title = post.title + '｜よいコ';
      document.querySelector('meta[property="og:title"]').content = document.title;
      document.querySelector('meta[property="og:type"]').content = 'article';
      const excerpt = typeof post.excerpt === 'string' ? post.excerpt : '';
      document.querySelector('meta[name="description"]').content = excerpt;
      document.querySelector('meta[property="og:description"]').content = excerpt;
      const header = document.createElement('header');
      header.className = 'article-header';
      const time = document.createElement('time');
      time.textContent = dateText(post.date);
      if (time.textContent) time.dateTime = String(post.date).slice(0,10);
      const heading = document.createElement('h1');
      heading.textContent = post.title;
      header.append(time,heading);
      const tags = document.createElement('div');
      tags.className = 'article-tags';
      (Array.isArray(post.tags) ? post.tags : []).forEach(tag => {
        if (typeof tag !== 'string') return;
        const span = document.createElement('span');
        span.textContent = tag;
        tags.append(span);
      });
      header.append(tags);
      article.replaceChildren(header);
      const source = imageURL(post.image);
      if (source) {
        const image = document.createElement('img');
        image.className = 'article-image';
        image.src = source;
        image.alt = post.title;
        image.addEventListener('error',()=>image.remove(),{once:true});
        article.append(image);
        document.querySelector('meta[property="og:image"]').content = source;
      }
      const body = document.createElement('div');
      body.className = 'article-body';
      const raw = typeof post.body === 'string' && post.body.trim() ? post.body : excerpt;
      const rendered = window.marked && !raw.trimStart().startsWith('<') ? window.marked.parse(raw) : raw;
      body.innerHTML = security.sanitizeHTML(rendered);
      body.querySelectorAll('img').forEach(img => {
        img.removeAttribute('srcset');
        img.removeAttribute('sizes');
        const safe = imageURL(img.getAttribute('src'));
        if (!safe) img.remove();
        else { img.src = safe; img.loading = 'lazy'; }
      });
      body.querySelectorAll('a').forEach(a => {
        a.rel = 'noopener noreferrer';
      });
      article.append(body);
    } catch (error) {
      noIndex();
      setStatus(article,'記事を読み込めませんでした。時間をおいてページを再読み込みしてください。');
      console.warn('Blog:', error.message);
    }
  }
  document.addEventListener('DOMContentLoaded',async () => {
    const article = document.getElementById('article');
    if (article) { await loadArticle(article); return; }
    const container = document.getElementById('posts-list') || document.getElementById('home-posts');
    if (!container) return;
    try {
      const response = await fetch(postsURL,{cache:'no-store'});
      if (!response.ok) throw new Error('posts unavailable');
      const posts = validPosts(await response.json());
      if (!posts.length) {
        if (container.id === 'posts-list') setStatus(container,'お店からのお知らせは、こちらでご紹介していきます。');
        return;
      }
      newsList(container,container.id === 'home-posts' ? posts.slice(0,3) : posts);
    } catch (error) {
      if (container.id === 'posts-list') setStatus(container,'お知らせを読み込めませんでした。時間をおいてページを再読み込みしてください。');
      console.warn('Blog:', error.message);
    }
  });
})();
