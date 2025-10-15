// === recipes.js — dataload + render + favoritter ===

// ---- Data ----
let ALL_RECIPES_CACHE = null;

export async function loadAllRecipes() {
  if (ALL_RECIPES_CACHE) return ALL_RECIPES_CACHE;

  // Hent alle bundter – tilpas stier hvis nødvendigt
  const files = [
    '/data/recipes-1.json',
    '/data/recipes-2.json',
    '/data/recipes-3.json',
    '/data/recipes-4.json',
    '/data/recipes-5.json'
  ];
  const parts = await Promise.all(files.map(async (url) => {
    try{
      const r = await fetch(url, { cache: 'no-cache' });
      if (!r.ok) throw new Error(url + ' ' + r.status);
      return await r.json();
    }catch(e){
      console.warn('Kunne ikke hente', url, e);
      return [];
    }
  }));

  ALL_RECIPES_CACHE = parts.flat();
  return ALL_RECIPES_CACHE;
}

// ---- Favoritter (localStorage) ----
const FAV_KEY = 'od_favs_v1';

function readFavSet(){
  try{
    const raw = localStorage.getItem(FAV_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  }catch{ return new Set(); }
}
function writeFavSet(set){
  try{ localStorage.setItem(FAV_KEY, JSON.stringify([...set])); }catch{}
}
export function isFav(id){ return readFavSet().has(String(id)); }
export function toggleFav(id){
  const set = readFavSet();
  const key = String(id);
  if (set.has(key)) set.delete(key); else set.add(key);
  writeFavSet(set);
  return set.has(key);
}
export function getFavIds(){ return [...readFavSet()]; }

// ---- UI helpers ----
function heartBtnHTML(id){
  const active = isFav(id);
  return `
    <button class="fav-btn ${active ? 'is-fav':''}" data-fav="${id}" aria-label="Gem som favorit">
      <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.35-9.5-8.35C1 9.5 2.9 6.5 6 6.5c1.9 0 3.1 1 4 2 0.9-1 2.1-2 4-2 3.1 0 5 3 3.5 6.15C19.5 16.65 12 21 12 21z"/></svg>
    </button>`;
}

export function bindFavoriteClicks(root = document){
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-fav]');
    if (!btn) return;
    e.preventDefault();
    const id = btn.getAttribute('data-fav');
    const active = toggleFav(id);
    btn.classList.toggle('is-fav', active);
  });
}

// ---- Card render ----
export function renderRecipeCard(rec){
  const id    = rec.id || rec.slug || rec.key || '';
  const slug  = rec.slug || id;
  const title = rec.title || 'Uden titel';
  const desc  = rec.subtitle || rec.description || '—';
  const tags  = (rec.tags || []).slice(0,3);

  const tagsHtml = tags.map(t => `
    <span class="inline-flex text-[11px] px-2 py-0.5 rounded-full border border-orange-200 text-orange-700 bg-orange-50">${t}</span>
  `).join(' ');

  const stars = Math.round(rec.rating || 4);
  const starHtml = '★★★★★'.split('').map((s,i) =>
    `<span>${i < stars ? '★' : '☆'}</span>`
  ).join('');

  return `
    <a href="/pages/opskrift?slug=${encodeURIComponent(slug)}"
       class="relative card block border bg-white p-4 hover:shadow transition rounded-2xl">
      ${heartBtnHTML(id)}
      <div class="flex flex-col gap-2">
        <div class="flex gap-2 flex-wrap">${tagsHtml}</div>
        <h3 class="text-lg font-semibold leading-snug">${title}</h3>
        <p class="text-sm text-stone-600">${desc}</p>
        <div class="text-sm mt-1">${starHtml} <span class="text-stone-500">(${rec.votes || 0})</span></div>
      </div>
    </a>
  `;
}

// Auto-wire favorites (for sider der bare importerer recipes.js)
document.addEventListener('DOMContentLoaded', () => bindFavoriteClicks(document));
