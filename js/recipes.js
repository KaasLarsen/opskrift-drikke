// === /js/recipes.js — robust data-load + kort + favoritter (med login-krav) ===

// ---------- Robust data-load ----------
let ALL_RECIPES_CACHE = null;

// Prøv flere mulige placeringer
const CANDIDATE_SOURCES = [
  '/data/recipes.json',
  '/data/recipes-1.json','/data/recipes-2.json','/data/recipes-3.json','/data/recipes-4.json','/data/recipes-5.json',
  '/data/recipes-6.json','/data/recipes-7.json','/data/recipes-8.json','/data/recipes-9.json','/data/recipes-10.json',
  // backstops
  '/recipes.json',
  '/recipes-1.json','/recipes-2.json','/recipes-3.json','/recipes-4.json','/recipes-5.json'
];

async function fetchJson(url){
  const r = await fetch(url, { cache: 'no-cache' });
  if(!r.ok) throw new Error(`${url} ${r.status}`);
  return r.json();
}

export async function loadAllRecipes(){
  if (ALL_RECIPES_CACHE) return ALL_RECIPES_CACHE;

  const chunks = await Promise.all(CANDIDATE_SOURCES.map(async url => {
    try{
      const data = await fetchJson(url);
      if (!Array.isArray(data)) return [];
      return data;
    }catch(e){
      console.debug('[recipes] skip', url, e.message);
      return [];
    }
  }));

  // Dedupe på slug/id
  const seen = new Set();
  const all  = [];
  for (const arr of chunks) {
    for (const r of arr) {
      const key = String(r.slug || r.id || r.key || '');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      all.push(r);
    }
  }

  ALL_RECIPES_CACHE = all;
  if (!ALL_RECIPES_CACHE.length) {
    console.error('[recipes] Ingen opskrifter fundet – tjek at dine /data/*.json findes.');
  }
  return ALL_RECIPES_CACHE;
}

// ---------- Favoritter (localStorage) ----------
const FAV_KEY = 'od_favs_v1';
function readFavSet(){ try{ return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); }catch{ return new Set(); } }
function writeFavSet(s){ try{ localStorage.setItem(FAV_KEY, JSON.stringify([...s])); }catch{} }

export function isFav(id){ return readFavSet().has(String(id)); }
export function getFavIds(){ return [...readFavSet()]; }

// Kræv login for at kunne fave
function isLoggedIn(){
  try{
    // Kig efter en global der typisk sættes af din auth
    const u = window.currentUser || window.__AUTH_USER__;
    return !!(u && (u.id || u.email));
  }catch{ return false; }
}

export function toggleFav(id){
  if (!isLoggedIn()){
    alert('Du skal være logget ind for at gemme favoritter.');
    return isFav(id); // uændret
  }
  const s = readFavSet();
  const k = String(id);
  s.has(k) ? s.delete(k) : s.add(k);
  writeFavSet(s);
  return s.has(k);
}

// ---------- Kort-render ----------
function heartBtnHTML(id){
  const active = isFav(id);
  return `
    <button class="fav-btn ${active ? 'is-fav':''}" data-fav="${id}" aria-label="Gem som favorit" title="Gem som favorit">
      <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.35-9.5-8.35C1 9.5 2.9 6.5 6 6.5c1.9 0 3.1 1 4 2 0.9-1 2.1-2 4-2 3.1 0 5 3 3.5 6.15C19.5 16.65 12 21 12 21z"/></svg>
    </button>`;
}

export function bindFavoriteClicks(root=document){
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-fav]');
    if (!btn) return;
    e.preventDefault();
    const id = btn.getAttribute('data-fav');
    const ok = toggleFav(id);
    btn.classList.toggle('is-fav', ok);
  });
}

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
  const starHtml = '★★★★★'.split('').map((s,i)=>`<span>${i<stars?'★':'☆'}</span>`).join('');

  return `
    <a href="/pages/opskrift.html?slug=${encodeURIComponent(slug)}"
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

// ---------- Auto-mount forsiden (#results) ----------
async function mountFrontpageGrid(){
  const grid = document.getElementById('results');
  if (!grid) return;
  try{
    const list = await loadAllRecipes();
    grid.innerHTML = list.slice(0,24).map(renderRecipeCard).join('');
  }catch(e){
    console.error('[recipes] kunne ikke rendere forsiden', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  bindFavoriteClicks(document);
  mountFrontpageGrid();
});
