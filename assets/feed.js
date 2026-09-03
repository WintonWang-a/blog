(() => {
  const containers = document.querySelectorAll('[data-post-feed]');
  if (!containers.length) return;

  const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const renderCard = (post) => {
    const link = `./dynamic-post.html?slug=${encodeURIComponent(post.slug)}`;
    const excerpt = post.summary || String(post.content || '').split(/\n+/).find(Boolean) || '';
    return `
      <a class="feed-card glass" href="${link}">
        <span class="tag">${escapeHtml(post.category || '动态')}</span>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(excerpt)}</p>
        <div class="feed-meta">
          <time>${formatDate(post.publishedAt)}</time>
          <span>${post.commentCount || 0} 条评论</span>
        </div>
      </a>
    `;
  };

  const renderEmpty = (message) => `
    <div class="empty-state">
      <strong>${message}</strong>
      <p>这里会从本地后台或仓库里的数据文件自动读取。</p>
    </div>
  `;

  const load = async (container) => {
    const limit = container.dataset.limit || '';
    const category = String(container.dataset.category || '').trim();
    container.innerHTML = '<div class="empty-state"><strong>正在加载动态...</strong></div>';
    try {
      const posts = await window.BLOG_DATA.loadPosts(0);
      const filtered = category
        ? posts.filter((post) => String(post.category || '').trim() === category)
        : posts;
      const visible = (Number(limit) || 0) > 0 ? filtered.slice(0, Number(limit)) : filtered;
      if (!visible.length) {
        container.innerHTML = renderEmpty('还没有动态');
        return;
      }
      container.innerHTML = visible.map(renderCard).join('');
    } catch (error) {
      console.error(error);
      container.innerHTML = renderEmpty('暂时无法读取动态');
    }
  };

  containers.forEach((container) => {
    load(container);
  });
})();
