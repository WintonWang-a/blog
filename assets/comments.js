(() => {
  const containers = document.querySelectorAll('[data-comments]');
  if (!containers.length) return;

  const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || '';
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSlug = (container) => {
    return container.dataset.postSlug
      || new URLSearchParams(window.location.search).get('slug')
      || window.location.pathname.split('/').pop().replace(/\.html$/i, '');
  };

  const renderEmpty = () => `
    <div class="empty-state">
      <strong>还没有评论</strong>
      <p>来抢个沙发吧。</p>
    </div>
  `;

  const renderComment = (comment) => `
    <article class="comment-item">
      <div class="comment-head">
        <strong>${escapeHtml(comment.author || '匿名')}</strong>
        <time>${formatDate(comment.createdAt)}</time>
      </div>
      <p>${escapeHtml(comment.content || '').replaceAll('\n', '<br>')}</p>
    </article>
  `;

  const render = (container, slug, comments) => {
    container.innerHTML = `
      <div class="section-head comments-head">
        <div>
          <p class="eyebrow">评论</p>
          <h2>游客留言</h2>
        </div>
        <span class="comment-count">${comments.length} 条</span>
      </div>
      <form class="comment-form" data-comment-form>
        <input class="field-input" name="author" placeholder="你的名字" maxlength="30" value="匿名">
        <textarea class="field-textarea" name="content" placeholder="写下你的想法..." required maxlength="500"></textarea>
        <button class="btn primary" type="submit">发送评论</button>
        <p class="comment-tip">评论会在保存后公开显示。</p>
      </form>
      <div class="comment-list" data-comment-list>
        ${comments.length ? comments.map(renderComment).join('') : renderEmpty()}
      </div>
    `;

    const form = container.querySelector('[data-comment-form]');
    const list = container.querySelector('[data-comment-list]');
    const count = container.querySelector('.comment-count');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const author = String(formData.get('author') || '匿名').trim() || '匿名';
      const content = String(formData.get('content') || '').trim();
      if (!content) return;

      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = '发送中...';

      try {
        const comment = await window.BLOG_DATA.submitComment({ postSlug: slug, author, content });
        const empty = list.querySelector('.empty-state');
        if (empty) {
          list.innerHTML = '';
        }
        list.insertAdjacentHTML('afterbegin', renderComment(comment));
        count.textContent = `${list.querySelectorAll('.comment-item').length} 条`;
        form.reset();
        form.querySelector('[name="author"]').value = author;
      } catch (error) {
        alert(error.message || '当前没有可写入的后台服务');
      } finally {
        button.disabled = false;
        button.textContent = '发送评论';
      }
    });
  };

  const load = async (container) => {
    const slug = getSlug(container);
    container.innerHTML = '<div class="empty-state"><strong>评论加载中...</strong></div>';
    try {
      const comments = await window.BLOG_DATA.loadComments(slug);
      render(container, slug, comments);
    } catch (error) {
      console.error(error);
      container.innerHTML = `
        <div class="empty-state">
          <strong>评论暂不可用</strong>
          <p>请先启动本地后台，或等待仓库数据同步完成。</p>
        </div>
      `;
    }
  };

  containers.forEach(load);
})();
