(() => {
  const tokenKey = 'winton-blog-token';
  const api = window.BLOG_API;
  const loginPanel = document.querySelector('[data-login-panel]');
  const dashboard = document.querySelector('[data-dashboard]');
  const loginForm = document.querySelector('[data-login-form]');
  const logoutButton = document.querySelector('[data-logout]');
  const postForm = document.querySelector('[data-post-form]');
  const postList = document.querySelector('[data-post-list]');
  const commentList = document.querySelector('[data-admin-comment-list]');
  const summary = document.querySelector('[data-summary]');

  if (!loginPanel || !dashboard || !loginForm || !postForm || !postList || !commentList || !summary) return;

  const state = {
    token: localStorage.getItem(tokenKey) || '',
    editingSlug: ''
  };

  const slugInput = postForm.querySelector('[name="slug"]');

  const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const authHeaders = () => ({
    Authorization: `Bearer ${state.token}`
  });

  const showLogin = () => {
    loginPanel.hidden = false;
    dashboard.hidden = true;
  };

  const showDashboard = () => {
    loginPanel.hidden = true;
    dashboard.hidden = false;
  };

  const request = async (path, options = {}) => {
    return api.request(path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(state.token ? authHeaders() : {})
      }
    });
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || '';
    return date.toLocaleDateString('zh-CN');
  };

  const resetForm = () => {
    state.editingSlug = '';
    postForm.reset();
    slugInput.disabled = false;
    postForm.querySelector('[name="publishedAt"]').value = new Date().toISOString().slice(0, 10);
    postForm.querySelector('button[type="submit"]').textContent = '发布动态';
  };

  const fillForm = (post) => {
    state.editingSlug = post.slug;
    postForm.querySelector('[name="title"]').value = post.title || '';
    slugInput.value = post.slug || '';
    slugInput.disabled = true;
    postForm.querySelector('[name="category"]').value = post.category || '动态';
    postForm.querySelector('[name="summary"]').value = post.summary || '';
    postForm.querySelector('[name="content"]').value = post.content || '';
    postForm.querySelector('[name="publishedAt"]').value = (post.publishedAt || new Date().toISOString()).slice(0, 10);
    postForm.querySelector('button[type="submit"]').textContent = '保存修改';
  };

  const renderPosts = (posts) => {
    if (!posts.length) {
      postList.innerHTML = '<tr><td colspan="5">还没有动态</td></tr>';
      return;
    }

    postList.innerHTML = posts.map((post) => `
      <tr>
        <td>
          <strong>${escapeHtml(post.title)}</strong>
          <div class="muted">${escapeHtml(post.slug)}</div>
        </td>
        <td>${escapeHtml(post.category || '动态')}</td>
        <td>${formatDate(post.publishedAt)}</td>
        <td>${post.commentCount || 0}</td>
        <td class="table-actions">
          <button class="link-button" data-edit-post="${post.slug}">编辑</button>
          <button class="link-button danger" data-delete-post="${post.slug}">删除</button>
        </td>
      </tr>
    `).join('');

    postList.querySelectorAll('[data-edit-post]').forEach((button) => {
      button.addEventListener('click', async () => {
        const slug = button.dataset.editPost;
        const post = posts.find((item) => item.slug === slug);
        if (post) fillForm(post);
      });
    });

    postList.querySelectorAll('[data-delete-post]').forEach((button) => {
      button.addEventListener('click', async () => {
        const slug = button.dataset.deletePost;
        if (!confirm(`删除动态 ${slug}？`)) return;
        await request(`posts/${encodeURIComponent(slug)}`, { method: 'DELETE' });
        await refresh();
      });
    });
  };

  const renderComments = (comments) => {
    if (!comments.length) {
      commentList.innerHTML = '<tr><td colspan="5">暂无评论</td></tr>';
      return;
    }

    commentList.innerHTML = comments.map((comment) => `
      <tr>
        <td>${escapeHtml(comment.postSlug)}</td>
        <td>${escapeHtml(comment.author)}</td>
        <td>${escapeHtml(comment.content)}</td>
        <td>${formatDate(comment.createdAt)}</td>
        <td>
          <button class="link-button danger" data-delete-comment="${comment.id}">删除</button>
        </td>
      </tr>
    `).join('');

    commentList.querySelectorAll('[data-delete-comment]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.deleteComment;
        await request(`admin/comments/${encodeURIComponent(id)}`, { method: 'DELETE' });
        await refresh();
      });
    });
  };

  const refresh = async () => {
    const [posts, comments] = await Promise.all([
      request('posts'),
      request('admin/comments')
    ]);

    const postCount = posts.length;
    const commentCount = comments.length;
    summary.innerHTML = `
      <div class="summary-card glass"><strong>${postCount}</strong><span>动态</span></div>
      <div class="summary-card glass"><strong>${commentCount}</strong><span>评论</span></div>
    `;

    renderPosts(posts);
    renderComments(comments);
    resetForm();
    showDashboard();
  };

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = String(new FormData(loginForm).get('password') || '');
    try {
      const result = await api.request('auth/login', {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      state.token = result.token;
      localStorage.setItem(tokenKey, state.token);
      await refresh();
    } catch (error) {
      alert(error.message);
    }
  });

  logoutButton.addEventListener('click', () => {
    state.token = '';
    localStorage.removeItem(tokenKey);
    showLogin();
  });

  postForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(postForm);
    const payload = {
      title: String(formData.get('title') || '').trim(),
      slug: String(formData.get('slug') || '').trim(),
      category: String(formData.get('category') || '').trim(),
      summary: String(formData.get('summary') || '').trim(),
      content: String(formData.get('content') || '').trim(),
      publishedAt: String(formData.get('publishedAt') || '').trim()
    };

    try {
      if (state.editingSlug) {
        await request(`posts/${encodeURIComponent(state.editingSlug)}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await request('posts', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      await refresh();
    } catch (error) {
      alert(error.message);
    }
  });

  if (state.token) {
    refresh().catch(() => showLogin());
  } else {
    showLogin();
  }
})();
