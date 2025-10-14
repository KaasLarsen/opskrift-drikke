import { loadAllRecipes, renderRecipeCard, normalizeText } from '/js/recipes.js';

function matches(q, r) {
  const hay = normalizeText(`${r.title} ${r.description || ''} ${(r.tags||[]).join(' ')} ${(r.category||'')}`);
  return hay.includes(q);
}

async function mountSearch() {
  const input = document.getElementById('homeSearch');
  const results = document.getElementById('results');
  if (!input || !results) return;

  const all = await loadAllRecipes();

  function doSearch() {
    const q = normalizeText(input.value.trim());
    const list = q ? all.filter(r => matches(q, r)).slice(0, 60) : all.slice(0, 30);
    results.innerHTML = list.map(renderRecipeCard).join('');
  }

  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  input.addEventListener('search', doSearch);
  doSearch();
}
document.addEventListener('DOMContentLoaded', mountSearch);
