// recipe-page.js – selvkørende, ingen eksterne auth/pricerunner imports krævet
import { loadAllRecipes } from '/js/recipes.js';

function $(sel){ return document.querySelector(sel); }

function renderRecipe(r) {
  const el = $('#recipe');
  if (!el) return;
  el.innerHTML = `
    <article class="prose prose-stone max-w-none">
      <h1 class="mb-1">${r.title}</h1>
      <div class="text-sm text-stone-600 mb-4">${(r.tags||[]).map(t=>`<span class="px-2 py-0.5 border rounded-full mr-1">#${t}</span>`).join('')}</div>
      <p>${r.description || ''}</p>
      ${r.ingredients ? `<h2>Ingredienser</h2><ul>${r.ingredients.map(i=>`<li>${i}</li>`).join('')}</ul>`:''}
      ${r.steps ? `<h2>Sådan gør du</h2><ol>${r.steps.map(s=>`<li>${s}</li>`).join('')}</ol>`:''}
    </article>
  `;
}

async function mountRecipePage() {
  const url = new URL(location.href);
  const slug = url.searchParams.get('slug');
  if (!slug) return;

  const all = await loadAllRecipes();
  const r = all.find(x => x.slug === slug);
  if (!r) {
    $('#recipe')?.replaceChildren(document.createTextNode('Opskrift ikke fundet.'));
    return;
  }
  renderRecipe(r);
}

document.addEventListener('DOMContentLoaded', mountRecipePage);
