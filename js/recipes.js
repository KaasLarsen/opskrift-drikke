// /js/recipes.js
import { formatStars, showToast } from './app.js';
import { currentUser } from './auth.js';

let __cache = null;

async function tryJson(url){
  const r = await fetch(url, { cache: 'force-cache' });
  if (!r.ok) throw new Error('http ' + r.status + ' @ ' + url);
  return r.json();
}

export async function loadAllRecipes(progressCb){
  if (__cache) return __cache;

  // 1) prøv chunks først (men giv ikke op, hvis -1.json ikke findes)
  try {
    const first = await tryJson('/data/recipes-1.json');
    __cache = first.slice();

    // hent resten i baggrunden hvis de findes
    for (let i = 2; i <= 20; i++){
      try {
        const arr = await tryJson(`/data/recipes-${i}.json`);
        if (!Array.isArray(arr) || !arr.length) break;
        __cache = __cache.concat(arr);
        progressCb?.(__cache.length);
        window.dispatchEvent(new CustomEvent('recipes:updated', { detail: { count: __cache.length }}));
      } catch {
        break; // stop når næste chunk ikke findes
      }
    }
    return __cache;
  } catch {
    // 2) fallback til fuld fil
    try {
      __cache = await tryJson('/data/recipes.json');
      progressCb?.(__cache.length);
      window.dispatchEvent(new CustomEvent('recipes:updated', { detail: { count: __cache.length }}));
      return __cache;
    } catch (e) {
      // 3) tydelig fejl i UI i stedet for “indlæser…”
      const t = document.getElementById('recipeTitle');
      if (t) t.textContent = 'Kunne ikke indlæse opskrifter (data mangler)';
      console.error('Recipe data could not be loaded:', e);
      throw e;
    }
  }
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

// Mount på sider der har #results eller #favoritesList
document.addEventListener('DOMContentLoaded', async () => {
  const results = document.getElementById('results');
  const favWrap = document.getElementById('favoritesList');
  const searchInput = document.getElementById('searchInput');
  if (!results && !favWrap) return;

  let data;
  try {
    data = await loadAllRecipes((len) => {
      if (searchInput) searchInput.placeholder = `Søg i ${len.toLocaleString('da-DK')} drikkeopskrifter...`;
    });
  } catch {
    // UI er allerede opdateret i loadAllRecipes ved fejl
    return;
  }
  window.__allRecipes = data;
  if (searchInput) searchInput.placeholder = `Søg i ${data.length.toLocaleString('da-DK')} drikkeopskrifter...`;

  if (results) {
    results.innerHTML = data.slice(0, 30).map(renderRecipeCard).join('');
    // kræv login for “gem”
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
