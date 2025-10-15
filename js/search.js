// === search.js — accent-fri, synonym-søgning + forslag ===
import { loadAllRecipes } from '/js/recipes.js';

const INPUT_ID   = 'homeSearch';
const SUGGEST_ID = 'suggestions';

// Synonymer: "kaffe" rammer espresso/latte/iskaffe osv.
const SYNONYMS = {
  'kaffe': ['kaffe','espresso','latte','cappuccino','americano','macchiato','iskaffe','cold brew','frappé','mokka','mocha'],
  'juice': ['juice','saft'],
  'mocktail': ['mocktail','alkoholfri','virgin'],
  'gløgg': ['gløgg','glogg','mulled wine'],
};

function norm(s){
  return String(s||'').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\s+/g,' ').trim();
}
function expandQuery(q){
  const tokens = norm(q).split(' ').filter(Boolean);
  const set = new Set();
  for (const t of tokens){
    set.add(t);
    (SYNONYMS[t] || []).forEach(x => set.add(norm(x)));
  }
  return [...set];
}
function fieldText(rec){
  const title = norm(rec.title);
  const sub   = norm(rec.subtitle || rec.description || '');
  const tags  = norm((rec.tags || []).join(' '));
  return { title, sub, tags };
}
function score(rec, queries){
  const f = fieldText(rec);
  let s = 0;
  for (const q of queries){
    if (f.title.includes(q)) s += 5;
    if (f.tags.includes(q))  s += 3;
    if (f.sub.includes(q))   s += 1;
  }
  return s;
}
async function runSearch(q){
  const all = await loadAllRecipes();               // <- læser ALLE recipe-filer
  const qs  = expandQuery(q);
  if (!qs.length) return [];
  return all.map(r => ({ r, s: score(r, qs) }))
            .filter(x => x.s > 0)
            .sort((a,b) => b.s - a.s)
            .map(x => x.r);
}

function ensureSuggest(){
  let box = document.getElementById(SUGGEST_ID);
  if (!box){
    box = document.createElement('div');
    box.id = SUGGEST_ID;
    box.className = '';
    const host = document.querySelector('.hero-search-wrap, .max-w-xl') || document.body;
    host.appendChild(box);
  }
  return box;
}
function renderSuggestions(items){
  const box = document.getElementById(SUGGEST_ID);
  if (!box) return;
  if (!items.length){ box.classList.remove('active'); box.innerHTML=''; return; }
  box.classList.add('active');
  box.innerHTML = items.slice(0,8).map(r => `
    <div data-slug="${r.slug || r.id}">
      <strong>${r.title}</strong>
      ${r.subtitle ? `<span class="suggest-meta">${r.subtitle}</span>` : ''}
    </div>`).join('');
}

async function wireSearch(){
  const input = document.getElementById(INPUT_ID);
  if (!input) return;                 // ikke på denne side
  ensureSuggest();

  let seq = 0;
  input.addEventListener('input', async (e) => {
    const val = e.target.value;
    const my = ++seq;
    if (!val.trim()){ renderSuggestions([]); return; }
    const hits = await runSearch(val);
    if (my !== seq) return;
    renderSuggestions(hits);
  });

  document.getElementById(SUGGEST_ID)?.addEventListener('click', (e) => {
    const el = e.target.closest('[data-slug]'); if(!el) return;
    const slug = el.getAttribute('data-slug');
    location.href = `/pages/opskrift?slug=${encodeURIComponent(slug)}`;
  });

  input.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const hits = await runSearch(input.value);
    if (hits[0]){
      location.href = `/pages/opskrift?slug=${encodeURIComponent(hits[0].slug || hits[0].id)}`;
    } else {
      location.href = `/pages/seneste.html?query=${encodeURIComponent(input.value)}`;
    }
  });
}
document.addEventListener('DOMContentLoaded', wireSearch);
// --- pagination defaults ---
const PAGE_SIZE = 30;

function normalize(s){
  return (s||'')
    .toString()
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, ''); // æøå håndteres bedre
}

// Score: simple AND-match pr. ord i title/subtitle/tags/ingredients
function matches(rec, terms){
  const bag = normalize([
    rec.title, rec.subtitle, (rec.tags||[]).join(' '),
    (rec.ingredients||[]).join(' '), (rec.notes||'')
  ].join(' • '));
  return terms.every(t => bag.includes(t));
}

async function runSearch(query){
  const list = (await loadAllRecipes()) || [];
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  // Ingen cap her – vi filtrerer alt og paginerer i render
  const out = list.filter(r => matches(r, terms));
  console.log('[search] matches:', out.length); // debug
  return out;
}

function renderPager(total, page){
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return '';
  const btn = (p, label = p, active = false) =>
    `<button data-page="${p}" class="px-3 py-1.5 rounded-lg border ${active ? 'bg-orange-500 text-white border-orange-500' : 'bg-white hover:bg-stone-50'}">${label}</button>`;
  const parts = [];
  if (page > 1){ parts.push(btn(1,'«')); parts.push(btn(page-1,'‹')); }
  const start = Math.max(1, page-2), end = Math.min(pages, page+2);
  for (let p=start; p<=end; p++) parts.push(btn(p, String(p), p===page));
  if (page < pages){ parts.push(btn(page+1,'›')); parts.push(btn(pages,'»')); }
  return `<div class="mt-6 flex flex-wrap gap-2 items-center justify-center">${parts.join('')}</div>`;
}

async function renderSearch(query, page=1){
  const resultsEl = document.getElementById('results');
  if (!resultsEl) return;
  const all = await runSearch(query);
  const start = (page-1)*PAGE_SIZE;
  const view = all.slice(start, start+PAGE_SIZE);
  resultsEl.innerHTML = view.map(renderRecipeCard).join('') + renderPager(all.length, page);

  // pager clicks
  resultsEl.addEventListener('click', (e)=>{
    const b = e.target.closest('button[data-page]');
    if(!b) return;
    const p = parseInt(b.dataset.page,10);
    renderSearch(query, p);
  }, { once:true }); // rebind per render
}

// Hook til dit input
document.addEventListener('DOMContentLoaded', ()=>{
  const input = document.getElementById('homeSearch');
  if (!input) return;
  let t;
  input.addEventListener('input', ()=>{
    clearTimeout(t);
    const q = input.value.trim();
    t = setTimeout(()=>{ if(q){ renderSearch(q,1); } }, 150);
  });
});
