const STORAGE_KEYS = {
  draft: 'rajcalendar-admin-draft',
  articles: 'rajcalendar-articles'
};

function getRootPath() {
  const path = window.location.pathname.replace(/\\/g, '/');
  return path.includes('/pages/') ? '../' : './';
}

function getArticleUrl(slug) {
  const path = window.location.pathname.replace(/\\/g, '/');
  const isInPagesDir = path.includes('/pages/');
  const base = isInPagesDir ? './article.html' : 'pages/article.html';
  return `${base}?slug=${encodeURIComponent(slug)}`;
}

function getArticlesUrl() {
  return `${getRootPath()}articles.json`;
}

function getArticleBySlug(slug, articles) {
  return articles.find((article) => article.slug === slug) || null;
}

async function fetchArticles() {
  try {
    const response = await fetch(getArticlesUrl());
    if (!response.ok) throw new Error('Unable to load articles');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Article data should be an array');
    localStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(data));
    return data;
  } catch (error) {
    const saved = localStorage.getItem(STORAGE_KEYS.articles);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (parseError) {
        return [];
      }
    }
    return [];
  }
}

function renderBlogCards(articles) {
  const container = document.getElementById('blog-list');
  if (!container) return;

  const visibleArticles = articles.slice(0, 4);
  if (!visibleArticles.length) {
    container.innerHTML = '<p class="text-gray-600">Articles will appear here as soon as the JSON content is published.</p>';
    return;
  }

  container.innerHTML = visibleArticles.map((article) => `
    <article class="article-card section-card rounded-2xl p-6">
      <div class="flex items-center justify-between gap-3 mb-4">
        <span class="category-pill inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">${article.category || 'Guide'}</span>
        <span class="text-xs text-gray-500">${article.publishedAt || 'Updated'}</span>
      </div>
      <h3 class="text-xl font-bold text-gray-900 mb-3">${article.title}</h3>
      <p class="text-gray-600 mb-5">${article.excerpt || 'Helpful holiday guidance for Rajasthan readers.'}</p>
      <a href="${getArticleUrl(article.slug)}" class="inline-flex items-center font-semibold text-raj-pink hover:text-raj-royal transition-colors">Read full guide →</a>
    </article>
  `).join('');
}

function renderArticlePage(articles) {
  const container = document.getElementById('article-content');
  const title = document.getElementById('article-title');
  const meta = document.getElementById('article-meta');
  const notFound = document.getElementById('article-not-found');
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!container || !title || !meta) return;

  const article = getArticleBySlug(slug, articles);
  if (!article) {
    if (notFound) notFound.classList.remove('hidden');
    container.innerHTML = '<p class="text-gray-600">The requested article is not available yet.</p>';
    return;
  }

  document.title = `${article.title} | Rajasthan Calendar`;
  title.textContent = article.title;
  meta.textContent = `${article.category || 'Guide'} · ${article.publishedAt || 'Updated'}`;
  container.innerHTML = `<div class="prose max-w-none">${article.content || '<p>No content available.</p>'}</div>`;
}

function initMobileMenu() {
  const button = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (!button || !menu) return;
  button.addEventListener('click', () => menu.classList.toggle('hidden'));
}

