// /js/tag-page.js
import { loadAllRecipes, renderRecipeCard } from './recipes.js';

// fold: gør søg robust m. æ/ø/å, case, mellemrum
const fold = (s='') => s.toLowerCase()
  .replace(/æ/g,'ae').replace(/ø/g,'oe').replace(/å/g,'aa')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/\s+/g,' ')
  .trim();

function getTagFromUrl(){
  const u = new URL(location.href);
  // vi understøtter både ?q= og ?tag=
  const q = u.searchParams.get('q') || u.searchParams.get('tag') || '';
  // fallback: hvis nogen rammer /tags/uden%20alkohol uden .html, fanger vi sidste path-del
  if (!q && location.pathname.startsWith('/tags/') && location.pathname.endsWith('/') === false && location.pathname.endsWith('.html') === false){
    const last = decodeURIComponent(location.pathname.split('/').pop()||'');
    return last;
  }
  return q;
}

document.addEventListener('DOMContentLoaded', async ()=>{
  const tagRaw = getTagFromUrl();
  const titleEl = document.getElementById('title');
  const crumbEl = document.getElementById('crumb');
  const countEl = document.getElementById('count');
  const results = document.getElementById('results');

  if (!tagRaw){
    titleEl.textContent = 'Intet tag angivet';
    results.innerHTML = '<p class="p-4 bg-rose-50 border rounded-2xl">Brug ?q=dit-tag i URL’en.</p>';
    return;
  }

  const tagNice = tagRaw.replace(/\s+/g,' ').trim();
  const tagKey  = fold(tagNice);

  titleEl.textContent = tagNice.charAt(0).toUpperCase() + tagNice.slice(1);
  crumbEl.textContent = titleEl.textContent;

  let data = [];
  try { data = await loadAllRecipes(); }
  catch(e){ results.innerHTML = '<p class="p-4 bg-rose-50 border rounded-2xl">Kunne ikke indlæse data.</p>'; return; }

  const list = data.filter(r => (r.tags||[]).some(t => fold(t) === tagKey));
  countEl.textContent = list.length ? `${list.length} opskrifter` : 'Ingen opskrifter fundet';

  results.innerHTML = list.length
    ? list.map(renderRecipeCard).join('')
    : '<p class="p-4 bg-stone-50 border rounded-2xl">Ingen resultater for “‘+tagNice+'”.</p>';
});
