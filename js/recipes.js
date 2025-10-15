// === recipes.js — robust dataload + favoritter + kort-render ===

// ---------- ROBUST DATALOAD ----------
let ALL_RECIPES_CACHE = null;

// Alle mulige stier vi prøver – tilpas rækkefølge frit
const CANDIDATE_SOURCES = [
  // primær placering
  '/data/recipes.json',
  // shards
  '/data/recipes-1.json','/data/recipes-2.json','/data/recipes-3.json','/data/recipes-4.json','/data/recipes-5.json',
  '/data/recipes-6.json','/data/recipes-7.json','/data/recipes-8.json','/data/recipes-9.json','/data/recipes-10.json',
  // fallback hvis de ligger i roden
  '/recipes.json',
  '/recipes-1.json','/recipes-2.json','/recipes-3.json','/recipes-4.json','/recipes-5.json'
];
function normalizeRecipe(r) {
  // rating
  const ratingRaw = r.rating ?? r.stars ?? r.score ?? r.avgRating ?? null;
  const rating = typeof ratingRaw === 'number' ? ratingRaw
              : ratingRaw ? parseFloat(String(ratingRaw).replace(',', '.')) : null;

  // votes / reviews count
  const votesRaw = r.votes ?? r.reviews ?? r.reviewCount ?? r.ratingCount ?? r.votesCount ?? (Array.isArray(r.ratings) ? r.ratings.length : null);
  const votes = typeof votesRaw === 'number' ? votesRaw
              : votesRaw ? parseInt(votesRaw, 10) : 0;

  return {
    ...r,
    rating: (rating != null && !Number.isNaN(rating)) ? rating : 4, // pæn fallback
    votes: (!Number.isNaN(votes) && votes != null) ? votes : 0,
  };
}

export async function loadAllRecipes() {
  if (ALL_RECIPES_CACHE) return ALL_RECIPES_CACHE;

  const chunks = await Promise.all(CANDIDATE_SOURCES.map(async (url) => {
    try {
      const r = await fetch(url, { cache: 'no-cache' });
      if (!r.ok) throw new Error(`${url} ${r.status}`);
      const json = await r.json();
      if (!Array.isArray(json)) throw new Error(`${url} no array`);
      console.debug('[recipes] OK', url, `(${json.length})`);
      return json;
    } catch (e) {
      console.debug('[recipes] SKIP', url, e.message);
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

  // Eksponer til Console-debug
  try { window.__RECIPES = ALL_RECIPES_CACHE; } catch {}

  console.log('[recipes] total loaded:', ALL_RECIPES_CACHE.length);
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
    const id = btn.getAttribute('data-fav');
    const active = toggleFav(id);
    btn.classList.toggle('is-fav', active);
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

// ---------- AUTO-MOUNT: vis første batch hvis #results findes ----------
async function mountFrontpageGrid(){
  const grid = document.getElementById('results');
  if (!grid) return;                   // ikke på denne side
  try{
    const list = await loadAllRecipes();
    if (!list.length) {
      grid.innerHTML = `
        <div class="col-span-full">
          <div class="card border bg-white p-4 rounded-2xl">
            <div class="font-medium">Kunne ikke indlæse opskrifter lige nu.</div>
            <p class="text-sm text-stone-600 mt-1">Tjek at dine datafiler ligger under <code>/data/</code> eller i roden og at de er tilgængelige.</p>
          </div>
        </div>`;
      return;
    }
    // vis 24 stk som standard
    grid.innerHTML = list.slice(0,24).map(renderRecipeCard).join('');
  }catch(e){
    console.error('[recipes] kunne ikke rendere forsiden', e);
    grid.innerHTML = `
      <div class="col-span-full">
        <div class="card border bg-white p-4 rounded-2xl">
          Noget gik galt ved indlæsning.
        </div>
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  bindFavoriteClicks(document);
  mountFrontpageGrid();  // gør intet hvis #results ikke findes
});