function initAdmin() {
  const form = document.getElementById('article-form');
  const titleInput = document.getElementById('title');
  const descInput = document.getElementById('metaDescription');
  const slugInput = document.getElementById('slug');
  const categoryInput = document.getElementById('category');
  const status = document.getElementById('form-status');
  const exportButton = document.getElementById('export-json');
  const copyButton = document.getElementById('copy-json');
  const saveButton = document.getElementById('save-article');
  const listPreview = document.getElementById('article-list-preview');
  const editorContainer = document.getElementById('editor');

  if (!form || !editorContainer) return;

  const initialDraft = JSON.parse(localStorage.getItem(STORAGE_KEYS.draft) || '{}');
  let savedArticles = JSON.parse(localStorage.getItem(STORAGE_KEYS.articles) || '[]');
  let quill = null;

  if (window.Quill) {
    quill = new Quill(editorContainer, {
      theme: 'snow',
      placeholder: 'Write a deep, helpful article with headings, lists, and useful holiday guidance.',
      modules: {
        toolbar: [
          [{ header: [2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'blockquote'],
          ['clean']
        ]
      }
    });

    if (initialDraft.content) {
      quill.root.innerHTML = initialDraft.content;
    }
  }

  if (titleInput) titleInput.value = initialDraft.title || '';
  if (descInput) descInput.value = initialDraft.metaDescription || '';
  if (slugInput) slugInput.value = initialDraft.slug || '';
  if (categoryInput) categoryInput.value = initialDraft.category || 'Public Holidays';

  const persistDraft = () => {
    const draft = {
      title: titleInput ? titleInput.value : '',
      metaDescription: descInput ? descInput.value : '',
      slug: slugInput ? slugInput.value : '',
      category: categoryInput ? categoryInput.value : 'Public Holidays',
      content: quill ? quill.root.innerHTML : editorContainer.innerHTML
    };
    localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(draft));
    if (status) status.textContent = 'Draft saved locally.';
  };

  [titleInput, descInput, slugInput, categoryInput].forEach((element) => {
    if (element) element.addEventListener('input', persistDraft);
  });

  if (quill) {
    quill.on('text-change', persistDraft);
  }

  const renderPreview = () => {
    if (!listPreview) return;
    const articleCount = savedArticles.length;
    listPreview.innerHTML = articleCount
      ? savedArticles.slice(0, 6).map((article) => `<li class="rounded-lg border border-gray-200 px-3 py-2 text-sm">${article.title}</li>`).join('')
      : '<li class="text-sm text-gray-500">No local articles yet. Save one to build the JSON feed.</li>';
  };

  renderPreview();

  if (saveButton) {
    saveButton.addEventListener('click', (event) => {
      event.preventDefault();
      const article = {
        id: Date.now(),
        title: titleInput ? titleInput.value.trim() : 'Untitled article',
        metaDescription: descInput ? descInput.value.trim() : '',
        slug: slugInput ? slugInput.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : `article-${Date.now()}`,
        category: categoryInput ? categoryInput.value : 'Public Holidays',
        excerpt: (descInput ? descInput.value.trim() : '').slice(0, 160),
        publishedAt: new Date().toISOString().slice(0, 10),
        content: quill ? quill.root.innerHTML : editorContainer.innerHTML,
        imageAlt: titleInput ? titleInput.value.trim() : 'Article image'
      };

      savedArticles = [article, ...savedArticles];
      localStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(savedArticles));
      if (status) status.textContent = 'Article saved to the local article list.';
      renderPreview();
    });
  }

  if (exportButton) {
    exportButton.addEventListener('click', () => {
      const exportArticles = JSON.parse(localStorage.getItem(STORAGE_KEYS.articles) || '[]');
      const blob = new Blob([JSON.stringify(exportArticles, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'articles.json';
      link.click();
      URL.revokeObjectURL(url);
      if (status) status.textContent = 'articles.json downloaded successfully.';
    });
  }

  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      const exportArticles = JSON.parse(localStorage.getItem(STORAGE_KEYS.articles) || '[]');
      try {
        await navigator.clipboard.writeText(JSON.stringify(exportArticles, null, 2));
        if (status) status.textContent = 'JSON copied to clipboard.';
      } catch (error) {
        if (status) status.textContent = 'Clipboard access is blocked in this browser.';
      }
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    persistDraft();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  initMobileMenu();

  const articles = await fetchArticles();

  if (document.getElementById('blog-list')) {
    renderBlogCards(articles);
  }

  if (document.getElementById('article-content')) {
    renderArticlePage(articles);
  }

  if (document.getElementById('article-form')) {
    initAdmin();
  }
});
