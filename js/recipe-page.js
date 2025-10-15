// === recipe-page.js — enkel render af en opskrift + favorit ===
import { loadAllRecipes, isFav, toggleFav, renderRecipeCard, bindFavoriteClicks } from '/js/recipes.js';

function q(sel){ return document.querySelector(sel); }

function heartButton(id){
  const active = isFav(id);
  return `
    <button id="detailFavBtn" class="fav-btn ${active ? 'is-fav':''}" aria-label="Gem som favorit" data-fav="${id}">
      <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.35-9.5-8.35C1 9.5 2.9 6.5 6 6.5c1.9 0 3.1 1 4 2 0.9-1 2.1-2 4-2 3.1 0 5 3 3.5 6.15C19.5 16.65 12 21 12 21z"/></svg>
    </button>`;
}

async function mountRecipePage(){
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  const header = q('#recipeHeader');
  const ing = q('#recipeIngredients');
  const steps = q('#recipeSteps');
  const relatedSlot = q('#related');

  const list = await loadAllRecipes();
  const rec  = list.find(r => (r.slug||r.id) === slug);
  if(!rec){ document.title = 'Ikke fundet'; return; }

  // Header
  header.innerHTML = `
    <div class="relative">
      <h1 class="text-3xl font-semibold pr-14">${rec.title || 'Opskrift'}</h1>
      ${heartButton(rec.id || rec.slug)}
    </div>
    <p class="mt-2 text-stone-600">${rec.subtitle || rec.description || ''}</p>
  `;

  // Ingredienser/steps
  ing.innerHTML = (rec.ingredients || []).map(i => `<li>${i}</li>`).join('');
  steps.innerHTML = (rec.steps || []).map(s => `<li>${s}</li>`).join('');

  // Relaterede (samme 3 tags matcher)
  const key = (rec.tags || [])[0];
  const rel = list.filter(r => r !== rec && (r.tags||[]).includes(key)).slice(0,4);
  relatedSlot.innerHTML = rel.map(renderRecipeCard).join('');

  // hjertet
  bindFavoriteClicks(document);
}

document.addEventListener('DOMContentLoaded', mountRecipePage);
