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
