// /js/guides.js
// Loader alle guides (chunked), viser søg + kategori-tags og filtrerer live.

const DATA_VERSION = 'g-v0500'; // bump hvis du uploader nye /data/guides-*.json
let __guides = null;
const urlV = (p) => `${p}?${DATA_VERSION}`;

async function fetchJson(path){
  const r = await fetch(urlV(path), {cache:'no-cache'});
  if (!r.ok) throw new Error(`HTTP ${r.status} @ ${path}`);
  return r.json();
}

function dedupeBySlug(arr){
  const m = new Map();
  for (const g of arr||[]) if (g?.slug && !m.has(g.slug)) m.set(g.slug, g);
  return [...m.values()];
}

async function loadAllGuides(progressCb){
  if (__guides) return __guides;
  let list = [];
  try{
    const first = await fetchJson('/data/guides-1.json');
    if (Array.isArray(first) && first.length){
      list = list.concat(first);
      progressCb?.(list.length);
      // hent videre
      for (let i=2;i<=20;i++){
        try{
          const chunk = await fetchJson(`/data/guides-${i}.json`);
          if (!Array.isArray(chunk) || !chunk.length) break;
          list = list.concat(chunk);
          progressCb?.(list.length);
        }catch{ break; }
      }
    } else {
      // fallback samlet fil
      list = await fetchJson('/data/guides.json');
    }
  }catch{
    list = await fetchJson('/data/guides.json');
  }
  __guides = dedupeBySlug(list);
  progressCb?.(__guides.length);
  return __guides;
}

// ---------- UI helpers ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function titleCaseFirst(s=''){ return s.charAt(0).toUpperCase() + s.slice(1); }

function renderGuideCard(g){
  const cat = g.category || (Array.isArray(g.tags) ? g.tags[0] : 'Guide');
  const excerpt = g.excerpt || g.summary || g.description || 'Kort guide til emnet.';
  return `
  <a class="block card bg-white p-4 hover:shadow-md transition" href="/pages/guide?slug=${g.slug}">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-lg font-medium">${g.title}</h3>
        <p class="text-sm opacity-70 mt-1">${cat}</p>
      </div>
    </div>
    <p class="text-sm mt-3 line-clamp-3">${excerpt}</p>
    ${
      Array.isArray(g.tags) && g.tags.length
        ? `<div class="mt-3 flex gap-2 flex-wrap text-xs opacity-80">
             ${g.tags.slice(0,5).map(t=>`<span class="px-2 py-1 pill border">${t}</span>`).join('')}
           </div>`
        : ''
    }
  </a>`;
}

function fold(s=''){
  return s.toLowerCase()
    .replace(/æ/g,'ae').replace(/ø/g,'oe').replace(/å/g,'aa')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\s+/g,' ').trim();
}

function countByCategory(list){
  const m = new Map();
  for (const g of list){
    const c = (g.category || (Array.isArray(g.tags)?g.tags[0]:'Andet')) + '';
    const key = fold(c);
    const nice = titleCaseFirst(c);
    const item = m.get(key) || {key, label: nice, count:0};
    item.count++; m.set(key,item);
  }
  return [...m.values()].sort((a,b)=>b.count-a.count);
}

function buildFilterPills(cats, active){
  const wrap = $('#guideFilters');
  wrap.innerHTML = '';
  // “alle”-pill først
  const all = document.createElement('button');
  all.className = `px-3 py-1.5 pill border ${!active?'bg-stone-900 text-white border-stone-900':'bg-white'}`;
  all.textContent = 'Alle';
  all.dataset.cat = '';
  wrap.appendChild(all);
  cats.slice(0,12).forEach(c=>{
    const btn = document.createElement('button');
    btn.className = `px-3 py-1.5 pill border ${active===c.key?'bg-stone-900 text-white border-stone-900':'bg-white'}`;
    btn.textContent = `${c.label} (${c.count})`;
    btn.dataset.cat = c.key;
    wrap.appendChild(btn);
  });
}

function applyFilters(list, q, catKey){
  const qf = fold(q||'');
  const filtered = list.filter(g=>{
    const inCat = !catKey || fold(g.category || (g.tags?.[0] || '')) === catKey;
    if (!inCat) return false;
    if (!qf) return true;
    // tekst-match på title + excerpt + tags
    const hay = [
      g.title, g.excerpt, g.summary, g.description,
      g.category, ...(g.tags||[])
    ].filter(Boolean).join(' ').toString();
    return fold(hay).includes(qf);
  });
  return filtered;
}

function render(list, total, activeCat, q){
  $('#guideStatus').textContent =
    `${list.length} af ${total} guides` +
    (activeCat ? ` · kategori: ${activeCat}` : '') +
    (q ? ` · søgning: “${q}”` : '');

  $('#guideList').innerHTML = list.length
    ? list.map(renderGuideCard).join('')
    : `<div class="p-4 bg-rose-50 border rounded-2xl">Ingen guides matchede dine filtre.</div>`;
}

// debounce helper
function debounce(fn, ms=150){
  let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); };
}

// ---------- Mount ----------
document.addEventListener('DOMContentLoaded', async ()=>{
  const search = $('#guideSearch');
  const listEl = $('#guideList');
  if (!listEl) return;

  let data = [];
  try{
    data = await loadAllGuides((n)=>{ if (search && !search.dataset.fixedPlaceholder) search.placeholder = `Søg i ${n.toLocaleString('da-DK')} guides...`; });
  }catch(e){
    $('#guideStatus').textContent = 'Kunne ikke indlæse guides.';
    return;
  }
  const total = data.length;
  if (search) search.placeholder = `Søg i ${total.toLocaleString('da-DK')} guides...`;

  // kategorier
  const cats = countByCategory(data);
  let activeCat = '';
  buildFilterPills(cats, activeCat);

  // initial render
  render(data.slice(0, 30), total, '', '');

  // events
  $('#guideFilters').addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-cat]');
    if (!btn) return;
    activeCat = btn.dataset.cat || '';
    buildFilterPills(cats, activeCat);
    const q = search?.value || '';
    const out = applyFilters(data, q, activeCat);
    render(out, total, activeCat ? cats.find(c=>c.key===activeCat)?.label : '', q);
  });

  const onSearch = debounce(()=>{
    const q = search?.value || '';
    const out = applyFilters(data, q, activeCat);
    render(out, total, activeCat ? cats.find(c=>c.key===activeCat)?.label : '', q);
  }, 120);
  search?.addEventListener('input', onSearch);
});
