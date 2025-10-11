// /js/hero.js
import { loadAllRecipes } from './recipes.js';

function pickRandom(list){ return list[Math.floor(Math.random()*list.length)]; }

function setCountPlaceholder(count){
  const inp = document.getElementById('searchInput');
  if (!inp) return;
  // Vis korrekt antal i dansk formatering
  inp.placeholder = `Søg i ${count.toLocaleString('da-DK')} drikkeopskrifter...`;
}

async function initHero(){
  const btn = document.getElementById('dailyBtn');
  let data = window.__allRecipes;

  if (!Array.isArray(data) || !data.length){
    try { data = await loadAllRecipes(setCountPlaceholder); }
    catch { /* behold neutral placeholder */ return; }
  }
  setCountPlaceholder(data.length);

  // Opdater link til “Dagens drik”
  if (btn && data.length){
    const r = pickRandom(data);
    if (r) btn.href = `/pages/opskrift.html?slug=${r.slug}`;
  }

  // Hvis der kommer flere chunks ind løbende
  window.addEventListener('recipes:updated', (e)=>{
    const n = e.detail?.count || window.__allRecipes?.length || 0;
    if (n) setCountPlaceholder(n);
  });
}

document.addEventListener('DOMContentLoaded', initHero);
