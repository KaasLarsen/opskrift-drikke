// /js/weekly.js
import { loadAllRecipes, renderRecipeCard } from './recipes.js';

const EV_KEY = 'od_fav_events';   // [{slug, ts, ok}]
const CM_KEY = 'od_comments_log'; // [{slug, title, text, ts, userEmail}]

function loadFavEvents(){
  try { return JSON.parse(localStorage.getItem(EV_KEY)||'[]'); } catch { return []; }
}
function saveFavEvents(list){
  localStorage.setItem(EV_KEY, JSON.stringify(list.slice(-500))); // cap
}
function pushFavEvent(e){
  const list = loadFavEvents();
  list.push(e);
  saveFavEvents(list);
}

function loadComments(){
  try { return JSON.parse(localStorage.getItem(CM_KEY)||'[]'); } catch { return []; }
}
export function logComment(entry){
  const list = loadComments();
  list.push(entry);
  localStorage.setItem(CM_KEY, JSON.stringify(list.slice(-500)));
}

function last7d(ts){ return (Date.now() - ts) <= 7*24*60*60*1000; }

async function renderWeekly(){
  const wrap = document.getElementById('weeklyTop');
  const revWrap = document.getElementById('weeklyReviewCard');
  if (!wrap && !revWrap) return;

  const all = await loadAllRecipes();
  const bySlug = new Map(all.map(r => [r.slug, r]));

  // Top gemte (kun events med ok=true, sidste 7 dage)
  if (wrap){
    const ev = loadFavEvents().filter(e => e.ok && last7d(e.ts));
    const counts = ev.reduce((a,e)=>{ a[e.slug]=(a[e.slug]||0)+1; return a; }, {});
    const ranking = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6)
      .map(([slug]) => bySlug.get(slug)).filter(Boolean);
    wrap.innerHTML = ranking.length
      ? ranking.map(renderRecipeCard).join('')
      : '<p class="p-4 bg-stone-50 border rounded-2xl">Ingen favoritter denne uge endnu.</p>';
  }

  // Ugens brugeranmeldelse = nyeste kommentar fra denne enhed (sidste 7 dage)
  if (revWrap){
    const comm = loadComments().filter(c => last7d(c.ts)).sort((a,b)=>b.ts-a.ts)[0];
    if (!comm){
      revWrap.innerHTML = '<p class="p-4 bg-stone-50 border rounded-2xl">Ingen kommentarer denne uge endnu.</p>';
    } else {
      const r = bySlug.get(comm.slug);
      revWrap.innerHTML = `
        <div class="card bg-white p-4">
          <div class="text-sm opacity-70 mb-1">Ugens anmeldelse</div>
          <div class="font-medium">${comm.userEmail||'Anonym'}</div>
          <p class="mt-1 text-sm">${comm.text}</p>
          ${r ? `<a class="inline-block mt-2 text-sm underline" href="/pages/opskrift.html?slug=${r.slug}">${r.title}</a>` : ''}
        </div>`;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // registrer favorit events
  window.addEventListener('favorite:toggled', (e)=>{
    const { slug, ok, ts } = e.detail || {};
    if (!slug) return;
    pushFavEvent({ slug, ok, ts: ts||Date.now() });
  });
  renderWeekly();
});
