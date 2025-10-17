// /js/index.js – Forside logik (sæsonens favoritter)
import { loadAllRecipes, renderRecipeCard } from '/js/recipes.js';

const SEASON_TAGS = [
  'efterår', 'vinter', 'jul', 'gløgg', 'chai', 'krydret',
  'kanel', 'appelsin', 'varm kakao', 'varm', 'pumpkin', 'krydrede'
];

function scoreSeasonal(r){
  const hay = [
    ...(r.tags || []).map(t => String(t).toLowerCase()),
    String(r.title||'').toLowerCase(),
    String(r.subtitle||r.description||'').toLowerCase()
  ].join(' • ');

  let s = 0;
  for (const key of SEASON_TAGS){
    if (hay.includes(key)) s += 2;         // match på keyword
  }
  s += Math.min(3, Math.round(r.rating || 0)); // lille bonus for rating
  s += Math.min(2, Math.floor((r.votes || 0) / 300)); // bonus for mange stemmer
  return s;
}

document.addEventListener('DOMContentLoaded', async ()=>{
  const grid = document.getElementById('seasonalGrid');
  if (!grid) return;

  const all = await loadAllRecipes();

  // scor og pluk top 8
  const seasonal = all
    .map(r => ({ r, s: scoreSeasonal(r) }))
    .filter(x => x.s > 0)
    .sort((a,b)=>b.s - a.s)
    .slice(0, 8)
    .map(x => x.r);

  if (seasonal.length){
    grid.innerHTML = seasonal.map(renderRecipeCard).join('');
  } else {
    // fallback hvis intet matcher (viser populære som reserve)
    grid.innerHTML = all.slice(0,8).map(renderRecipeCard).join('');
  }
});
