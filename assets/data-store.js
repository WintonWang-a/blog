(() => {
  const jsonCache = new Map();

  const fetchJson = async (url) => {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status}`);
    }
    return response.json();
  };

  const readStaticJson = async (relativePath) => {
    const url = new URL(relativePath, window.location.href).href;
    if (!jsonCache.has(url)) {
      jsonCache.set(url, fetchJson(url));
    }
    return jsonCache.get(url);
  };

  const countComments = (comments) => comments.reduce((map, comment) => {
    map[comment.postSlug] = (map[comment.postSlug] || 0) + 1;
    return map;
  }, {});

  const sortPosts = (posts) => [...posts].sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));

  const loadStaticPosts = async () => {
    const [posts, comments] = await Promise.all([
      readStaticJson('./data/posts.json'),
      readStaticJson('./data/comments.json')
    ]);
    const counts = countComments(comments);
    return sortPosts(posts).map((post) => ({
      ...post,
      commentCount: counts[post.slug] || 0
    }));
  };

  const loadStaticPost = async (slug) => {
    const [posts, comments] = await Promise.all([
      readStaticJson('./data/posts.json'),
      readStaticJson('./data/comments.json')
    ]);
    const post = posts.find((item) => item.slug === slug);
    if (!post) {
      throw new Error('Post not found');
    }
    const postComments = comments.filter((comment) => comment.postSlug === slug);
    return {
      ...post,
      comments: postComments,
      commentCount: postComments.length
    };
  };

  const loadStaticComments = async (slug = '') => {
    const comments = await readStaticJson('./data/comments.json');
    return slug
      ? comments.filter((comment) => comment.postSlug === slug)
      : comments;
  };

  const requestJson = async (pathname, options = {}) => {
    const method = String(options.method || 'GET').toUpperCase();
    if (method !== 'GET') {
      return window.BLOG_API.request(pathname, options);
    }

    try {
      return await window.BLOG_API.request(pathname, options);
    } catch (error) {
      const normalized = String(pathname || '').replace(/^\/+/, '').split('?')[0];
      if (normalized === 'posts') {
        const posts = await loadStaticPosts();
        const limit = Number(new URLSearchParams(String(pathname).split('?')[1] || '').get('limit') || 0);
        return limit > 0 ? posts.slice(0, limit) : posts;
      }
      if (normalized.startsWith('posts/')) {
        const slug = decodeURIComponent(normalized.slice('posts/'.length));
        return loadStaticPost(slug);
      }
      if (normalized === 'comments') {
        const params = new URLSearchParams(String(pathname).split('?')[1] || '');
        return loadStaticComments(params.get('postSlug') || '');
      }
      throw error;
    }
  };

  const submitComment = async ({ postSlug, author, content }) => {
    return window.BLOG_API.request('comments', {
      method: 'POST',
      body: JSON.stringify({ postSlug, author, content })
    });
  };

  window.BLOG_DATA = {
    requestJson,
    loadPosts: async (limit = 0) => {
      const posts = await requestJson(limit ? `posts?limit=${encodeURIComponent(limit)}` : 'posts');
      return Array.isArray(posts) ? posts : [];
    },
    loadPost: async (slug) => requestJson(`posts/${encodeURIComponent(slug)}`),
    loadComments: async (slug) => requestJson(`comments?postSlug=${encodeURIComponent(slug)}`),
    submitComment
  };
})();
