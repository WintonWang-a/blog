(() => {
  const article = document.querySelector('[data-dynamic-post]');
  if (!article) return;

  const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const slug = new URLSearchParams(window.location.search).get('slug');
  const backLink = document.querySelector('[data-back-link]');

  if (backLink) {
    backLink.href = './dynamic.html';
  }

  const renderParagraphs = (content) => {
    return String(content || '')
      .split(/\n\s*\n/)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`)
      .join('');
  };

  const load = async () => {
    if (!slug) {
      article.innerHTML = '<h1>缺少文章标识</h1><p class="meta">请从动态列表进入。</p>';
      return;
    }

    article.innerHTML = '<p class="meta">正在加载动态...</p>';

    try {
      const post = await window.BLOG_API.request(`posts/${encodeURIComponent(slug)}`);
      article.innerHTML = `
        <p class="eyebrow">${escapeHtml(post.category || '动态')}</p>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="meta">${post.publishedAt || ''} · ${post.commentCount || 0} 条评论</p>
        <div class="post-body">${renderParagraphs(post.content)}</div>
      `;

      const comments = document.querySelector('[data-comments]');
      if (comments) {
        comments.dataset.postSlug = slug;
        comments.hidden = false;
      }
    } catch (error) {
      console.error(error);
      article.innerHTML = '<h1>文章不存在</h1><p class="meta">请检查 slug 是否正确。</p>';
    }
  };

  load();
})();
