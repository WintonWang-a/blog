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
    return `
      <a class="feed-card glass" href="${link}">
        <span class="tag">${escapeHtml(post.category || '动态')}</span>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.summary || '')}</p>
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
      <p>等本地接口连上后，这里会自动显示最新动态。</p>
    </div>
  `;

  const load = async (container) => {
    const limit = container.dataset.limit || '';
    container.innerHTML = '<div class="empty-state"><strong>正在加载动态...</strong></div>';
    try {
      const query = limit ? `?limit=${encodeURIComponent(limit)}` : '';
      const posts = await window.BLOG_API.request(`posts${query}`);
      if (!posts.length) {
        container.innerHTML = renderEmpty('还没有动态');
        return;
      }
      container.innerHTML = posts.map(renderCard).join('');
    } catch (error) {
      console.error(error);
      container.innerHTML = renderEmpty('本地接口暂未连接');
    }
  };

  containers.forEach((container) => {
    load(container);
  });
})();
