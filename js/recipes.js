
import { formatStars } from './app.js';

let __cache = null;

async function loadChunk(i){
  const res = await fetch(`/data/recipes-${i}.json`).then(r=>r.json());
  return res;
}

export async function loadAllRecipes(progressCb){
  if (__cache) return __cache;
  const first = await loadChunk(1);
  __cache = first.slice(); // copy
  // lazy-load rest
  const chunkPromises = [];
  let i = 2;
  while (true){
    const url = `/data/recipes-${i}.json`;
    try {
      const res = await fetch(url, {cache:'force-cache'});
      if (!res.ok) break;
      const arr = await res.json();
      __cache = __cache.concat(arr);
      if (progressCb) progressCb(__cache.length);
      i++;
    } catch(e){
      break;
    }
  }
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

// Auto-mount on index and favorites
document.addEventListener('DOMContentLoaded', async () => {
  const results = document.getElementById('results');
  const favWrap = document.getElementById('favoritesList');
  if (!results && !favWrap) return;

  // Load first chunk fast
  const first = await fetch('/data/recipes-1.json').then(r=>r.json());
  window.__allRecipes = first.slice();

  // Initial render
  if (results){
    results.innerHTML = first.slice(0, 30).map(renderRecipeCard).join('');
    // attach fav toggle
    results.addEventListener('click', (e)=>{
      const btn = e.target.closest('[data-fav]');
      if (!btn) return;
      const slug = btn.getAttribute('data-fav');
      const ok = toggleFavorite(slug);
      if (ok){ btn.classList.add('bg-rose-50','border-rose-300'); btn.querySelector('span').textContent='Gemt'; btn.querySelector('svg').classList.remove('opacity-30'); }
      else { btn.classList.remove('bg-rose-50','border-rose-300'); btn.querySelector('span').textContent='Gem'; btn.querySelector('svg').classList.add('opacity-30'); }
    });
  }

  if (favWrap) {
    const favs = getFavorites();
    const list = first.filter(r=>favs.includes(r.slug));
    favWrap.innerHTML = list.map(renderRecipeCard).join('') || '<p>Ingen favoritter endnu.</p>';
  }

  // Load remaining chunks in background and update globals + placeholders
  loadAllRecipes((len)=>{
    window.__allRecipes = __cache;
    const input = document.getElementById('searchInput');
    if (input) input.placeholder = `Søg i ${len.toLocaleString('da-DK')} drikkeopskrifter...`;
  });
});
