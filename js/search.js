// search.js – simpel søg + resultater i #results med recipeCard
import { loadAllRecipes, renderRecipeCard } from '/js/recipes.js';

function normalize(s){ return (s||'').toLowerCase(); }

function matches(q, r) {
  const hay = normalize(`${r.title} ${r.description || ''} ${(r.tags||[]).join(' ')}`);
  return hay.includes(q);
}

async function mountSearch() {
  const input = document.getElementById('homeSearch');
  const results = document.getElementById('results');
  if (!input || !results) return;

  const all = await loadAllRecipes();

  function doSearch() {
    const q = normalize(input.value.trim());
    const list = q ? all.filter(r => matches(q, r)).slice(0, 60) : all.slice(0, 30);
    results.innerHTML = list.map(renderRecipeCard).join('');
  }

  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  input.addEventListener('search', doSearch); // iOS "x"
  doSearch(); // initial visning (de første 30)
}

document.addEventListener('DOMContentLoaded', mountSearch);
