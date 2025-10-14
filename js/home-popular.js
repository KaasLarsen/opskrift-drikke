// === home-popular.js — håndplukkede favoritter på forsiden ===
import { loadAllRecipes, renderRecipeCard } from '/js/recipes.js';

const PICKS = [
  // Vælg 4 stærke varianter (slug skal matche dine data)
  'gloegg-klassisk-0001',       // Gløgg
  'iskaffe-espresso-milk-023',  // Kaffe
  'smoothie-jordbaer-banan-101',// Smoothie
  'gron-morgen-juice-077'       // Juice
];

async function mountPopular() {
  const slot = document.querySelector('#popularRecipes');
  if (!slot) return;

  const all = await loadAllRecipes();
  const bySlug = new Map(all.map(r => [r.slug, r]));

  const chosen = PICKS
    .map(s => bySlug.get(s))
    .filter(Boolean);

  if (!chosen.length) {
    // fallback: tag de bedst ratede 4
    chosen.push(...all
      .slice()
      .sort((a,b) => (b.rating||0) - (a.rating||0))
      .slice(0,4));
  }

  slot.innerHTML = chosen.map(renderRecipeCard).join('');
}

document.addEventListener('DOMContentLoaded', mountPopular);
