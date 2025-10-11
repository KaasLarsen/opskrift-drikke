
// /js/guides.js
import { showToast } from './app.js';

const DATA_VERSION = 'g500';
let __gCache = null;
const v = p => `${p}?${DATA_VERSION}`;

async function fetchJson(path) {
  const res = await fetch(v(path), { cache: 'no-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${path}`);
  return res.json();
}

export async function loadAllGuides(progressCb){
  if (__gCache) return __gCache;
  try {
    const first = await fetchJson('/data/guides-1.json');
    __gCache = Array.isArray(first) ? first.slice() : [];
    for (let i=2;i<=20;i++){
      try {
        const arr = await fetchJson(`/data/guides-${i}.json`);
        if (!Array.isArray(arr) || !arr.length) break;
        __gCache = __gCache.concat(arr);
        progressCb?.(__gCache.length);
        window.dispatchEvent(new CustomEvent('guides:updated', { detail:{ count: __gCache.length }}));
      } catch { break; }
    }
    if (__gCache.length) return __gCache;
  } catch {}
  __gCache = await fetchJson('/data/guides.json');
  progressCb?.(__gCache.length);
  window.dispatchEvent(new CustomEvent('guides:updated', { detail:{ count: __gCache.length }}));
  return __gCache;
}

export function renderGuideCard(g){
  return `<a href="/pages/guide.html?slug=${g.slug}" class="block card bg-white p-4 hover:shadow-md transition">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-lg font-medium">${g.title}</h3>
        <p class="text-sm opacity-70 mt-1">${g.category}</p>
      </div>
      <span class="text-sm opacity-70">${g.rating.toFixed(1)} ★</span>
    </div>
    <p class="text-sm mt-2 line-clamp-2">${g.intro}</p>
    <div class="mt-3 flex gap-2 flex-wrap text-xs opacity-80">
      ${(g.tags||[]).map(t=>`<span class="px-2 py-1 rounded-full border">${t}</span>`).join('')}
    </div>
  </a>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('guideList');
  if (!list) return;
  try {
    const all = await loadAllGuides();
    list.innerHTML = all.slice(0, 60).map(renderGuideCard).join('');
  } catch (e){
    list.innerHTML = '<p class="p-4 bg-rose-50 border rounded-2xl">Kunne ikke indlæse guides.</p>';
  }
});
