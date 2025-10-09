
// === opskrift-drikke: core client script (clean JS, no <script> tags) ===

// helpers
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

// load partials (header/footer)
(function loadPartials(){
  const nodes = $$('[data-include]');
  if (!nodes.length) return;
  nodes.forEach(async el => {
    try{
      const url = el.getAttribute('data-include');
      const res = await fetch(url, { cache: 'no-store' });
      if(!res.ok) throw new Error('HTTP '+res.status+' loading '+url);
      const html = await res.text();
      el.outerHTML = html;
    }catch(err){
      console.error('[partials]', err);
    }
  });
})();

// list latest from recipes-sitemap.xml
async function renderSenesteList(containerSel = '#seneste-list'){
  const box = document.querySelector(containerSel);
  if (!box) return;
  try{
    const res = await fetch('/sitemaps/recipes-sitemap.xml?ts=' + Date.now());
    if(!res.ok) throw new Error('HTTP '+res.status+' recipes-sitemap.xml');
    const xml = await res.text();
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const urls = [...doc.querySelectorAll('url loc')].map(n => n.textContent);
    const items = urls.slice(-24).reverse();
    box.innerHTML = items.map(u => cardFromUrl(u)).join('');
  }catch(err){
    console.error('[seneste]', err);
  }
}

function cardFromUrl(u){
  const slug = u.split('/').pop().replace('.html','');
  const title = slug.replace(/-/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase());
  return `
    <a class="card hover-lift" href="${u}">
      <figure class="thumb-sq" aria-hidden="true">
        <svg class="ico"><use href="/assets/icons.svg#cup"/></svg>
      </figure>
      <div class="card-body">
        <h3>${title}</h3>
        <p class="meta">Drik · Nem</p>
      </div>
    </a>`;
}

// category filters (if present)
function setupCategoryFilters(){
  const buttons = $$('.filter [data-filter]');
  if (!buttons.length) return;
  buttons.forEach(btn => btn.addEventListener('click', () => {
    const k = btn.getAttribute('data-filter');
    $$('.grid .card').forEach(card => {
      const tags = (card.getAttribute('data-kategori')||'').split(',');
      card.style.display = (k === 'alle' || tags.includes(k)) ? '' : 'none';
    });
    buttons.forEach(b => b.classList.toggle('active', b === btn));
  }));
}

// theme toggle
(function themeInit(){
  const root = document.documentElement;
  try{
    const saved = localStorage.getItem('theme');
    const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (sysDark ? 'dark' : 'light');
    root.setAttribute('data-theme', theme);
    document.addEventListener('click', (e)=>{
      const btn = e.target.closest('[data-theme-toggle]');
      if(!btn) return;
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }catch(err){
    console.warn('[theme]', err);
  }
})();

// search overlay
(function searchOverlay(){
  const tpl = document.createElement('template');
  tpl.innerHTML = `
    <div class="search-overlay" hidden>
      <div class="search-panel" role="dialog" aria-modal="true" aria-label="Søg opskrifter">
        <div class="search-head">
          <svg class="ico"><use href="/assets/icons.svg#search"/></svg>
          <input type="text" class="search-input" placeholder="Søg efter drik, fx 'Smoothie', 'Gløgg', 'Juice' (ESC for at lukke)" />
        </div>
        <div class="search-results grid" id="search-results"></div>
      </div>
    </div>`;
  document.body.appendChild(tpl.content);

  const overlay = document.querySelector('.search-overlay');
  const input = document.querySelector('.search-input');
  const results = document.getElementById('search-results');

  async function getAllUrls(){
    const res = await fetch('/sitemaps/recipes-sitemap.xml?ts='+Date.now());
    const xml = await res.text();
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    return [...doc.querySelectorAll('url loc')].map(n => n.textContent);
  }

  function cardFromUrl(u){
    const slug = u.split('/').pop().replace('.html','');
    const title = slug.replace(/-/g,' ').replace(/\b[a-z]/g, c=>c.toUpperCase());
    return `
      <a class="card hover-lift" href="${u}">
        <figure class="thumb-sq"><svg class="ico"><use href="/assets/icons.svg#cup"/></svg></figure>
        <div class="card-body">
          <h3>${title}</h3>
          <p class="meta">Drik · Nem</p>
        </div>
      </a>`;
  }

  let cacheUrls = null;
  async function doSearch(q){
    if(!cacheUrls) cacheUrls = await getAllUrls();
    const needle = q.trim().toLowerCase();
    if(!needle){
      results.innerHTML = '';
      return;
    }
    const hits = cacheUrls.filter(u=>u.toLowerCase().includes(needle));
    results.innerHTML = hits.slice(0,48).map(cardFromUrl).join('');
  }

  function open(){
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(()=>input && input.focus(), 0);
  }
  function close(){
    overlay.hidden = true;
    document.body.style.overflow = '';
    input.value=''; results.innerHTML='';
  }

  document.addEventListener('click', (e)=>{
    if(e.target.closest('[data-search-open]')) open();
    if(e.target.classList.contains('search-overlay')) close();
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey){
      e.preventDefault(); open();
    }
    if(e.key === 'Escape') close();
  });

  let t=null;
  input && input.addEventListener('input', ()=>{
    clearTimeout(t); t=setTimeout(()=>doSearch(input.value), 180);
  });
})();

// expose
window.renderSenesteList = renderSenesteList;
window.setupCategoryFilters = setupCategoryFilters;
