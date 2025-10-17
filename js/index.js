// /js/index.js – Forside logik (sæsonens udvalgte)
import { loadAllRecipes, renderRecipeCard } from '/js/recipes.js';

document.addEventListener('DOMContentLoaded', async ()=>{
  const all = await loadAllRecipes();

  // Filtrer på tags som matcher årstiden
  const seasonal = all.filter(r =>
    r.tags?.includes('efterår') ||
    r.tags?.includes('jul') ||
    r.tags?.includes('varm kakao') ||
    r.tags?.includes('sirup') ||
    r.tags?.includes('krydret')
  ).slice(0, 4);

  const grid = document.getElementById('seasonalGrid');
  if (grid && seasonal.length) {
    grid.innerHTML = seasonal.map(renderRecipeCard).join('');
  }
});
