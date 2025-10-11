// /js/suggest.js
import { loadAllRecipes, renderRecipeCard } from './recipes.js';

const fold = (s='') => s.toLowerCase()
  .replace(/æ/g,'ae').replace(/ø/g,'oe').replace(/å/g,'aa')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9\s\-]/g,' ')
  .replace(/\s+/g,' ')
  .trim();

let DATA=[], INDEX=[];
let activeIndex = -1;

function buildIndex(r){
  return {
    q: fold([r.title||'', r.category||'', (r.tags||[]).join(' ')].join(' ')),
    title: r.title, category: r.category, tags: r.tags||[]
  };
}

function ensureLayer(input){
  let box = document.getElementById('searchSuggest');
  if (!box){
    box = document.createElement('div');
    box.id = 'searchSuggest';
    box.className = 'absolute z-40 mt-1 w-full bg-white border rounded-2xl shadow';
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(box);
  }
  return box;
}

function render(items, box){
  if (!items.length){ box.innerHTML=''; box.style.display='none'; return; }
  box.style.display='block';
  box.innerHTML = items.map((it,i)=>`
    <div data-i="${i}" class="px-3 py-2 cursor-pointer ${i===activeIndex?'bg-stone-100':''}">
      <div class="text-sm">${it.title}</div>
      <div class="text-xs opacity-70">${it.category}${it.tags?.length? ' · '+it.tags.slice(0,3).join(', '):''}</div>
    </div>`).join('');
}

async function initSuggest(){
  const input = document.getElementById('searchInput');
  const results = document.getElementById('results');
  if (!input || !results) return;
  const box = ensureLayer(input);

  DATA = await loadAllRecipes();
  INDEX = DATA.map(buildIndex);

  const pick = (item) => {
    input.value = item.title;
    input.dispatchEvent(new Event('input', {bubbles:true}));
    box.style.display='none';
  };

  input.addEventListener('input', ()=>{
    const q = fold(input.value);
    activeIndex = -1;
    if (!q){ render([], box); return; }
    const parts = q.split(' ').filter(Boolean);
    const out = [];
    for (let i=0;i<INDEX.length;i++){
      const it = INDEX[i];
      let ok = true;
      for (const p of parts){ if (!it.q.includes(p)) { ok=false; break; } }
      if (!ok) continue;
      out.push({i, title: DATA[i].title, category: DATA[i].category, tags: DATA[i].tags});
      if (out.length >= 8) break;
    }
    render(out, box);
  });

  input.addEventListener('keydown', (e)=>{
    if (box.style.display==='none') return;
    const items = [...box.querySelectorAll('[data-i]')];
    if (!items.length) return;
    if (e.key === 'ArrowDown'){ activeIndex = (activeIndex+1) % items.length; render(items.map(el=>({title:el.querySelector('.text-sm').textContent, category:'', tags:[] })), box); e.preventDefault(); }
    if (e.key === 'ArrowUp'){ activeIndex = (activeIndex-1+items.length) % items.length; render(items.map(el=>({title:el.querySelector('.text-sm').textContent, category:'', tags:[] })), box); e.preventDefault(); }
    if (e.key === 'Enter'){
      e.preventDefault();
      const el = items[Math.max(0, activeIndex)];
      const title = el?.querySelector('.text-sm')?.textContent;
      if (title){
        input.value = title;
        input.dispatchEvent(new Event('input', {bubbles:true}));
        box.style.display='none';
      }
    }
    if (e.key === 'Escape'){ box.style.display='none'; }
  });

  box.addEventListener('click', (e)=>{
    const item = e.target.closest('[data-i]'); if (!item) return;
    const idx = +item.getAttribute('data-i');
    input.value = DATA[INDEX[idx].i]?.title || item.querySelector('.text-sm')?.textContent || '';
    input.dispatchEvent(new Event('input', {bubbles:true}));
    box.style.display='none';
  });

  document.addEventListener('click', (e)=>{
    if (!box.contains(e.target) && e.target !== input) box.style.display='none';
  });
}

document.addEventListener('DOMContentLoaded', initSuggest);
