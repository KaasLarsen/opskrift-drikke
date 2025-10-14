// === recipes.js — fælles helpers til opskrifter (kort, data, stjerner, mm.) ===

// Intern cache (og global fallback til søg m.m.)
let _RECIPES = Array.isArray(window.RECIPES) ? window.RECIPES : [];

/** Sørg for at vi har data — loader /data/recipes.json hvis ikke til stede */
export async function loadAllRecipes() {
  if (_RECIPES.length) return _RECIPES;

  // Prøv global
  if (Array.isArray(window.RECIPES) && window.RECIPES.length) {
    _RECIPES = window.RECIPES;
    return _RECIPES;
  }

  // Fallback: hent JSON (kræver at du har /data/recipes.json)
  try {
    const res = await fetch('/data/recipes.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Kan ikke hente recipes.json');
    const json = await res.json();
    _RECIPES = Array.isArray(json) ? json : (json.recipes || []);
    window.RECIPES = _RECIPES; // gør den global (søgefelt m.m. bruger den)
  } catch (e) {
    console.error('loadAllRecipes fejl:', e);
    _RECIPES = [];
  }
  return _RECIPES;
}

/** Format rating som stjerner + tal */
export function renderStars(rating = 0, count = 0) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  const full = Math.floor(r);
  const half = r - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  const star = '<svg class="w-4 h-4 inline-block -mt-0.5"><use href="/assets/icons.svg#star"/></svg>';
  const starHalf = '<svg class="w-4 h-4 inline-block -mt-0.5"><use href="/assets/icons.svg#star-half"/></svg>';
  const starEmpty = '<svg class="w-4 h-4 inline-block -mt-0.5 opacity-30"><use href="/assets/icons.svg#star"/></svg>';

  return `
    <span class="inline-flex items-center gap-1">
      ${star.repeat(full)}${half ? starHalf : ''}${starEmpty.repeat(empty)}
      <span class="text-xs text-stone-500">(${count || 0})</span>
    </span>
  `;
}

/** Lille tag-pill */
function tagPill(t) {
  return `<span class="inline-flex text-[11px] px-2 py-0.5 rounded-full border border-orange-200 text-orange-700 bg-orange-50">${t}</span>`;
}

/** Pænt kort UDEN billede (kompakt) */
export function renderRecipeCard(recipe) {
  // Forventet struktur (robust mod manglende felter)
  const {
    slug = '',
    title = 'Opskrift',
    description = '',
    rating = 0,
    ratingsCount = 0,
    tags = [],
    category = ''
  } = recipe || {};

  const url = `/pages/opskrift.html?slug=${encodeURIComponent(slug)}`;
  const sub = description || (Array.isArray(tags) && tags.length ? tags.slice(0, 3).join(' • ') : '');

  return `
  <a href="${url}" class="card border bg-white hover:shadow transition block">
    <div class="p-4">
      <div class="flex items-center gap-2 flex-wrap">
        ${category ? tagPill(category) : ''}
        ${Array.isArray(tags) ? tags.slice(0,2).map(tagPill).join('') : ''}
      </div>
      <h3 class="text-lg font-semibold mt-2 leading-snug">${title}</h3>
      ${sub ? `<p class="text-sm text-stone-600 mt-1 line-clamp-2">${sub}</p>` : ''}
      <div class="mt-2">${renderStars(rating, ratingsCount)}</div>
    </div>
  </a>`;
}

/** Hjælper: render en liste af opskrifter ind i et grid-element */
export function renderIntoGrid(recipes, gridSelector = '#results') {
  const el = document.querySelector(gridSelector);
  if (!el) return;
  el.innerHTML = recipes.map(renderRecipeCard).join('');
}

/** Hjælper: find en opskrift pr. slug */
export function findBySlug(slug) {
  if (!_RECIPES.length && Array.isArray(window.RECIPES)) _RECIPES = window.RECIPES;
  return _RECIPES.find(r => r.slug === slug);
}
