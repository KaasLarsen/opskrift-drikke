// recipe-page.js — renderer opskrift, PR-annonce i MAIN og relaterede kort
import { loadAllRecipes, renderRecipeCard, formatTag } from '/js/recipes.js';

// Helper: get ?slug=
function getSlug() {
  const u = new URL(location.href);
  return (u.searchParams.get('slug') || '').trim();
}

// Render helpers
function renderBadges(rec) {
  const bits = [];
  if (rec.time) bits.push(`<span class="px-2 py-0.5 rounded-full border text-xs">${rec.time}</span>`);
  if (rec.difficulty) bits.push(`<span class="px-2 py-0.5 rounded-full border text-xs">${rec.difficulty}</span>`);
  if (Array.isArray(rec.tags)) {
    rec.tags.slice(0, 3).forEach(t => bits.push(`<a href="/pages/tag.html?tag=${encodeURIComponent(t)}" class="px-2 py-0.5 rounded-full border text-xs hover:bg-stone-50">${formatTag(t)}</a>`));
  }
  return bits.join('');
}

function renderIngredients(list) {
  if (!Array.isArray(list) || !list.length) return '<li class="text-stone-500">—</li>';
  return list.map(x => `<li>${x}</li>`).join('');
}

function renderSteps(list) {
  if (!Array.isArray(list) || !list.length) return '<li class="text-stone-500">—</li>';
  return list.map(x => `<li>${x}</li>`).join('');
}

function mountPriceRunner() {
  // læg annoncen i #pr-recipe-slot (i main)
  const slot = document.getElementById('pr-recipe-slot');
  if (!slot) return;
  import('/js/pricerunner-rotator.js')
    .then(m => m.mountPR('#pr-recipe-slot'))
    .catch(() => {});
}

function pickRelated(all, rec, n = 4) {
  const tagset = new Set(rec.tags || []);
  const pool = all.filter(r => r.slug !== rec.slug)
                  .map(r => ({ r, score: (r.tags||[]).filter(t => tagset.has(t)).length }))
                  .sort((a,b) => b.score - a.score || (a.r.title||'').localeCompare(b.r.title||''));
  return pool.slice(0, n).map(x => x.r);
}

async function mountRecipe() {
  const slug = getSlug();
  if (!slug) return;

  const all = await loadAllRecipes();
  const rec = all.find(r => (r.slug || '').toLowerCase() === slug.toLowerCase());
  if (!rec) {
    document.getElementById('recipeTitle').textContent = 'Opskrift ikke fundet';
    return;
  }

  // Titel + summary + meta
  document.getElementById('recipeTitle').textContent = rec.title || 'Opskrift';
  document.getElementById('recipeSummary').textContent = rec.description || '';
  document.getElementById('recipeMeta').innerHTML = renderBadges(rec);

  // Ingredienser & steps
  document.getElementById('ingredientsList').innerHTML = renderIngredients(rec.ingredients);
  document.getElementById('stepsList').innerHTML = renderSteps(rec.steps);

  // Noter (valgfrit)
  const notes = document.getElementById('notes');
  if (notes) notes.textContent = rec.notes || '—';

  // Relaterede
  const rel = pickRelated(all, rec, 4);
  document.getElementById('related').innerHTML = rel.map(renderRecipeCard).join('');

  // PR i main
  mountPriceRunner();

  // Scroll til top ved navigering mellem opskrifter
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', mountRecipe);
