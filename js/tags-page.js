// /js/tags-page.js — tag-index med søg, sortering, min-count, visning, pagination
import { loadAllRecipes, renderRecipeCard } from '/js/recipes.js';

const PAGE_SIZE = 30;

let TAGS = [];             // [{tag, count}]
let MAP  = new Map();      // tag -> [recipes]
let SELECTED = '';         // nuværende valgt tag
let CURRENT_PAGE = 1;

function el(id){ return document.getElementById(id); }

function countMap(list){
  const map = new Map();
  for (const r of list){
    for (const t of (r.tags || [])){
      const k = String(t).trim();
      if (!k) continue;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(r);
    }
  }
  return map;
}

function buildTags(){
  TAGS = [...MAP.entries()].map(([tag, arr]) => ({ tag, count: arr.length }));
}

function sortTags(mode){
  if (mode === 'countAsc') TAGS.sort((a,b) => a.count - b.count || a.tag.localeCompare(b.tag,'da'));
  else if (mode === 'alphaAsc') TAGS.sort((a,b) => a.tag.localeCompare(b.tag,'da'));
  else if (mode === 'alphaDesc') TAGS.sort((a,b) => b.tag.localeCompare(a.tag,'da'));
  else TAGS.sort((a,b) => b.count - a.count || a.tag.localeCompare(b.tag,'da')); // countDesc
}

function renderCloud(){
  const wrap = el('tagCloud');
  const minCount = parseInt(el('minCount').value, 10) || 1;
  const view = TAGS.filter(t => t.count >= minCount);
  wrap.innerHTML = view.map(t => `
    <button class="chip hover:bg-stone-50 ${SELECTED===t.tag?'active':''}" data-tag="${t.tag}">
      <span class="font-medium">${t.tag}</span>
      <span class="ml-2 text-xs opacity-70">(${t.count})</span>
    </button>
  `).join('') || `<div class="text-sm opacity-70">Ingen tags matcher dine filtre.</div>`;
}

function renderPopular(){
  const list = el('popularList');
  const top = TAGS.slice().sort((a,b)=>b.count-a.count).slice(0,12);
  list.innerHTML = top.map(t => `
    <li><a href="#" data-tag="${t.tag}" class="text-orange-600 hover:underline">${t.tag}</a> <span class="opacity-60">(${t.count})</span></li>
  `).join('');
}

function renderPager(total){
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return (el('pager').innerHTML = '');
  const btn = (p, lab = p, act=false) =>
    `<button data-page="${p}" class="px-3 py-1.5 rounded-lg border ${act?'bg-orange-500 text-white border-orange-500':'bg-white hover:bg-stone-50'}">${lab}</button>`;
  const parts = [];
  if (CURRENT_PAGE>1){ parts.push(btn(1,'«')); parts.push(btn(CURRENT_PAGE-1,'‹')); }
  const s = Math.max(1, CURRENT_PAGE-2), e = Math.min(pages, CURRENT_PAGE+2);
  for (let p=s;p<=e;p++) parts.push(btn(p,String(p),p===CURRENT_PAGE));
  if (CURRENT_PAGE<pages){ parts.push(btn(CURRENT_PAGE+1,'›')); parts.push(btn(pages,'»')); }
  el('pager').innerHTML = parts.join('');
}

function renderSelected(){
  const wrap = el('selectedWrap');
  const grid = el('results');
  const title= el('selectedTitle');
  if (!SELECTED){ wrap.classList.add('hidden'); grid.innerHTML=''; el('pager').innerHTML=''; return; }

  const all = MAP.get(SELECTED) || [];
  title.textContent = `${SELECTED} – ${all.length} opskrift${all.length===1?'':'er'}`;

  const start = (CURRENT_PAGE-1)*PAGE_SIZE;
  const view = all.slice(start, start+PAGE_SIZE);
  grid.innerHTML = view.map(renderRecipeCard).join('');
  renderPager(all.length);
  wrap.classList.remove('hidden');
}

function setSelected(tag){
  SELECTED = tag;
  CURRENT_PAGE = 1;
  renderSelected();
  // opdatér highlight i cloud
  document.querySelectorAll('#tagCloud [data-tag]').forEach(b => {
    b.classList.toggle('active', b.dataset.tag === tag);
  });
}

function wire(){
  // sort + view + minCount
  el('sortSelect').addEventListener('change', () => {
    sortTags(el('sortSelect').value); renderCloud(); renderPopular();
  });
  el('viewSelect').addEventListener('change', () => {
    const v = el('viewSelect').value;
    const grid = el('tagCloud');
    grid.classList.toggle('sm:grid-cols-2', v==='grid');
    grid.classList.toggle('lg:grid-cols-3', v==='grid');
    grid.classList.toggle('grid', v==='grid');
    grid.classList.toggle('space-y-2', v==='list');
    grid.classList.toggle('grid-cols-1', v==='list');
  });
  el('minCount').addEventListener('change', () => renderCloud());

  // klik på tag cloud
  el('tagCloud').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tag]'); if(!b) return;
    setSelected(b.dataset.tag);
    window.scrollTo({ top: el('selectedWrap').offsetTop - 80, behavior: 'smooth' });
  });

  // klik på populære i siden
  el('popularList').addEventListener('click', (e) => {
    const a = e.target.closest('[data-tag]'); if(!a) return;
    e.preventDefault();
    setSelected(a.dataset.tag);
    window.scrollTo({ top: el('selectedWrap').offsetTop - 80, behavior: 'smooth' });
  });

  // pager
  el('pager').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-page]'); if(!b) return;
    CURRENT_PAGE = parseInt(b.dataset.page,10) || 1;
    renderSelected();
    window.scrollTo({ top: el('selectedWrap').offsetTop - 80, behavior: 'smooth' });
  });

  // ryd valg
  el('clearTag').addEventListener('click', () => { setSelected(''); });

  // søg i tags
  el('tagSearch').addEventListener('input', () => {
    const q = el('tagSearch').value.toLowerCase().trim();
    const minCount = parseInt(el('minCount').value,10) || 1;
    const filtered = TAGS
      .filter(t => t.count >= minCount)
      .filter(t => t.tag.toLowerCase().includes(q));
    const wrap = el('tagCloud');
    wrap.innerHTML = filtered.map(t => `
      <button class="chip hover:bg-stone-50 ${SELECTED===t.tag?'active':''}" data-tag="${t.tag}">
        <span class="font-medium">${t.tag}</span>
        <span class="ml-2 text-xs opacity-70">(${t.count})</span>
      </button>
    `).join('') || `<div class="text-sm opacity-70">Ingen tags matcher din søgning.</div>`;
  });

  // quick filters
  document.getElementById('quickFilters').addEventListener('click', (e)=>{
    const b = e.target.closest('[data-qf]'); if(!b) return;
    setSelected(b.dataset.qf);
  });
}

async function mount(){
  // PR-slot (genbrug din rotator)
  if (window.mountPR) window.mountPR('#pr-tags-slot');

  const all = await loadAllRecipes();
  MAP = countMap(all);
  buildTags();
  sortTags('countDesc');
  renderCloud();
  renderPopular();
  wire();

  // hvis URL har ?tag=...
  const url = new URL(location.href);
  const initial = url.searchParams.get('tag');
  if (initial && MAP.has(initial)) setSelected(initial);
}

document.addEventListener('DOMContentLoaded', mount);
