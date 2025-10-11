// /js/search.js
import { loadAllRecipes, renderRecipeCard } from './recipes.js';

// utils
const fold = (s='') => s.toLowerCase()
  .replace(/æ/g,'ae').replace(/ø/g,'oe').replace(/å/g,'aa')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9\s\-]/g,' ')
  .replace(/\s+/g,' ')
  .trim();

const titleCase = (s='') => s ? s[0].toUpperCase() + s.slice(1) : s;
const tokens = q => fold(q).split(' ').filter(Boolean);

// state
let DATA=[], INDEX=[], activeCat=null; // activeCat er foldet værdi: 'gloegg', 'sunde shots', ...

const normCat = c => {
  const f = fold(c||'');
  if (f === 'gloegg' || f === 'glogg' || f === 'gloeg') return 'gloegg';
  if (f === 'sunde-shots' || f === 'sundeshots') return 'sunde shots';
  return f;
};

const buildHay = r => fold([
  r.title||'', r.category||'', (r.tags||[]).join(' '), r.description||'', r.slug||''
].join(' '));

const score = (r, qTokens) => {
  let s=0, title=fold(r.title||''), cat=fold(r.category||''), tags=fold((r.tags||[]).join(' ')), desc=fold(r.description||'');
  for (const t of qTokens){
    if (title.startsWith(t)) s+=12; else if (title.includes(t)) s+=8;
    if (cat.includes(t)) s+=6; if (tags.includes(t)) s+=3; if (desc.includes(t)) s+=1;
  }
  const m=(r.title||'').match(/#(\d+)/); if (m) s+=parseInt(m[1],10)/10000;
  return s;
};

function renderChips(counts){
  const el = document.getElementById('filters'); if (!el) return;
  const labels = ['Gløgg','Sunde shots','Mocktail','Kaffe','Smoothie'];
  el.innerHTML = labels.map(lbl=>{
    const f = normCat(lbl);
    const active = activeCat===f ? 'ring-2 ring-blue-500 bg-white' : 'hover:bg-stone-100';
    const disabled = (counts && counts[f]===0) ? 'opacity-50 pointer-events-none' : '';
    return `<button data-cat="${f}" class="px-3 py-1.5 border rounded-2xl ${active} ${disabled}">${lbl}</button>`;
  }).join('');
}

function applySearch(q){
  const results = document.getElementById('results');
  const qTokens = tokens(q);
  let rows = INDEX;

  if (activeCat) rows = rows.filter(x => x.fcat === activeCat);

  if (qTokens.length){
    const out=[];
    for (const it of rows){
      let ok=true; for (const t of qTokens){ if (!it.hs.includes(t)){ ok=false; break; } }
      if (!ok) continue;
      out.push([score(it.r,qTokens), it.r]);
    }
    out.sort((a,b)=>b[0]-a[0]);
    rows = out.map(x=>x[1]);
  } else {
    rows = rows.map(x=>x.r);
  }

  results.innerHTML = rows.length
    ? rows.slice(0,150).map(renderRecipeCard).join('')
    : `<p class="p-4 bg-amber-50 border rounded-2xl">ingen resultater for “${q || (activeCat ? titleCase(activeCat) : '')}”.</p>`;
}

async function initSearch(){
  const input = document.getElementById('searchInput');
  const results = document.getElementById('results');
  const filters = document.getElementById('filters');
  if (!input || !results) return;

  // indlæs ALLE opskrifter (understøtter 1..20 chunks)
  DATA = await loadAllRecipes(len=>{
    input.placeholder = `Søg i ${len.toLocaleString('da-DK')} drikkeopskrifter...`;
  });

  INDEX = DATA.map(r => ({ r, hs: buildHay(r), fcat: normCat(r.category||'') }));

  // diagnoser (hjælper os at se om data rent faktisk indeholder kategorierne)
  const counts = INDEX.reduce((acc,x)=>{ acc[x.fcat]=(acc[x.fcat]||0)+1; return acc; },{});
  window.__diagSearch = { counts, sampleGloegg: INDEX.find(x=>x.fcat==='gloegg')?.r?.title };

  // render kategori-chips (deaktiver hvis der ingen matches er)
  renderChips(counts);

  // klik på chips: ægte kategori-filter (ikke tekst i input)
  filters?.addEventListener('click', e=>{
    const b = e.target.closest('[data-cat]'); if (!b) return;
    const v = b.getAttribute('data-cat'); activeCat = (activeCat===v)? null : v;
    renderChips(counts); applySearch(input.value);
  });

  // klik på tag-pills i kort → læg teksten i søgefeltet
  results.addEventListener('click', e=>{
    const pill = e.target.closest('span'); if (!pill) return;
    const cls = pill.getAttribute('class')||''; if (!/rounded-full/.test(cls)) return;
    input.value = (pill.textContent||'').trim(); applySearch(input.value);
  });

  // initial render
  results.innerHTML = DATA.slice(0,30).map(renderRecipeCard).join('');

  // søg ved input
  input.addEventListener('input', ()=>{
    clearTimeout(window.__od_search_t);
    window.__od_search_t = setTimeout(()=>applySearch(input.value), 120);
  });
}

document.addEventListener('DOMContentLoaded', initSearch);
