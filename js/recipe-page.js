// === recipe-page.js — detailvisning af opskrift ===
import { loadAllRecipes, findBySlug } from '/js/recipes.js';

function $(s, r = document) { return r.querySelector(s); }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

async function mountRecipe() {
  const slot = document.getElementById('recipeContent') || document.getElementById('recipe');
  if (!slot) return;

  const url = new URL(location.href);
  const slug = url.searchParams.get('slug');
  if (!slug) { slot.innerHTML = '<p>Ingen slug angivet.</p>'; return; }

  const list = await loadAllRecipes();
  const r = findBySlug(list, slug);

  if (!r) {
    slot.innerHTML = `<p>Kunne ikke finde opskrift: <code>${esc(slug)}</code></p>`;
    return;
  }

  const tags = Array.isArray(r.tags) ? r.tags.map(t => `<span class="px-2 py-0.5 rounded-full border mr-1">${esc(t)}</span>`).join(' ') : '';
  const rating = Number(r.rating || 0);
  const votes = Number(r.votes || r.reviews || 0);

  slot.innerHTML = `
    <article class="prose prose-stone max-w-none">
      <h1 class="!mb-2">${esc(r.title || 'Uden titel')}</h1>
      ${r.description ? `<p class="text-stone-600 !mt-0">${esc(r.description)}</p>` : ''}
      <div class="mt-2 text-sm">${'★'.repeat(Math.round(rating))}${'☆'.repeat(5-Math.round(rating))} <span class="text-stone-500">(${votes})</span></div>
      ${tags ? `<div class="mt-2">${tags}</div>` : ''}
      ${Array.isArray(r.ingredients) ? `
        <h2>Ingredienser</h2>
        <ul>${r.ingredients.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
      ${Array.isArray(r.steps) ? `
        <h2>Sådan gør du</h2>
        <ol>${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
    </article>
  `;
}

document.addEventListener('DOMContentLoaded', mountRecipe);
