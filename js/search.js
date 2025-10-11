// /js/search.js
import { loadAllRecipes, renderRecipeCard } from './recipes.js';

function fold(s=''){
  return s
    .toLowerCase()
    .replace(/æ/g,'ae').replace(/ø/g,'oe').replace(/å/g,'aa')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\s\-]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

// udvid token-mængde med synonymer (gløgg <-> gloegg)
function tokenSynonyms(t){
  const out = new Set([t]);
  if (t === 'gløgg' || t === 'gloegg') { out.add('gløgg'); out.add('gloegg'); }
  return [...out];
}

function tokens(q){
  const base = fold(q).split(' ').filter(Boolean);
  const out = new Set();
  for (const t of base) for (const x of tokenSynonyms(t)) out.add(fold(x));
  return [...out];
}

// for-indeksér haystack pr. opskrift for fart
function buildHaystack(r){
  const parts = [
    r.title || '',
    r.category || '',
    (r.tags||[]).join(' '),
    r.description || '',
    r.slug || ''
  ];
  const hs = fold(parts.join(' '));
  // ekstra alias: hvis kategori er gløgg/gloegg, tilføj begge i haystack
  if (/gløgg/i.test(r.category || '') || /gloegg/i.test(r.category || '')){
    return hs + ' gloegg gloeg gloegg gløgg';
  }
  return hs;
}

function score(r, qTokens){
  let s = 0;
  const title = fold(r.title||'');
  const cat   = fold(r.category||'');
  const tags  = fold((r.tags||[]).join(' '));
  const desc  = fold(r.description||'');
  for (const t of qTokens){
    if (title.startsWith(t)) s += 12;
    else if (title.includes(t)) s += 8;
    if (cat.includes(t))  s += 5;
    if (tags.includes(t)) s += 3;
    if (desc.includes(t)) s += 1;
  }
  const m = (r.title||'').match(/#(\d+)/);
  if (m) s += parseInt(m[1],10)/10000; // nyeste lidt op
  return s;
}

async function initSearch(){
  const input   = document.getElementById('searchInput');
  const results = document.getElementById('results');
  const filters = document.getElementById('filters');
  if (!input || !results) return;

  const data = await loadAllRecipes((len)=>{
    input.placeholder = `Søg i ${len.toLocaleString('da-DK')} drikkeopskrifter...`;
  });

  // byg haystacks én gang
  const idx = data.map(r => ({ r, hs: buildHaystack(r) }));

  // små hurtig-filtre inkl. gløgg/sunde shots
  if (filters){
    const cats = ['gløgg','sunde shots','mocktail','kaffe','smoothie'];
    filters.innerHTML = cats.map(c =>
      `<button data-cat="${c}" class="px-3 py-1.5 border rounded-2xl hover:bg-stone-100">${c}</button>`
    ).join('');
    filters.addEventListener('click', (e)=>{
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      input.value = b.getAttribute('data-cat');
      doSearch();
    });
  }

  // gør tags i kort klikbare som søgning (event delegation)
  results.addEventListener('click', (e)=>{
    const tag = e.target.closest('span');
    if (!tag) return;
    // kun hvis det ligner et tag-pill (har border + rounded)
    const cls = tag.getAttribute('class') || '';
    if (!/rounded-full/.test(cls)) return;
    const q = (tag.textContent || '').trim();
    if (!q) return;
    input.value = q;
    doSearch();
  });

  // initial render
  results.innerHTML = data.slice(0, 30).map(renderRecipeCard).join('');

  function doSearch(){
    const q = (input.value || '').trim();
    if (!q){
      results.innerHTML = data.slice(0, 30).map(renderRecipeCard).join('');
      return;
    }
    const qTokens = tokens(q);
    const out = [];
    for (const {r, hs} of idx){
      // AND-match: alle tokens skal være til stede
      let ok = true;
      for (const t of qTokens){ if (!hs.includes(t)) { ok = false; break; } }
      if (!ok) continue;
      out.push([score(r, qTokens), r]);
    }
    out.sort((a,b)=> b[0]-a[0]);
    const top = out.slice(0, 150).map(x=>x[1]);
    results.innerHTML = top.length
      ? top.map(renderRecipeCard).join('')
      : `<p class="p-4 bg-amber-50 border rounded-2xl">ingen resultater for “${q}”.</p>`;
  }

  // lille debounce på input
  input.addEventListener('input', ()=>{
    clearTimeout(window.__od_search_t);
    window.__od_search_t = setTimeout(doSearch, 120);
  });
}

document.addEventListener('DOMContentLoaded', initSearch);
