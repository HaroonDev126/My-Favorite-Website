let allLinks = [];
let activeCategory = null;

// --- Theme handling ---
const themeToggle = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('theme') ||
  (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  localStorage.setItem('theme', next);
});

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    themeToggle.textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeToggle.textContent = '🌙';
  }
}

// --- View handling (grid/list) ---
const viewToggle = document.getElementById('view-toggle');
const linksContainer = document.getElementById('links');
const savedView = localStorage.getItem('view') || 'grid';

applyView(savedView);

viewToggle.addEventListener('click', () => {
  const current = linksContainer.classList.contains('list-view') ? 'list' : 'grid';
  const next = current === 'grid' ? 'list' : 'grid';
  applyView(next);
  localStorage.setItem('view', next);
});

function applyView(view) {
  linksContainer.classList.remove('grid-view', 'list-view');
  linksContainer.classList.add(view === 'list' ? 'list-view' : 'grid-view');
  viewToggle.textContent = view === 'list' ? '☰' : '▦';
}

// --- Data loading ---
fetch('links.json')
  .then(res => res.json())
  .then(data => {
    allLinks = data;
    reportCounts(allLinks);
    buildFilters(allLinks);
    render(allLinks);
  })
  .catch(err => {
    linksContainer.innerHTML =
      '<p style="color:#f66">Could not load links.json — check the file exists and is valid JSON.</p>';
    console.error(err);
  });

// Counts total entries, flags duplicate URLs, and shows the true unique count.
function reportCounts(links) {
  const seen = new Map();
  const duplicates = [];

  links.forEach(l => {
    const key = l.url.trim().toLowerCase().replace(/\/$/, '');
    if (seen.has(key)) {
      duplicates.push(l.url);
    } else {
      seen.set(key, true);
    }
  });

  const uniqueCount = seen.size;
  const totalCount = links.length;

  const countEl = document.getElementById('link-count');
  if (duplicates.length > 0) {
    countEl.textContent = `${uniqueCount} unique tools bookmarked (${duplicates.length} duplicate${duplicates.length > 1 ? 's' : ''} found — check console)`;
    console.warn('Duplicate URLs in links.json:', duplicates);
  } else {
    countEl.textContent = `${totalCount} unique tools bookmarked`;
  }
}

function render(links) {
  if (links.length === 0) {
    linksContainer.innerHTML = '<p style="color:#777">No matches.</p>';
    return;
  }
  linksContainer.innerHTML = links.map(l => {
    let favicon = '';
    try {
      const domain = new URL(l.url).hostname;
      favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch (e) {}
    return `
      <div class="card">
        <div class="card-header">
          ${favicon ? `<img src="${favicon}" class="favicon" alt="" loading="lazy" onerror="this.style.display='none'">` : ''}
          <a href="${l.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.name)}</a>
        </div>
        <div><span class="category">${escapeHtml(l.category || 'Uncategorized')}</span></div>
        <p>${escapeHtml(l.notes || '')}</p>
      </div>
    `;
  }).join('');
}

function applyFilters() {
  const q = document.getElementById('search').value.toLowerCase();
  let filtered = allLinks;

  if (activeCategory) {
    filtered = filtered.filter(l => l.category === activeCategory);
  }
  if (q) {
    filtered = filtered.filter(l =>
      l.name.toLowerCase().includes(q) ||
      (l.category || '').toLowerCase().includes(q) ||
      (l.notes || '').toLowerCase().includes(q)
    );
  }
  render(filtered);
}

document.getElementById('search').addEventListener('input', applyFilters);

function buildFilters(links) {
  const cats = [...new Set(links.map(l => l.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  const el = document.getElementById('filters');
  el.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.textContent = 'All';
  allBtn.className = 'active';
  allBtn.onclick = () => setCategory(null, allBtn);
  el.appendChild(allBtn);

  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.onclick = () => setCategory(cat, btn);
    el.appendChild(btn);
  });
}

function setCategory(cat, btnEl) {
  activeCategory = cat;
  document.querySelectorAll('#filters button').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');
  applyFilters();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}