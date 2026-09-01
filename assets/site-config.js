window.BLOG_CONFIG = window.BLOG_CONFIG || {};
window.BLOG_CONFIG.apiBase = window.BLOG_CONFIG.apiBase || (
  location.protocol === 'file:'
    ? 'http://127.0.0.1:8787/api'
    : new URL('./api', location.href).href.replace(/\/$/, '')
);
