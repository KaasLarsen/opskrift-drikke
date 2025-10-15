// === search.js — global søg + forslag (bruger loadAllRecipes) ===
import { loadAllRecipes } from '/js/recipes.js';

const INPUT_ID = 'homeSearch';
const SUGGEST_ID = 'suggestions';

function norm(s){
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')   // fjern diakritiske tegn
    .replace(/\s+/g,' ')
    .trim();
}

function score(rec, qn){
  // enkel scoring: title match > tags > desc
  const t = norm(rec.title);
  const d = norm(rec.subtitle || rec.description || '');
  const tags = norm((rec.tags || []).join(' '));
  let s = 0;
  if (t.includes(qn)) s += 5;
  if (tags.includes(qn)) s += 2;
  if (d.includes(qn)) s += 1;
  return s;
}

async function runSearch(q){
  const all = await loadAllRecipes();
  const qn  = norm(q);
  if (!qn) return [];
  return all
    .map(r => ({ r, s: score(r, qn) }))
    .filter(x => x.s > 0)
    .sort((a,b) => b.s - a.s)
    .map(x => x.r);
}

function ensureSuggestEl(){
  let box = document.getElementById(SUGGEST_ID);
  if (!box){
    box = document.createElement('div');
    box.id = SUGGEST_ID;
    document.querySelector('.hero-search-wrap, .max-w-xl')?.appendChild(box);
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

  let lock = 0;
  input.addEventListener('input', async (e) => {
    const val = e.target.value;
    const my = ++lock;
    if (!val.trim()){ renderSuggestions([]); return; }
    const hits = await runSearch(val);
    if (my !== lock) return;  // afbrudte
    renderSuggestions(hits);
  });

  // klik på forslag
  document.getElementById(SUGGEST_ID)?.addEventListener('click', (e) => {
    const el = e.target.closest('[data-slug]');
    if (!el) return;
    const slug = el.getAttribute('data-slug');
    location.href = `/pages/opskrift?slug=${encodeURIComponent(slug)}`;
  });

  // Enter -> gå til første match eller seneste-siden med query
  input.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const hits = await runSearch(input.value);
    if (hits[0]){
      location.href = `/pages/opskrift?slug=${encodeURIComponent(hits[0].slug || hits[0].id)}`;
    }else{
      // fallback til liste
      location.href = `/pages/seneste.html?query=${encodeURIComponent(input.value)}`;
    }
  });
}

document.addEventListener('DOMContentLoaded', wireSearch);
