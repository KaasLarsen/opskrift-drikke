// === seneste.js — viser alle opskrifter med pagination (30 pr. side) ===
import { loadAllRecipes, renderRecipeCard } from '/js/recipes.js';

const PAGE_SIZE = 30;

function sortByDateOrTitle(a, b) {
  // Hvis dine data har "date" eller "lastModified", så brug det – ellers fallback til title
  const da = a.date || a.lastModified || '';
  const db = b.date || b.lastModified || '';
  if (da && db) return (new Date(db)) - (new Date(da));
  return (a.title||'').localeCompare(b.title||'');
}

function renderPager(total, page, onPage) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return '';

  const btn = (p, label = p, active = false) =>
    `<button data-page="${p}" class="px-3 py-1.5 rounded-lg border ${active ? 'bg-orange-500 text-white border-orange-500' : 'bg-white hover:bg-stone-50'}">${label}</button>`;

  const parts = [];
  // Første & Forrige
  if (page > 1) {
    parts.push(btn(1, '«'));
    parts.push(btn(page - 1, '‹'));
  }

  // Midtersekvens (max ~7 knapper)
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, page + 2);
  for (let p = start; p <= end; p++) parts.push(btn(p, String(p), p === page));

  // Næste & Sidste
  if (page < pages) {
    parts.push(btn(page + 1, '›'));
    parts.push(btn(pages, '»'));
  }

  return `
    <div class="mt-6 flex flex-wrap gap-2 items-center justify-center">${parts.join('')}</div>
  `;
}

async function mountSeneste() {
  const grid = document.querySelector('#results');
  if (!grid) return;

  const list = (await loadAllRecipes()).slice().sort(sortByDateOrTitle);

  // side fra query ?page=2
  const url = new URL(location.href);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const start = (page - 1) * PAGE_SIZE;
  const view = list.slice(start, start + PAGE_SIZE);

  grid.innerHTML = view.map(renderRecipeCard).join('');

  const pagerHtml = renderPager(list.length, page, null);
  const pagerSlotId = 'pager-slot';
  let pagerSlot = document.getElementById(pagerSlotId);
  if (!pagerSlot) {
    pagerSlot = document.createElement('div');
    pagerSlot.id = pagerSlotId;
    grid.parentElement.appendChild(pagerSlot);
  }
  pagerSlot.innerHTML = pagerHtml;

  // Klikhåndtering
  pagerSlot.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-page]');
    if (!btn) return;
    const p = parseInt(btn.dataset.page, 10);
    const u = new URL(location.href);
    u.searchParams.set('page', String(p));
    location.href = u.toString();
  });
}

document.addEventListener('DOMContentLoaded', mountSeneste);
