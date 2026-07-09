(function () {
  const articlesDataUrl = '../articles/articles.json';
  const pagePath = window.location.pathname.replace(/\\/g, '/');

  function getBaseUrl() {
    return window.location.origin;
  }

  async function loadArticles() {
    const response = await fetch(articlesDataUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Unable to load articles');
    }
    return response.json();
  }

  function formatDate(value) {
    const date = new Date(value);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function getArticlePageUrl(article) {
    return `./${article.slug}.html`;
  }

  function createArticleCard(article) {
    const card = document.createElement('article');
    card.className = 'article-card cursor-pointer bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col';
    card.innerHTML = `
      <img src="${article.image}" alt="${article.title}" class="h-48 w-full object-cover">
      <div class="p-6 flex-1 flex flex-col">
        <div class="flex items-center justify-between text-sm text-gray-500">
          <span class="rounded-full bg-orange-100 px-3 py-1 text-raj-pink font-semibold">${article.category}</span>
          <span>${article.readingTime}</span>
        </div>
        <h2 class="mt-4 text-xl font-bold text-gray-900">${article.title}</h2>
        <p class="mt-2 text-sm text-gray-600">${article.excerpt}</p>
        <div class="mt-4 text-sm text-gray-500 space-y-1">
          <p>By ${article.author}</p>
          <p>${formatDate(article.date)}</p>
        </div>
        <a href="${getArticlePageUrl(article)}" class="mt-6 inline-flex items-center justify-center rounded-full bg-raj-royal px-4 py-2 text-sm font-semibold text-white hover:bg-raj-pink transition-colors">Read More</a>
      </div>
    `;

    card.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        return;
      }
      window.location.href = getArticlePageUrl(article);
    });

    return card;
  }

  function renderArticles(articles, limit) {
    const grid = document.getElementById('articles-grid');
    if (!grid) {
      return;
    }

    grid.innerHTML = '';
    const visibleArticles = limit ? articles.slice(0, limit) : articles;
    visibleArticles.forEach((article) => {
      grid.appendChild(createArticleCard(article));
    });

    const loadMoreButton = document.getElementById('load-more-btn');
    if (loadMoreButton) {
      if (articles.length > visibleArticles.length) {
        loadMoreButton.classList.remove('hidden');
      } else {
        loadMoreButton.classList.add('hidden');
      }
    }
  }

  function setupArticleListing() {
    const searchInput = document.getElementById('article-search');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    const loadMoreButton = document.getElementById('load-more-btn');
    let allArticles = [];
    let visibleCount = 6;

    loadArticles().then((articles) => {
      allArticles = articles;
      const categories = [...new Set(articles.map((article) => article.category))];
      categories.forEach((category) => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
      });

      function applyFilters() {
        const query = searchInput.value.trim().toLowerCase();
        const category = categoryFilter.value;
        const sort = sortFilter.value;

        let filtered = allArticles.filter((article) => {
          const matchesQuery = article.title.toLowerCase().includes(query) || article.excerpt.toLowerCase().includes(query) || article.content.toLowerCase().includes(query);
          const matchesCategory = category === 'all' || article.category === category;
          return matchesQuery && matchesCategory;
        });

        filtered.sort((a, b) => {
          if (sort === 'popular') {
            return Number(b.popular) - Number(a.popular);
          }
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return sort === 'oldest' ? dateA - dateB : dateB - dateA;
        });

        visibleCount = 6;
        renderArticles(filtered, visibleCount);
      }

      searchInput.addEventListener('input', applyFilters);
      categoryFilter.addEventListener('change', applyFilters);
      sortFilter.addEventListener('change', applyFilters);
      loadMoreButton.addEventListener('click', () => {
        visibleCount += 6;
        const query = searchInput.value.trim().toLowerCase();
        const category = categoryFilter.value;
        const sort = sortFilter.value;
        let filtered = allArticles.filter((article) => {
          const matchesQuery = article.title.toLowerCase().includes(query) || article.excerpt.toLowerCase().includes(query) || article.content.toLowerCase().includes(query);
          const matchesCategory = category === 'all' || article.category === category;
          return matchesQuery && matchesCategory;
        });
        filtered.sort((a, b) => {
          if (sort === 'popular') {
            return Number(b.popular) - Number(a.popular);
          }
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return sort === 'oldest' ? dateA - dateB : dateB - dateA;
        });
        renderArticles(filtered, visibleCount);
      });

      applyFilters();
    }).catch((error) => {
      console.error(error);
      const grid = document.getElementById('articles-grid');
      if (grid) {
        grid.innerHTML = '<div class="col-span-full rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">Unable to load articles right now. Please try again later.</div>';
      }
    });
  }

  function setupArticleDetail() {
    const slug = pagePath.split('/').pop().replace('.html', '');
    const articleTitle = document.getElementById('article-title');
    const articleMeta = document.getElementById('article-meta');
    const articleContent = document.getElementById('article-content');
    const articleImage = document.getElementById('article-image');
    const breadcrumbs = document.getElementById('breadcrumbs');
    const relatedArticlesContainer = document.getElementById('related-articles');

    if (!articleTitle || !articleMeta || !articleContent || !articleImage || !breadcrumbs || !relatedArticlesContainer) {
      return;
    }

    loadArticles().then((articles) => {
      const article = articles.find((item) => item.slug === slug);
      if (!article) {
        articleTitle.textContent = 'Article not found';
        articleMeta.textContent = '404';
        articleContent.innerHTML = '<p>The article you requested could not be found.</p>';
        breadcrumbs.innerHTML = '<a href="./index.html" class="hover:text-raj-pink">Articles</a> / Not found';
        return;
      }

      document.title = `${article.title} | Rajasthan Calendar`;
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.href = `${getBaseUrl()}/articles/${article.slug}.html`;
      }
      const description = document.querySelector('meta[name="description"]');
      if (description) {
        description.setAttribute('content', article.excerpt);
      }
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', article.title);
      }
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', article.excerpt);
      }
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        ogImage.setAttribute('content', `${getBaseUrl()}${article.image}`);
      }
      const articleSchema = document.querySelector('script[type="application/ld+json"]');
      if (articleSchema) {
        const schema = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.title,
          description: article.excerpt,
          image: `${getBaseUrl()}${article.image}`,
          author: { '@type': 'Person', name: article.author },
          datePublished: article.date,
          mainEntityOfPage: `${getBaseUrl()}/articles/${article.slug}.html`
        };
        articleSchema.textContent = JSON.stringify(schema);
      }

      articleTitle.textContent = article.title;
      articleMeta.textContent = `${article.category} • ${article.readingTime} • ${formatDate(article.date)}`;
      articleContent.innerHTML = article.content;
      articleImage.src = article.image;
      articleImage.alt = article.title;
      breadcrumbs.innerHTML = `<a href="./index.html" class="hover:text-raj-pink">Articles</a> / <span>${article.title}</span>`;

      const related = articles.filter((item) => item.id !== article.id).slice(0, 2);
      relatedArticlesContainer.innerHTML = related.map((item) => `
        <a href="./${item.slug}.html" class="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <h3 class="font-semibold text-gray-900">${item.title}</h3>
          <p class="mt-2 text-sm text-gray-600">${item.excerpt}</p>
        </a>
      `).join('');
    }).catch((error) => {
      console.error(error);
    });
  }

  if (pagePath.includes('/articles/') && pagePath.endsWith('/index.html')) {
    setupArticleListing();
  } else if (pagePath.includes('/articles/') && pagePath.endsWith('.html')) {
    setupArticleDetail();
  }
})();
