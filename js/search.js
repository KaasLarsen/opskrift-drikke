// === search.js — accent-fri, synonym-baseret søgning + forslag ===
import { loadAllRecipes } from '/js/recipes.js';

const INPUT_ID = 'homeSearch';
const SUGGEST_ID = 'suggestions';

// Enkle synonymer (så "kaffe" rammer espresso/latte/iskaffe m.m.)
const SYNONYMS = {
  'kaffe': ['kaffe','espresso','latte','cappuccino','americano','macchiato','iskaffe','cold brew'],
  'juice': ['juice','saft'],
  'mocktail': ['mocktail','alkoholfri','virgin'],
  'gløgg': ['gløgg','glogg','mulled wine','glogg']
};

function norm(s){
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'') // fjern diakritik
    .replace(/\s+/g,' ')
    .trim();
}

function expandQuery(q){
  const qn = norm(q);
  const tokens = qn.split(' ').filter(Boolean);
  const expanded = new Set();
  for (const t of tokens){
    expanded.add(t);
    (SYNONYMS[t] || []).forEach(x => expanded.add(norm(x)));
  }
  return [...expanded];
}

function fieldText(rec){
  const t = norm(rec.title);
  const d = norm(rec.subtitle || rec.description || '');
  const tags = norm((rec.tags || []).join(' '));
  return { t, d, tags };
}

function score(rec, expanded){
  const { t, d, tags } = fieldText(rec);
  let s = 0;
  for (const q of expanded){
    if (t.includes(q))   s += 5;
    if (tags.includes(q)) s += 3;
    if (d.includes(q))   s += 1;
  }
  return s;
}

async function runSearch(q){
  const all = await loadAllRecipes();
  const expanded = expandQuery(q);
  if (!expanded.length) return [];
  return all
    .map(r => ({ r, s: score(r, expanded) }))
    .filter(x => x.s > 0)
    .sort((a,b) => b.s - a.s)
    .map(x => x.r);
}

function ensureSuggestEl(){
  let box = document.getElementById(SUGGEST_ID);
  if (!box){
    box = document.createElement('div');
    box.id = SUGGEST_ID;
    // sæt under søgefeltet (din CSS styrer udseende)
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
    </div>
  `).join('');
}

async function wireSearch(){
  const input = document.getElementById(INPUT_ID);
  if (!input) return;
  ensureSuggestEl();

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
    const el = e.target.closest('[data-slug]');
    if (!el) return;
    const slug = el.getAttribute('data-slug');
    location.href = `/pages/opskrift?slug=${encodeURIComponent(slug)}`;
  });

  input.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const hits = await runSearch(input.value);
    if (hits[0]){
      location.href = `/pages/opskrift?slug=${encodeURIComponent(hits[0].slug || hits[0].id)}`;
    }else{
      location.href = `/pages/seneste.html?query=${encodeURIComponent(input.value)}`;
    }
  });
}
document.addEventListener('DOMContentLoaded', wireSearch);
