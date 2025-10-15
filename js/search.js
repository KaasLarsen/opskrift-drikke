// === search.js — accent-fri, synonym-søgning + forslag + enter-navigation ===
import { loadAllRecipes, renderRecipeCard } from '/js/recipes.js';

const INPUT_ID   = 'homeSearch';
const SUGGEST_ID = 'suggestions';
const PAGE_SIZE  = 30;

// Synonymer: "kaffe" rammer espresso/latte/iskaffe osv.
const SYNONYMS = {
  'kaffe':   ['kaffe','espresso','latte','cappuccino','americano','macchiato','iskaffe','cold brew','frappé','mokka','mocha'],
  'espresso':['espresso','ristretto','lungo','americano'],
  'juice':   ['juice','saft'],
  'mocktail':['mocktail','alkoholfri','virgin'],
  'gløgg':   ['gløgg','glogg','mulled wine'],
};

function norm(s){
  return String(s||'')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'') // fjern diakritik (æøå m.m. håndteres stadig via almindelig match)
    .replace(/\s+/g,' ')
    .trim();
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

function bagOfText(rec){
  const title = norm(rec.title);
  const sub   = norm(rec.subtitle || rec.description || '');
  const tags  = norm((rec.tags || []).join(' '));
  const ingr  = norm((rec.ingredients || []).join(' '));
  return { title, sub, tags, ingr };
}

function score(rec, queries){
  const f = bagOfText(rec);
  let s = 0;
  for (const q of queries){
    if (f.title.includes(q)) s += 5;
    if (f.tags.includes(q))  s += 3;
    if (f.ingr.includes(q))  s += 2;
    if (f.sub.includes(q))   s += 1;
  }
  return s;
}

// ÉN søgefunktion der bruges både til forslag og resultater
async function runSearch(query){
  const qs = expandQuery(query);
  if (!qs.length) return [];
  const all = await loadAllRecipes();
  return all.map(r => ({ r, s: score(r, qs) }))
            .filter(x => x.s > 0)
            .sort((a,b) => b.s - a.s)
            .map(x => x.r);
}

// ------- Forslagsboks (auto) -------
function ensureSuggestBox(){
  let box = document.getElementById(SUGGEST_ID);
  if (!box){
    box = document.createElement('div');
    box.id = SUGGEST_ID;
    // CSS findes i site.css (#suggestions)
    const host = document.querySelector('.hero-search-wrap') || document.body;
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
      ${(r.tags && r.tags.length) ? `<span class="suggest-meta">#${r.tags.slice(0,2).join(' #')}</span>` : ''}
    </div>`).join('');
}

// ------- Resultat-render (til sider med #results, inkl. forside/Seneste) -------
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

async function renderSearchResults(query, page=1){
  const resultsEl = document.getElementById('results');
  if (!resultsEl) return; // ikke på denne side
  const all = await runSearch(query);
  const start = (page-1)*PAGE_SIZE;
  const view = all.slice(start, start+PAGE_SIZE);
  resultsEl.innerHTML = view.map(renderRecipeCard).join('') + renderPager(all.length, page);

  // pager clicks (rebind pr. render)
  resultsEl.addEventListener('click', (e)=>{
    const b = e.target.closest('button[data-page]');
    if(!b) return;
    const p = parseInt(b.dataset.page,10);
    renderSearchResults(query, p);
  }, { once:true });
}

// ------- Wire input + enter + klik på forslag -------
async function wireSearch(){
  const input = document.getElementById(INPUT_ID);
  if (!input) return;

  ensureSuggestBox();

  let seq = 0, t;
  input.addEventListener('input', async () => {
    clearTimeout(t);
    const val = input.value.trim();
    if (!val){ renderSuggestions([]); return; }
    t = setTimeout(async () => {
      const my = ++seq;
      const hits = await runSearch(val);
      if (my !== seq) return;
      renderSuggestions(hits);
      // Hvis siden har #results, opdatér også resultat-listen live
      if (document.getElementById('results')) {
        renderSearchResults(val, 1);
      }
    }, 120);
  });

  // Enter → gå til bedste match eller til /seneste.html?query=...
  input.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    const hits = await runSearch(q);
    if (hits[0]){
      location.href = `/pages/opskrift?slug=${encodeURIComponent(hits[0].slug || hits[0].id)}`;
    } else {
      location.href = `/pages/seneste.html?query=${encodeURIComponent(q)}`;
    }
  });

  // Klik på forslag
  document.getElementById(SUGGEST_ID)?.addEventListener('click', (e) => {
    const el = e.target.closest('[data-slug]'); if(!el) return;
    const slug = el.getAttribute('data-slug');
    location.href = `/pages/opskrift?slug=${encodeURIComponent(slug)}`;
  });

  // Luk forslag ved klik udenfor
  document.addEventListener('click', (e) => {
    const box = document.getElementById(SUGGEST_ID);
    if (!box) return;
    if (!box.contains(e.target) && e.target !== input){
      box.classList.remove('active'); box.innerHTML = '';
    }
  });

  // Hvis URL har ?query= (fx på /seneste.html), render initialt
  const url = new URL(location.href);
  const q = url.searchParams.get('query') || '';
  if (q) {
    input.value = q;
    renderSuggestions((await runSearch(q)).slice(0,8));
    renderSearchResults(q, 1);
  }
}

document.addEventListener('DOMContentLoaded', wireSearch);
