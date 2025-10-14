// === recipes.js — fælles data & kort-rendering ===

// Hvor dine JSON-filer ligger (tilpas hvis du bruger anden sti)
const DATA_FILES = [
  '/data/recipes.json',        // samlet fil (hvis findes)
  '/data/recipes-1.json',
  '/data/recipes-2.json',
  '/data/recipes-3.json',
  '/data/recipes-4.json',
  '/data/recipes-5.json'
];

let __CACHE = null;

async function fetchJson(url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch {
    return null;
  }
}

export async function loadAllRecipes() {
  if (__CACHE) return __CACHE;

  const batches = await Promise.all(DATA_FILES.map(fetchJson));
  const lists = batches.filter(Boolean);

  // Understøt både {recipes:[...]} og ren array.
  const merged = [];
  for (const part of lists) {
    const arr = Array.isArray(part) ? part : (Array.isArray(part.recipes) ? part.recipes : []);
    merged.push(...arr);
  }

  // Dedupliker på slug
  const bySlug = new Map();
  for (const r of merged) {
    if (!r || !r.slug) continue;
    bySlug.set(r.slug, r);
  }
  __CACHE = Array.from(bySlug.values());
  return __CACHE;
}

export function findBySlug(list, slug) {
  return list.find(r => String(r.slug) === String(slug));
}

function safeText(v, fallback = '') {
  if (v == null) return fallback;
  return String(v);
}

function formatStars(rating = 0) {
  const n = Math.max(0, Math.min(5, Math.round(Number(rating))));
  const full = '★'.repeat(n);
  const empty = '☆'.repeat(5 - n);
  return `${full}${empty}`;
}

function renderTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return '';
  return tags.slice(0, 3).map(t =>
    `<span class="inline-flex text-[11px] px-2 py-0.5 rounded-full border border-orange-200 text-orange-700 bg-orange-50">${safeText(t)}</span>`
  ).join(' ');
}

/** Kompakt kort (uden billeder) – samme stil som “Mest populære” */
export function renderRecipeCard(r) {
  const slug = encodeURIComponent(safeText(r.slug));
  const title = safeText(r.title, 'Uden titel');
  const desc = safeText(r.description || r.desc || '');
  const rating = Number(r.rating || 0);
  const votes = Number(r.votes || r.reviews || 0);
  const tags = Array.isArray(r.tags) ? r.tags : (r.tag ? [r.tag] : []);

  return `
  <a href="/pages/opskrift?slug=${slug}" class="block border bg-white rounded-2xl p-4 shadow-sm hover:shadow transition card">
    <div class="flex flex-wrap gap-1 mb-1">${renderTags(tags)}</div>
    <h3 class="text-base/5 font-semibold">${title}</h3>
    ${desc ? `<p class="text-sm text-stone-600 mt-1">${desc}</p>` : ``}
    <div class="mt-2 text-sm text-stone-800">
      ${formatStars(rating)} <span class="text-stone-500">(${votes})</span>
    </div>
  </a>`;
}

/** Hjælper til at fylde et grid med kort */
export function renderIntoGrid(list, selector = '#results') {
  const grid = document.querySelector(selector);
  if (!grid) return;
  grid.innerHTML = list.map(renderRecipeCard).join('');
}
