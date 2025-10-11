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

// synonymer for sikkerhed
function normTerm(t){
  const f = fold(t);
  if (f === 'gloegg' || f === 'glogg') return 'gloegg';
  if (f === 'gløgg') return 'gloegg';
  if (f === 'sunde' || f === 'shots') return f; // del af "sunde shots"
  return f;
}
function tokens(q){
  const base = fold(q).split(' ').filter(Boolean);
  return base.map(normTerm).filter(Boolean);
}

// kategori-match (inkl. synonymer)
function normCategory(c=''){
  const f = fold(c);
  if (f === 'gloegg' || f === 'glogg') return 'gloegg';
  if (f === 'sunde shots' || f === 'sunde-shot' || f === 'sundeshots') return 'sunde shots';
  return f;
}

function buildHaystack(r){
  const cat = normCategory(r.category || '');
  const parts = [
    r.title || '',
    cat,
    (r.tags||[]).join(' '),
    r.description || '',
    r.slug || ''
  ];
  let hs = fold(parts.join(' '));
  // tilføj gløgg-aliaser eksplicit
  if (cat === 'gloegg') hs += ' gløgg gloegg glogg';
  return hs;
}

function parseQuery(q){
  const out = { cat:null, text: q };
  // kategori:"sunde shots" eller kategori:gløgg
  const m1 = q.match(/kategori:\s*"([^"]+)"/i) || q.match(/category:\s*"([^"]+)"/i);
  const m2 = q.match(/kategori:\s*([^\s"]+)/i) || q.match(/category:\s*([^\s"]+)/i);
  if (m1) { out.cat = normCategory(m1[1]); out.text = q.replace(m1[0], '').trim(); }
  else if (m2) { out.cat = normCategory(m2[1]); out.text = q.replace(m2[0], '').trim(); }
  return out;
}

function score(r, qTokens){
  let s = 0;
  const title = fold(r.title||'');
  const cat   = normCategory(r.category||'');
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

async function initSearch(){
  const input   = document.getElementById('searchInput');
  const results = document.getElementById('results');
  const filters = document.getElementById('filters');
  if (!input || !results) return;

  const data = await loadAllRecipes((len)=>{
    input.placeholder = `Søg i ${len.toLocaleString('da-DK')} drikkeopskrifter...`;
  });

  // indeksér
  const idx = data.map(r => ({ r, hs: buildHaystack(r), cat: normCategory(r.category||'') }));

  // quick kategori-chips → direkte kategori-filter (ikke tekst)
  if (filters){
    const cats = ['gløgg','sunde shots','mocktail','kaffe','smoothie'];
    filters.innerHTML = cats.map(c =>
      `<button data-cat="${c}" class="px-3 py-1.5 border rounded-2xl hover:bg-stone-100">${c}</button>`
    ).join('');
    filters.addEventListener('click', (e)=>{
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      const c = b.getAttribute('data-cat');
      input.value = `kategori:"${c}"`;  // sæt operator i input for synlighed
      doSearch();
    });
  }

  // klik på tag-pill i kort
  results.addEventListener('click', (e)=>{
    const pill = e.target.closest('span');
    if (!pill) return;
    const cls = pill.getAttribute('class') || '';
    if (!/rounded-full/.test(cls)) return;
    const q = (pill.textContent || '').trim();
    if (!q) return;
    input.value = q;
    doSearch();
  });

  // initial render
  results.innerHTML = data.slice(0, 30).map(renderRecipeCard).join('');

  function doSearch(){
    const raw = (input.value || '').trim();
    const { cat, text } = parseQuery(raw);

    // start med kategori-filter hvis angivet
    let rows = idx;
    if (cat){
      rows = rows.filter(x => x.cat === normCategory(cat));
    }

    // fritekst ovenpå kategori
    const qTokens = tokens(text);
    if (qTokens.length){
      const out = [];
      for (const it of rows){
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
      : `<p class="p-4 bg-amber-50 border rounded-2xl">ingen resultater for “${raw}”.</p>`;
  }

  // debounce input
  input.addEventListener('input', ()=>{
    clearTimeout(window.__od_search_t);
    window.__od_search_t = setTimeout(doSearch, 120);
  });

  // gør tilgængelig en hurtig diagnose i konsollen
  window.__searchDiag = () => ({
    cats: Array.from(new Set(idx.map(x=>x.cat))).slice(0,20),
    sampleGloegg: idx.find(x=>x.cat==='gloegg')?.r?.title,
    countGloegg: idx.filter(x=>x.cat==='gloegg').length,
    countShots: idx.filter(x=>x.cat==='sunde shots').length
  });
}

document.addEventListener('DOMContentLoaded', initSearch);
