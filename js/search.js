// /js/search.js
import { loadAllRecipes, renderRecipeCard } from './recipes.js';

// --- utils ---
function fold(s=''){
  return s
    .toLowerCase()
    .replace(/æ/g,'ae').replace(/ø/g,'oe').replace(/å/g,'aa')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\s\-]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function titleCase(s=''){
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function tokens(q){ return fold(q).split(' ').filter(Boolean); }

// --- search state ---
let DATA = [];
let INDEX = []; // [{r, hs, fcat}]
let activeCat = null; // folded category filter (e.g. 'gloegg', 'sunde shots')

// build a normalized haystack per recipe
function buildHaystack(r){
  const parts = [
    r.title || '',
    r.category || '',
    (r.tags||[]).join(' '),
    r.description || '',
    r.slug || ''
  ];
  return fold(parts.join(' '));
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
    if (cat.includes(t))  s += 6;
    if (tags.includes(t)) s += 3;
    if (desc.includes(t)) s += 1;
  }
  const m = (r.title||'').match(/#(\d+)/);
  if (m) s += parseInt(m[1],10)/10000;
  return s;
}

function applySearch(q){
  const results = document.getElementById('results');
  const qTokens = tokens(q);

  // start med kategori-filter
  let rows = INDEX;
  if (activeCat){
    rows = rows.filter(x => x.fcat === activeCat);
  }

  if (qTokens.length){
    const out = [];
    for (const it of rows){
      // AND-match: alle tokens i haystack
      let ok = true;
      for (const t of qTokens){ if (!it.hs.includes(t)) { ok = false; break; } }
      if (!ok) continue;
      out.push([score(it.r, qTokens), it.r]);
    }
    out.sort((a,b)=> b[0]-a[0]);
    rows = out.map(x=>x[1]);
  } else {
    rows = rows.map(x=>x.r);
  }

  const top = rows.slice(0, 150);
  results.innerHTML = top.length
    ? top.map(renderRecipeCard).join('')
    : `<p class="p-4 bg-amber-50 border rounded-2xl">ingen resultater for “${q ? q : (activeCat ? `kategori: “${activeCat}”` : '')}”.</p>`;
}

function renderChips(){
  const filters = document.getElementById('filters');
  if (!filters) return;
  const cats = ['Gløgg','Sunde shots','Mocktail','Kaffe','Smoothie']; // vis-labels med stort
  filters.innerHTML = cats.map(lbl => {
    const fval = fold(lbl); // 'gløgg' -> 'gloegg', 'Sunde shots' -> 'sunde shots'
    const active = activeCat === fval ? 'ring-2 ring-blue-500 bg-white' : 'hover:bg-stone-100';
    return `<button data-cat="${fval}" class="px-3 py-1.5 border rounded-2xl ${active}">${lbl}</button>`;
  }).join('');
}

async function initSearch(){
  const input   = document.getElementById('searchInput');
  const results = document.getElementById('results');
  const filters = document.getElementById('filters');
  if (!input || !results) return;

  // load all recipes (supports 1..5 chunk-filer eller recipes.json)
  DATA = await loadAllRecipes((len)=>{
    input.placeholder = `Søg i ${len.toLocaleString('da-DK')} drikkeopskrifter...`;
  });

  // indeksér
  INDEX = DATA.map(r => ({ r, hs: buildHaystack(r), fcat: fold(r.category||'') }));

  // render chips og bind click
  renderChips();
  if (filters){
    filters.addEventListener('click', (e)=>{
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      const v = b.getAttribute('data-cat'); // folded kategori
      activeCat = (activeCat === v) ? null : v; // toggle
      renderChips();
      applySearch(input.value);
    });
  }

  // gør tags på kort klikbare (delegation)
  results.addEventListener('click', (e)=>{
    const pill = e.target.closest('span');
    if (!pill) return;
    const cls = pill.getAttribute('class') || '';
    if (!/rounded-full/.test(cls)) return; // kun tag-pills
    const text = (pill.textContent || '').trim();
    if (!text) return;
    input.value = text;
    applySearch(input.value);
  });

  // initial render
  results.innerHTML = DATA.slice(0, 30).map(renderRecipeCard).join('');

  // søg ved input (debounce)
  input.addEventListener('input', ()=>{
    clearTimeout(window.__od_search_t);
    window.__od_search_t = setTimeout(()=>applySearch(input.value), 120);
  });
}

document.addEventListener('DOMContentLoaded', initSearch);
