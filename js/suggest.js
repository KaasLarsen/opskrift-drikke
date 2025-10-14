// suggest.js – let forslag under #homeSearch
import { loadAllRecipes } from '/js/recipes.js';

let cache = null;
const MAX_SHOW = 8;

function ensureBox() {
  let box = document.getElementById('suggestions');
  if (!box) {
    box = document.createElement('div');
    box.id = 'suggestions';
    document.querySelector('.hero-search-wrap')?.appendChild(box);
  }
  return box;
}

function match(q, r) {
  const hay = `${r.title} ${r.tags?.join(' ') || ''}`.toLowerCase();
  return hay.includes(q);
}

function row(r) {
  const tags = (r.tags || []).slice(0,3).map(t=>`<span class="suggest-meta">#${t}</span>`).join('');
  return `<div data-href="/pages/opskrift?slug=${encodeURIComponent(r.slug)}">
    <strong>${r.title}</strong>
    ${tags}
  </div>`;
}

async function mountSuggest() {
  const input = document.getElementById('homeSearch');
  if (!input) return;

  cache = await loadAllRecipes();
  const box = ensureBox();

  function close() { box.classList.remove('active'); box.innerHTML = ''; }
  function open(html) { box.innerHTML = html; box.classList.add('active'); }

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { close(); return; }
    const hits = cache.filter(r => match(q, r)).slice(0, MAX_SHOW);
    if (!hits.length) { close(); return; }
    open(hits.map(row).join(''));
  });

  box.addEventListener('click', (e) => {
    const item = e.target.closest('[data-href]');
    if (item) location.href = item.dataset.href;
  });

  document.addEventListener('click', (e) => {
    if (!box.contains(e.target) && e.target !== input) close();
  });
}

document.addEventListener('DOMContentLoaded', mountSuggest);
