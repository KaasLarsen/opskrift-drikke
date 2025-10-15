// === guides.js — robust dataload + simple kort-render ===

let ALL_GUIDES_CACHE = null;

// Prøv flere placeringer (samme mønster som recipes)
const GUIDE_SOURCES = [
  '/data/guides.json',
  '/data/guides-1.json','/data/guides-2.json','/data/guides-3.json','/data/guides-4.json','/data/guides-5.json',
  '/guides.json',
  '/guides-1.json','/guides-2.json','/guides-3.json','/guides-4.json','/guides-5.json'
];

export async function loadAllGuides(){
  if (ALL_GUIDES_CACHE) return ALL_GUIDES_CACHE;

  const chunks = await Promise.all(GUIDE_SOURCES.map(async (url) => {
    try{
      const r = await fetch(url, { cache: 'no-cache' });
      if (!r.ok) throw new Error(`${url} ${r.status}`);
      const json = await r.json();
      if (!Array.isArray(json)) throw new Error(`${url} no array`);
      return json;
    }catch(e){
      console.debug('[guides] skip', url, e.message);
      return [];
    }
  }));

  // Dedupe på slug/id
  const seen = new Set();
  const all = [];
  for(const arr of chunks){
    for(const g of arr){
      const key = String(g.slug || g.id || g.key || '');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      all.push(g);
    }
  }
  ALL_GUIDES_CACHE = all;
  if (!ALL_GUIDES_CACHE.length){
    console.error('[guides] Ingen guides fundet. Tjek datafiler.');
  }
  return ALL_GUIDES_CACHE;
}

export function renderGuideCard(g){
  const slug  = g.slug || g.id || '';
  const title = g.title || 'Uden titel';
  const desc  = g.subtitle || g.description || '';
  const tags  = (g.tags || []).slice(0,3).map(t =>
    `<span class="inline-flex text-[11px] px-2 py-0.5 rounded-full border border-orange-200 text-orange-700 bg-orange-50">${t}</span>`
  ).join(' ');

  return `
    <a href="/pages/guide?slug=${encodeURIComponent(slug)}"
       class="card block border bg-white p-4 hover:shadow transition rounded-2xl">
      <div class="flex gap-2 flex-wrap mb-1">${tags}</div>
      <h3 class="text-lg font-semibold leading-snug">${title}</h3>
      ${desc ? `<p class="text-sm text-stone-600 mt-1">${desc}</p>` : ''}
    </a>
  `;
}

// Valgfri auto-mount hvis en oversigtsside har #guideResults
async function mountGuidesGrid(){
  const grid = document.getElementById('guideResults');
  if (!grid) return;
  try{
    const list = await loadAllGuides();
    grid.innerHTML = list.map(renderGuideCard).join('');
  }catch(e){
    console.error('[guides] kunne ikke rendere oversigt', e);
    grid.innerHTML = `<div class="card border bg-white rounded-2xl p-4">Noget gik galt ved indlæsning.</div>`;
  }
}
document.addEventListener('DOMContentLoaded', mountGuidesGrid);
