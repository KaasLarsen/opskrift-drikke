// === recipes.js — robust dataload + favoritter + kort-render ===

// ---------- ROBUST DATALOAD ----------
let ALL_RECIPES_CACHE = null;

// Alle mulige stier vi prøver – tilpas rækkefølge frit
const CANDIDATE_SOURCES = [
  '/data/recipes.json',
  '/data/recipes-1.json','/data/recipes-2.json','/data/recipes-3.json','/data/recipes-4.json','/data/recipes-5.json',
  '/data/recipes-6.json','/data/recipes-7.json','/data/recipes-8.json','/data/recipes-9.json','/data/recipes-10.json',
  '/recipes.json',
  '/recipes-1.json','/recipes-2.json','/recipes-3.json','/recipes-4.json','/recipes-5.json'
];

// cache-version (ændr for at tvinge genindlæsning)
const DATA_VERSION = 'v5003';

// ---------- NORMALISERING AF OPSKRIFTER ----------
function normalizeRecipe(r) {
  const avg   = (r.ratingAverage ?? r.rating ?? 0);
  const count = (r.ratingCount ?? r.reviews ?? r.votes ?? 0);

  const clamped = Math.max(0, Math.min(5, Number(avg) || 0));
  r.ratingAverage = r.rating = Math.round(clamped * 10) / 10;
  r.ratingCount = r.reviews = r.votes = Number(count) || 0;

  return r;
}

// ---------- LOAD AF ALLE OPSKRIFTER ----------
export async function loadAllRecipes() {
  if (ALL_RECIPES_CACHE) return ALL_RECIPES_CACHE;

  const chunks = await Promise.all(CANDIDATE_SOURCES.map(async (url) => {
    try {
      const r = await fetch(`${url}?${DATA_VERSION}`, { cache: 'no-cache' });
      if (!r.ok) throw new Error(`${url} ${r.status}`);
      const json = await r.json();
      if (!Array.isArray(json)) throw new Error(`${url} no array`);
      return json.map(normalizeRecipe);
    } catch (e) {
      console.debug('[recipes] skip', url, e.message);
      return [];
    }
  }));

  // Dedupe (id/slug)
  const seen = new Set();
  const all  = [];
  for (const arr of chunks) {
    for (const r of arr) {
      const key = String(r.id || r.slug || r.key || '');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      all.push(r);
    }
  }

  ALL_RECIPES_CACHE = all;
  if (!ALL_RECIPES_CACHE.length) {
    console.error('[recipes] Ingen opskrifter blev fundet. Tjek at datafilerne findes og kan hentes.');
  }
  return ALL_RECIPES_CACHE;
}

// ---------- FAVORITTER (localStorage) ----------
const FAV_KEY = 'od_favs_v1';
function readFavSet(){ try{ return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); }catch{ return new Set(); } }
function writeFavSet(s){ try{ localStorage.setItem(FAV_KEY, JSON.stringify([...s])); }catch{} }
export function isFav(id){ return readFavSet().has(String(id)); }
export function toggleFav(id){ const s=readFavSet(); const k=String(id); s.has(k)?s.delete(k):s.add(k); writeFavSet(s); return s.has(k); }
export function getFavIds(){ return [...readFavSet()]; }

// ---------- LOGIN CHECK ----------
function isUserLoggedIn(){
  // simpelt check — du kan tilpasse til dit eget auth-system
  return !!localStorage.getItem('od_user');
}

// ---------- UI: hjerte + kort ----------
function heartBtnHTML(id){
  const active = isFav(id);
  return `
    <button class="fav-btn ${active ? 'is-fav':''}" data-fav="${id}" aria-label="Gem som favorit">
      <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.35-9.5-8.35C1 9.5 2.9 6.5 6 6.5c1.9 0 3.1 1 4 2 0.9-1 2.1-2 4-2 3.1 0 5 3 3.5 6.15C19.5 16.65 12 21 12 21z"/></svg>
    </button>`;
}

export function bindFavoriteClicks(root=document){
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-fav]');
    if (!btn) return;
    e.preventDefault();

    if (!isUserLoggedIn()){
      alert("Du skal være logget ind for at gemme en opskrift ❤️");
      return;
    }

    const id = btn.getAttribute('data-fav');
    const active = toggleFav(id);
    btn.classList.toggle('is-fav', active);
  });
}

// ---------- STJERNER + KORT RENDER ----------
export function renderRecipeCard(rec){
  const id    = rec.id || rec.slug || rec.key || '';
  const slug  = rec.slug || id;
  const title = rec.title || 'Uden titel';
  const desc  = rec.subtitle || rec.description || '—';
  const tags  = (rec.tags || []).slice(0,3);
  const tagsHtml = tags.map(t => `
    <span class="inline-flex text-[11px] px-2 py-0.5 rounded-full border border-orange-200 text-orange-700 bg-orange-50">${t}</span>
  `).join(' ');

  const rating = Math.round(rec.ratingAverage || rec.rating || 0);
  const votes  = rec.ratingCount || rec.votes || rec.reviews || 0;
  const starHtml = '★★★★★'.split('').map((s,i)=>`<span>${i<rating?'★':'☆'}</span>`).join('');

  return `
    <a href="/pages/opskrift?slug=${encodeURIComponent(slug)}"
       class="relative card block border bg-white p-4 hover:shadow transition rounded-2xl">
      ${heartBtnHTML(id)}
      <div class="flex flex-col gap-2">
        <div class="flex gap-2 flex-wrap">${tagsHtml}</div>
        <h3 class="text-lg font-semibold leading-snug">${title}</h3>
        <p class="text-sm text-stone-600">${desc}</p>
        <div class="text-sm mt-1">${starHtml} <span class="text-stone-500">(${votes})</span></div>
      </div>
    </a>
  `;
}

// ---------- AUTO-MOUNT: vis første batch hvis #results findes ----------
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
