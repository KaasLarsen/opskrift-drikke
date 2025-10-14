// === search.js — søg + forslag på forsiden ===
import { loadAllRecipes } from '/js/recipes.js';

const MAX_SUGGEST = 8;

function ensureSuggestionBox(input) {
  let box = document.getElementById('suggestions');
  if (!box) {
    box = document.createElement('div');
    box.id = 'suggestions';
    input.parentElement.appendChild(box);
  }
  return box;
}

function matchScore(q, r) {
  q = q.toLowerCase();
  const hay = (r.title || '').toLowerCase() + ' ' + (r.tags || []).join(' ').toLowerCase();
  // simple contains score
  if (hay.includes(q)) return 1;
  return 0;
}

function renderItem(r) {
  const title = r.title || 'Uden titel';
  const tags = Array.isArray(r.tags) ? r.tags.slice(0,3).join(', ') : '';
  return `<div data-slug="${encodeURIComponent(r.slug)}">
    <strong>${title}</strong>
    ${tags ? `<span class="suggest-meta">${tags}</span>` : ''}
  </div>`;
}

async function mountSearch() {
  const input = document.getElementById('homeSearch');
  if (!input) return;

  const list = await loadAllRecipes();
  const box = ensureSuggestionBox(input);
  let current = -1;
  let items = [];

  function show(q) {
    if (!q || q.trim().length < 2) {
      box.classList.remove('active');
      box.innerHTML = '';
      return;
    }
    const ql = q.trim().toLowerCase();
    const hits = list
      .map(r => ({ r, s: matchScore(ql, r) }))
      .filter(x => x.s > 0)
      .slice(0, 400) // grov begrænsning
      .sort((a,b) => b.s - a.s || (a.r.title||'').localeCompare(b.r.title||''))
      .slice(0, MAX_SUGGEST)
      .map(x => x.r);

    items = hits;
    current = -1;
    box.innerHTML = hits.map(renderItem).join('');
    box.classList.toggle('active', hits.length > 0);
  }

  function goto(r) {
    if (!r) return;
    location.href = `/pages/opskrift?slug=${encodeURIComponent(r.slug)}`;
  }

  input.addEventListener('input', () => show(input.value));
  input.addEventListener('focus', () => show(input.value));

  input.addEventListener('keydown', (e) => {
    const rows = Array.from(box.querySelectorAll('div[data-slug]'));
    if (!rows.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      current = (current + 1) % rows.length;
      rows.forEach((el,i) => el.style.background = i===current ? '#fff7f2' : '');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      current = (current - 1 + rows.length) % rows.length;
      rows.forEach((el,i) => el.style.background = i===current ? '#fff7f2' : '');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      goto(current >= 0 ? items[current] : items[0]);
    } else if (e.key === 'Escape') {
      box.classList.remove('active');
      box.innerHTML = '';
    }
  });

  box.addEventListener('mousedown', (e) => {
    const row = e.target.closest('div[data-slug]');
    if (!row) return;
    const slug = decodeURIComponent(row.getAttribute('data-slug'));
    const r = items.find(x => String(x.slug) === slug);
    goto(r);
  });

  document.addEventListener('click', (e) => {
    if (e.target === input || box.contains(e.target)) return;
    box.classList.remove('active');
  });
}

document.addEventListener('DOMContentLoaded', mountSearch);
