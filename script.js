let allLinks = [];
let activeCategory = null;

fetch('links.json')
  .then(res => res.json())
  .then(data => {
    allLinks = data;
    buildFilters(allLinks);
    render(allLinks);
  })
  .catch(err => {
    document.getElementById('links').innerHTML =
      '<p style="color:#f66">Could not load links.json — check the file exists and is valid JSON.</p>';
    console.error(err);
  });

function render(links) {
  const container = document.getElementById('links');
  if (links.length === 0) {
    container.innerHTML = '<p style="color:#777">No matches.</p>';
    return;
  }
  container.innerHTML = links.map(l => `
    <div class="card">
      <a href="${l.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.name)}</a>
      <div><span class="category">${escapeHtml(l.category || 'Uncategorized')}</span></div>
      <p>${escapeHtml(l.notes || '')}</p>
    </div>
  `).join('');
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
  const cats = [...new Set(links.map(l => l.category).filter(Boolean))].sort();
  const el = document.getElementById('filters');

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