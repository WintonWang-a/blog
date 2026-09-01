(() => {
  const normalizeBase = (base) => String(base || '').replace(/\/$/, '');

  window.BLOG_API = {
    base() {
      return normalizeBase(window.BLOG_CONFIG?.apiBase || '/api');
    },
    url(pathname) {
      const path = String(pathname || '').replace(/^\/+/, '');
      return `${this.base()}/${path}`;
    },
    async request(pathname, options = {}) {
      const response = await fetch(this.url(pathname), {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...options
      });

      let body = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }

      if (!response.ok) {
        const message = body?.message || `Request failed: ${response.status}`;
        throw new Error(message);
      }

      return body;
    }
  };
})();
