// recipes.js — fælles datalag til hele sitet

let __all = null;

// Robust fetch der returnerer [] ved 404/fejl
async function fetchArray(url) {
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return [];
    const json = await r.json();
    // accepter både {items:[...]} og [...]
    return Array.isArray(json) ? json : (Array.isArray(json.items) ? json.items : []);
  } catch {
    return [];
  }
}

// Forsøg alle kendte fil-mønstre; vi ignorerer dem der ikke findes
const CANDIDATE_FILES = [
  '/data/recipes.json',
  '/data/recipes-1.json','/data/recipes-2.json','/data/recipes-3.json','/data/recipes-4.json','/data/recipes-5.json',
  '/data/opskrifter.json',
  '/data/opskrifter-1.json','/data/opskrifter-2.json','/data/opskrifter-3.json','/data/opskrifter-4.json','/data/opskrifter-5.json'
];

function normalizeRecipe(r) {
  const slug = r.slug || (r.id ? String(r.id) : (r.title||'').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,''));
  const title = r.title || r.name || 'Ukendt opskrift';
  const description = r.description || r.teaser || '';
  const tags = r.tags || r.keywords || r.categories || [];
  const rating = r.rating || r.stars || 0;
  const reviews = r.reviews || r.votes || 0;
  return { ...r, slug, title, description, tags, rating, reviews };
}

export async function loadAllRecipes() {
  if (__all) return __all;

  const batches = await Promise.all(CANDIDATE_FILES.map(fetchArray));
  // flad, normaliser og dedupliker på slug
  const flat = batches.flat().map(normalizeRecipe);
  const map = new Map();
  for (const r of flat) {
    if (!map.has(r.slug)) map.set(r.slug, r);
  }
  __all = Array.from(map.values());
  return __all;
}

// Lille hjælpe-normalizer til søgning (fjerner diakritik)
export function normalizeText(s){
  return (s||'')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu,''); // kræver moderne browser, fallback gør ikke skade
}

// Pænt, kompakt kort (bruges på forsiden og “seneste”)
export function renderRecipeCard(r){
  const rating = Math.max(0, Math.min(5, Math.round(r.rating || 0)));
  const stars = '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(0, 5-rating);
  const tags = (r.tags||[]).slice(0,3).map(t=>`<span class="text-[11px] px-2 py-0.5 rounded-full border bg-orange-50 border-orange-200 text-orange-700">${t}</span>`).join(' ');
  return `
  <a href="/pages/opskrift?slug=${encodeURIComponent(r.slug)}" class="block border bg-white rounded-2xl p-4 hover:shadow transition">
    <div class="flex items-center gap-2 mb-2">${tags}</div>
    <h3 class="text-base font-semibold leading-snug">${r.title}</h3>
    <p class="text-sm text-stone-600 mt-1">${r.description || ''}</p>
    <div class="mt-2 text-sm"><span>${stars}</span><span class="text-stone-500 text-xs ml-1">(${r.reviews || 0})</span></div>
  </a>`;
}
