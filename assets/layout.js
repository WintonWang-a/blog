(() => {
  const normalize = (value) => {
    let path = String(value || '').trim();
    if (!path) return '/';
    path = path.replace(/\\/g, '/');
    path = path.replace(/index\.html$/i, '');
    path = path.replace(/\.html$/i, '');
    if (!path.startsWith('/')) path = `/${path}`;
    path = path.replace(/\/+/g, '/');
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    return path || '/';
  };

  const current = normalize(window.location.pathname);
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    const href = link.getAttribute('href') || '/';
    const target = normalize(new URL(href, window.location.href).pathname);
    const active = current === target;
    link.dataset.active = String(active);
    if (active) {
      link.setAttribute('aria-current', 'page');
    }
  });

  const header = document.querySelector('.site-header');
  if (!header) return;

  const syncHeader = () => {
    header.classList.toggle('scrolled', window.scrollY > 24);
  };

  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });
})();
