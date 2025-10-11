// /js/hero.js
import { loadAllRecipes } from './recipes.js';

function pickRandom(list){
  return list[Math.floor(Math.random() * list.length)];
}

async function initHero(){
  const btn = document.getElementById('dailyBtn');
  if (!btn) return;

  let data = window.__allRecipes;
  if (!Array.isArray(data) || !data.length){
    try { data = await loadAllRecipes(); }
    catch { return; }
  }

  const setLink = () => {
    const r = pickRandom(data);
    if (r) btn.setAttribute('href', `/pages/opskrift.html?slug=${r.slug}`);
  };
  setLink();

  // opdater når flere chunks loader
  window.addEventListener('recipes:updated', setLink);
}

document.addEventListener('DOMContentLoaded', initHero);
