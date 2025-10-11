// /js/search.js
import { loadAllRecipes, renderRecipeCard } from './recipes.js';

function fold(s=''){
  return s
    .toLowerCase()
    // dansk normalisering
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    // generel diakritik-fjernelse
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // ryd støj
    .replace(/[^a-z0-9\s\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(q){
  return fold(q).split(' ').filter(Boolean);
}

function haystackFor(r){
  const parts = [
    r.title || '',
    r.category || '',
    (r.tags||[]).join(' '),
    r.description || ''
  ];
  return fold(parts.join(' '));
}

function scoreRecipe(r, qTokens, hs){
  // simple scoring: titel > kategori > tags > description, plus “nyeste først”
  let s = 0;
  const title = fold(r.title || '');
  const cat   = fold(r.category || '');
  const tags  = fold((r.tags||[]).join(' '));
  const desc  = fold(r.description || '');

  for (const t of qTokens){
    if (title.startsWith(t)) s += 12;
    else if (title.includes(t)) s += 8;

    if (cat.includes(t))  s += 4;
    if (tags.includes(t)) s += 3;
    if (desc.includes(t)) s += 1;
  }

  // nyeste først via #0000 i titlen (hvis findes)
  const m = (r.title||'').match(/#(\d+)/);
  if (m) s += parseInt(m[1], 10) / 10000;

  return s;
}

async function initSearch(){
  const input   = document.getElementById('searchInput');
  const results = document.getElementById('results');
  const filters = document.getElementById('filters');
  if (!input || !results) return;

  const data = await loadAllRecipes((len)=>{
    if (input && !input.dataset.fixedPlaceholder){
      input.placeholder = `Søg i ${len.toLocaleString('da-DK')} drikkeopskrifter...`;
    }
  });

  // små hurtig-filtre (valgfrit): populære kategorier inkl. gløgg/sunde shots
  const catsWanted = ['gløgg','sunde shots','mocktail','kaffe','smoothie'];
  if (filters){
    filters.innerHTML = catsWanted.map(c =>
      `<button data-cat="${c}" class="px-3 py-1.5 border rounded-2xl hover:bg-stone-100">${c}</button>`
    ).join('');
    filters.addEventListener('click', (e)=>{
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      input.value = b.getAttribute('data-cat');
      doSearch();
    });
  }

  // initial render
  results.innerHTML = data.slice(0, 30).map(renderRecipeCard).join('');

  function doSearch(){
    const q = input.value.trim();
    if (q === ''){
      results.innerHTML = data.slice(0, 30).map(renderRecipeCard).join('');
      return;
    }
    const qTokens = tokens(q);
    // AND-match: alle tokens skal findes i haystack
    const out = [];
    for (const r of data){
      const hs = haystackFor(r);
      let ok = true;
      for (const t of qTokens){
        if (!hs.includes(t)){ ok = false; break; }
      }
      if (!ok) continue;
      out.push([scoreRecipe(r, qTokens, hs), r]);
    }
    out.sort((a,b)=> b[0]-a[0]);
    const top = out.slice(0, 120).map(x=>x[1]); // begræns render for fart
    results.innerHTML = top.length ? top.map(renderRecipeCard).join('') :
      `<p class="p-4 bg-amber-50 border rounded-2xl">ingen resultater for “${q}”.</p>`;
  }

  input.addEventListener('input', () => {
    // lille debounce
    clearTimeout(window.__od_search_t);
    window.__od_search_t = setTimeout(doSearch, 120);
  });
}

document.addEventListener('DOMContentLoaded', initSearch);
