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
      const headers = new Headers(options.headers || {});
      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      const response = await fetch(this.url(pathname), {
        ...options,
        headers
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
