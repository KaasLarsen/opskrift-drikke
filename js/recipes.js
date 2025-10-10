import { formatStars, showToast } from './app.js';
import { currentUser } from './auth.js';

let __cache = null;

async function loadChunk(i){
  const res = await fetch(`/data/recipes-${i}.json`).then(r=> r.ok ? r.json() : []);
  return res;
}

export async function loadAllRecipes(progressCb){
  if (__cache) return __cache;
  // try chunked first
  try {
    const first = await loadChunk(1);
    if (Array.isArray(first) && first.length) {
      __cache = first.slice();
      // background load rest (attempt up to 20 chunks just in case)
      for (let i=2;i<=20;i++){
        try{
          const r = await fetch(`/data/recipes-${i}.json`, {cache:'force-cache'});
          if (!r.ok) break;
          const arr = await r.json();
          if (!Array.isArray(arr) || !arr.length) break;
          __cache = __cache.concat(arr);
          if (progressCb) progressCb(__cache.length);
          // dispatch global event
          window.dispatchEvent(new CustomEvent('recipes:updated', {detail:{count:__cache.length}}));
        }catch(e){ break; }
      }
      return __cache;
    }
  } catch(e){ /* fall back below */ }
  // fallback to full file
  __cache = await fetch('/data/recipes.json').then(r=>r.json());
  if (progressCb) progressCb(__cache.length);
  window.dispatchEvent(new CustomEvent('recipes:updated', {detail:{count:__cache.length}}));
  return __cache;
}

export function getFavorites(){
  try { return JSON.parse(localStorage.getItem('od_favs')||'[]'); } catch(e){ return []; }
}
export function setFavorites(list){
  localStorage.setItem('od_favs', JSON.stringify(list));
}
export function toggleFavorite(slug){
  const favs = getFavorites();
  const i = favs.indexOf(slug);
  if (i>=0) favs.splice(i,1); else favs.push(slug);
  setFavorites(favs);
  return favs.includes(slug);
}

export function renderRecipeCard(r){
  const favs = getFavorites();
  const isFav = favs.includes(r.slug);
  return `<a href="/pages/opskrift.html?slug=${r.slug}" class="block card bg-white p-4 hover:shadow-md transition">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-lg font-medium">${r.title}</h3>
        <p class="text-sm opacity-70 mt-1">${r.category} · ${r.time} min</p>
      </div>
      <button data-fav="${r.slug}" class="favBtn inline-flex items-center gap-1 border px-2 py-1 rounded-2xl ${isFav?'bg-rose-50 border-rose-300':''}" onclick="event.preventDefault();">
        <svg class="w-4 h-4 ${isFav?'':'opacity-30'}"><use href="/assets/icons.svg#heart"/></svg>
        <span>${isFav?'Gemt':'Gem'}</span>
      </button>
    </div>
    <div class="mt-3 flex items-center gap-2">${formatStars(r.rating)}<span class="text-sm opacity-70">(${r.reviews})</span></div>
    <p class="text-sm mt-2 line-clamp-2">${r.description}</p>
    <div class="mt-3 flex gap-2 flex-wrap text-xs opacity-80">
      ${r.tags.map(t=>`<span class="px-2 py-1 rounded-full border">${t}</span>`).join('')}
    </div>
  </a>`;
}

// Mount on pages that have a #results or #favoritesList
document.addEventListener('DOMContentLoaded', async () => {
  const results = document.getElementById('results');
  const favWrap = document.getElementById('favoritesList');
  if (!results && !favWrap) return;

  // load first chunk fast (or fallback to all)
  let data;
  try {
    data = await loadAllRecipes();
  } catch(e){
    data = await fetch('/data/recipes.json').then(r=>r.json());
  }
  window.__allRecipes = data;

  if (results) {
    results.innerHTML = data.slice(0, 30).map(renderRecipeCard).join('');
    // Gate favorite: must be logged in
    results.addEventListener('click', (e)=>{
      const btn = e.target.closest('[data-fav]');
      if (!btn) return;
      const u = currentUser();
      if (!u) { showToast('Du skal være logget ind for at gemme'); return; }
      const slug = btn.getAttribute('data-fav');
      const ok = toggleFavorite(slug);
      if (ok){ btn.classList.add('bg-rose-50','border-rose-300'); btn.querySelector('span').textContent='Gemt'; btn.querySelector('svg').classList.remove('opacity-30'); }
      else { btn.classList.remove('bg-rose-50','border-rose-300'); btn.querySelector('span').textContent='Gem'; btn.querySelector('svg').classList.add('opacity-30'); }
    });
  }

  if (favWrap) {
    const favs = getFavorites();
    const list = data.filter(r=>favs.includes(r.slug));
    favWrap.innerHTML = list.map(renderRecipeCard).join('') || '<p>Ingen favoritter endnu.</p>';
  }
});
