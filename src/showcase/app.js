/* ======================================================
   Kairo — Showcase SPA Router & Controller
   Hash-based routing: #/ (directory), #/preview/{slug},
   #/compare?pages=slug1,slug2
   ====================================================== */

(function () {
  'use strict';

  // ── State ──
  let activeFilter = null;
  let searchQuery = '';
  let currentDevice = 'desktop';

  const DEVICE_WIDTHS = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
  };

  // ── DOM refs (set after DOMContentLoaded) ──
  let $grid, $search, $tagBar, $previewView, $compareView, $directoryView;
  let $previewIframe, $previewTitle, $previewBar;
  let $compareSlots, $compareBar;

  // ── Helpers ──
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; }

  function getHash() {
    return decodeURIComponent(window.location.hash || '#/');
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  function findPage(slug) {
    return PAGE_REGISTRY.find(p => p.slug === slug);
  }

  // ── Render: Directory Cards ──
  function renderCards() {
    const q = searchQuery.toLowerCase();
    const cards = PAGE_REGISTRY.filter(page => {
      if (activeFilter && !page.tags.includes(activeFilter)) return false;
      if (q && !page.name.toLowerCase().includes(q) &&
          !page.description.toLowerCase().includes(q) &&
          !page.tags.some(t => t.includes(q))) return false;
      return true;
    });

    $grid.innerHTML = cards.map(page => `
      <a href="#/preview/${page.slug}" class="sc-card" data-page="${page.slug}">
        <div class="sc-card-preview ${page.previewClass}">
          ${getPreviewWireframe(page.slug)}
        </div>
        <div class="sc-card-body">
          <div class="sc-card-tag ${page.cssClass}">${page.version}</div>
          <h2 class="sc-card-title">${page.name}</h2>
          <p class="sc-card-desc">${page.description}</p>
        </div>
        <div class="sc-card-actions">
          <button class="sc-card-compare-btn" data-slug="${page.slug}" title="Add to compare" onclick="event.preventDefault(); event.stopPropagation(); KairoApp.toggleCompare('${page.slug}')">
            ⚖ Compare
          </button>
        </div>
      </a>
    `).join('');

    // Highlight favourite
    const prefs = (typeof KairoFeedback !== 'undefined') ? KairoFeedback.getPreferences() : {};
    let best = null, bestNet = -Infinity;
    for (const [id, s] of Object.entries(prefs)) {
      if (s.net > bestNet) { bestNet = s.net; best = id; }
    }
    if (best) {
      const card = qs(`[data-page="${best}"]`, $grid);
      if (card) card.classList.add('favourite');
    }

    // Show "no results" if empty
    if (cards.length === 0) {
      $grid.innerHTML = '<p class="sc-no-results">No pages match your search. Try different keywords or clear filters.</p>';
    }
  }

  function getPreviewWireframe(slug) {
    const wireframes = {
      'v1-momentum': `
        <div class="sc-preview-nav"><div class="sc-preview-dot"></div><div class="sc-preview-bar"></div><div class="sc-preview-bar short"></div></div>
        <div class="sc-preview-split">
          <div class="sc-preview-split-left"><div class="sc-preview-heading"></div><div class="sc-preview-heading short"></div><div class="sc-preview-text"></div><div class="sc-preview-cta"></div></div>
          <div class="sc-preview-split-right"><div class="sc-preview-stat-grid"><div class="sc-preview-stat"></div><div class="sc-preview-stat"></div><div class="sc-preview-stat"></div><div class="sc-preview-stat"></div></div></div>
        </div>`,
      'v2-nightfall': `
        <div class="sc-preview-nav"><div class="sc-preview-dot"></div><div class="sc-preview-bar"></div></div>
        <div class="sc-preview-cinematic"><div class="sc-preview-eyebrow"></div><div class="sc-preview-heading wide"></div><div class="sc-preview-divider-line"></div><div class="sc-preview-text"></div></div>
        <div class="sc-preview-alternating"><div class="sc-preview-alt-row"><div class="sc-preview-alt-icon"></div><div class="sc-preview-alt-lines"><div class="sc-preview-heading short"></div><div class="sc-preview-text"></div></div></div></div>`,
      'v3-pulse': `
        <div class="sc-preview-nav"><div class="sc-preview-dot"></div><div class="sc-preview-bar"></div><div class="sc-preview-bar short"></div></div>
        <div class="sc-preview-centered"><div class="sc-preview-pill"></div><div class="sc-preview-heading"></div><div class="sc-preview-text"></div><div class="sc-preview-cta-row"><div class="sc-preview-cta"></div><div class="sc-preview-cta outline"></div></div></div>
        <div class="sc-preview-hstrip"><div class="sc-preview-hstrip-card"></div><div class="sc-preview-hstrip-card"></div><div class="sc-preview-hstrip-card"></div></div>`
    };
    return wireframes[slug] || '';
  }

  // ── Render: Tag filter pills ──
  function renderTags() {
    $tagBar.innerHTML = `
      <button class="sc-tag-pill ${!activeFilter ? 'active' : ''}" data-tag="">All</button>
      ${ALL_TAGS.map(t => `<button class="sc-tag-pill ${activeFilter === t ? 'active' : ''}" data-tag="${t}">${t}</button>`).join('')}
    `;

    qsa('.sc-tag-pill', $tagBar).forEach(btn => {
      btn.addEventListener('click', () => {
        activeFilter = btn.dataset.tag || null;
        renderTags();
        renderCards();
      });
    });
  }

  // ── Views ──
  function showView(view) {
    $directoryView.classList.toggle('active', view === 'directory');
    $previewView.classList.toggle('active', view === 'preview');
    $compareView.classList.toggle('active', view === 'compare');
  }

  // ── Preview ──
  function showPreview(slug) {
    const page = findPage(slug);
    if (!page) { navigate('#/'); return; }

    showView('preview');
    $previewTitle.textContent = page.name;
    $previewIframe.src = page.file;
    setDevice(currentDevice);

    // Build prev/next
    const idx = PAGE_REGISTRY.indexOf(page);
    const prev = PAGE_REGISTRY[idx - 1];
    const next = PAGE_REGISTRY[idx + 1];

    const $prevBtn = qs('.sc-preview-prev');
    const $nextBtn = qs('.sc-preview-next');
    if ($prevBtn) {
      $prevBtn.style.display = prev ? '' : 'none';
      $prevBtn.onclick = () => navigate(`#/preview/${prev.slug}`);
      $prevBtn.textContent = prev ? `← ${prev.name}` : '';
    }
    if ($nextBtn) {
      $nextBtn.style.display = next ? '' : 'none';
      $nextBtn.onclick = () => navigate(`#/preview/${next.slug}`);
      $nextBtn.textContent = next ? `${next.name} →` : '';
    }
  }

  function setDevice(device) {
    currentDevice = device;
    $previewIframe.style.maxWidth = DEVICE_WIDTHS[device];
    // Update active button
    qsa('.sc-device-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.device === device);
    });
  }

  // ── Compare ──
  const compareSet = new Set();

  function toggleCompare(slug) {
    if (compareSet.has(slug)) {
      compareSet.delete(slug);
    } else {
      if (compareSet.size >= 3) {
        alert('Compare up to 3 pages at a time.');
        return;
      }
      compareSet.add(slug);
    }
    updateCompareButtons();
    // If already in compare view, re-render
    if (getHash().startsWith('#/compare')) showCompare();
  }

  function updateCompareButtons() {
    qsa('.sc-card-compare-btn').forEach(btn => {
      btn.classList.toggle('active', compareSet.has(btn.dataset.slug));
      btn.textContent = compareSet.has(btn.dataset.slug) ? '✓ Added' : '⚖ Compare';
    });

    // Show/hide floating compare bar
    const $floatingBar = qs('.sc-compare-floating');
    if ($floatingBar) {
      if (compareSet.size >= 2) {
        $floatingBar.classList.add('visible');
        qs('.sc-compare-count', $floatingBar).textContent = compareSet.size;
      } else {
        $floatingBar.classList.remove('visible');
      }
    }
  }

  function showCompare() {
    const slugs = [...compareSet];
    if (slugs.length < 2) {
      navigate('#/');
      return;
    }
    showView('compare');
    navigate(`#/compare?pages=${slugs.join(',')}`);

    $compareSlots.innerHTML = slugs.map(slug => {
      const page = findPage(slug);
      if (!page) return '';
      return `
        <div class="sc-compare-slot">
          <div class="sc-compare-slot-header">
            <h3>${page.name}</h3>
            <button class="sc-compare-remove" onclick="KairoApp.toggleCompare('${slug}')" title="Remove">✕</button>
          </div>
          <iframe class="sc-compare-iframe" src="${page.file}" title="Preview of ${page.name}"></iframe>
        </div>
      `;
    }).join('');
  }

  // ── Router ──
  function route() {
    const hash = getHash();

    if (hash.startsWith('#/preview/')) {
      const slug = hash.replace('#/preview/', '');
      showPreview(slug);
    } else if (hash.startsWith('#/compare')) {
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const pages = (params.get('pages') || '').split(',').filter(Boolean);
      pages.forEach(s => compareSet.add(s));
      showCompare();
    } else {
      showView('directory');
      renderCards();
    }
  }

  // ── Init ──
  function init() {
    $grid = qs('#sc-grid');
    $search = qs('#sc-search');
    $tagBar = qs('#sc-tags');
    $directoryView = qs('#view-directory');
    $previewView = qs('#view-preview');
    $compareView = qs('#view-compare');
    $previewIframe = qs('#preview-iframe');
    $previewTitle = qs('#preview-title');
    $previewBar = qs('.sc-preview-bar-util');
    $compareSlots = qs('#compare-slots');

    // Search
    if ($search) {
      $search.addEventListener('input', e => {
        searchQuery = e.target.value;
        renderCards();
      });
    }

    // Device buttons
    qsa('.sc-device-btn').forEach(btn => {
      btn.addEventListener('click', () => setDevice(btn.dataset.device));
    });

    // Floating compare launch
    const $launchCompare = qs('.sc-compare-launch');
    if ($launchCompare) {
      $launchCompare.addEventListener('click', () => {
        if (compareSet.size >= 2) showCompare();
      });
    }

    // Tags
    renderTags();

    // Router
    window.addEventListener('hashchange', route);
    route();
  }

  document.addEventListener('DOMContentLoaded', init);

  // Public API
  window.KairoApp = { toggleCompare };
})();
