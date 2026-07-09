(function () {
  const pagePath = window.location.pathname.replace(/\\/g, '/');
  const pageDir = pagePath.substring(0, pagePath.lastIndexOf('/')) || '/';
  const isNestedPage = pageDir === '/pages' || pageDir === '/articles' || pageDir.startsWith('/pages/') || pageDir.startsWith('/articles/');

  function getCurrentPagePath() {
    return pagePath === '/' ? '/index.html' : pagePath;
  }

  function resolvePath(value) {
    if (!value || value.startsWith('#') || value.startsWith('http://') || value.startsWith('https://') || value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('data:')) {
      return value;
    }

    const cleanValue = value.replace(/\\/g, '/');
    const [pathPart, hashPart] = cleanValue.split('#');
    const [pathOnly] = pathPart.split('?');
    const normalizedPath = pathOnly.replace(/^\/+/, '');
    const hashSuffix = hashPart ? `#${hashPart}` : '';

    if (!normalizedPath || normalizedPath === '/' || normalizedPath === 'index.html') {
      return (isNestedPage ? '../index.html' : './index.html') + hashSuffix;
    }

    if (normalizedPath.startsWith('pages/') || normalizedPath.startsWith('articles/')) {
      return (isNestedPage ? `../${normalizedPath}` : `./${normalizedPath}`) + hashSuffix;
    }

    if (['components/', 'assets/', 'Pdf/', 'js/'].some((prefix) => normalizedPath.startsWith(prefix))) {
      return (isNestedPage ? `../${normalizedPath}` : `./${normalizedPath}`) + hashSuffix;
    }

    return normalizedPath + hashSuffix;
  }

  function rewritePaths(container) {
    container.querySelectorAll('[href],[src]').forEach((element) => {
      const attrName = element.hasAttribute('href') ? 'href' : 'src';
      const value = element.getAttribute(attrName);
      const resolvedValue = resolvePath(value);
      if (resolvedValue !== value) {
        element.setAttribute(attrName, resolvedValue);
      }
    });
  }

  function applyActiveState() {
    const currentPage = getCurrentPagePath();
    document.querySelectorAll('[data-nav-link]').forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (!href || href.startsWith('#')) {
        return;
      }

      const resolvedHref = new URL(href, window.location.href).pathname;
      const hasHash = href.includes('#');
      const isCurrent = !hasHash && (resolvedHref === currentPage || (resolvedHref.endsWith('/index.html') && currentPage === '/index.html'));
      if (isCurrent) {
        link.classList.add('text-raj-pink');
        link.classList.remove('text-gray-600');
      } else {
        link.classList.remove('text-raj-pink');
        link.classList.add('text-gray-600');
      }
    });
  }

  async function loadComponent(targetId, filePath) {
    const container = document.getElementById(targetId);
    if (!container) {
      return;
    }

    try {
      const response = await fetch(filePath, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to load ${filePath}`);
      }

      const html = await response.text();
      container.innerHTML = html;
      rewritePaths(container);
      applyActiveState();

      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }

      if (targetId === 'header-container') {
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');
        if (btn && menu) {
          btn.addEventListener('click', () => {
            menu.classList.toggle('hidden');
          });
        }
      }
    } catch (error) {
      container.innerHTML = '<div class="p-4 text-sm text-red-600">Unable to load navigation. Please refresh the page.</div>';
      console.error(error);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const headerTarget = document.getElementById('header-container');
    const footerTarget = document.getElementById('footer-container');

    if (headerTarget) {
      loadComponent('header-container', isNestedPage ? '../components/header.html' : 'components/header.html');
    }
    if (footerTarget) {
      loadComponent('footer-container', isNestedPage ? '../components/footer.html' : 'components/footer.html');
    }
  });
})();
