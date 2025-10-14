// home-popular.js
import { renderRecipeCard } from '/js/recipes.js';

// Hårdt udvalgte slugs (dem du viste i UI)
const POPULAR = [
  'gloegg-klassisk-0001',
  'iskaffe-espresso-milk-023',
  'smoothie-jordbaer-banan-101',
  'gron-morgen-juice-077',
];

async function mountPopular() {
  const slot = document.getElementById('popularRecipes');
  if (!slot) return;

  const res = await fetch('/data/recipes.json').then(r=>r.json());
  const map = new Map(res.map(r => [r.slug, r]));
  const items = POPULAR.map(s => map.get(s)).filter(Boolean);
  slot.innerHTML = items.map(renderRecipeCard).join('');
}
document.addEventListener('DOMContentLoaded', mountPopular);
