
// /js/guide-page.js
import { loadAllGuides } from './guides.js';
import { formatStars } from './app.js';

function getSlug(){
  const p = new URLSearchParams(location.search);
  return (p.get('slug') || '').trim();
}
function findBySlug(data, slug){
  const s2 = decodeURIComponent(slug).toLowerCase();
  return data.find(x => (x.slug||'').toLowerCase() === s2) || null;
}

async function init(){
  const titleEl = document.getElementById('guideTitle');
  const introEl = document.getElementById('guideIntro');
  const contentEl = document.getElementById('guideContent');
  const ratingEl = document.getElementById('guideRating');
  const breadcrumb = document.getElementById('breadcrumbTitle');

  const slug = getSlug();
  if (!slug){ titleEl.textContent = 'Guide mangler slug i url'; return; }

  let data = [];
  try { data = await loadAllGuides(); }
  catch (e){ titleEl.textContent = 'Kunne ikke indlæse guides'; return; }

  const g = findBySlug(data, slug);
  if (!g){ titleEl.textContent = 'Guide ikke fundet'; return; }

  document.title = g.title + ' – opskrift-drikke.dk';
  breadcrumb.textContent = g.title;
  titleEl.textContent = g.title;
  introEl.textContent = g.intro;
  contentEl.innerHTML = g.content;
  ratingEl.innerHTML = `${g.rating.toFixed(1)} ★ <span class="opacity-70">(${g.reviews})</span>`;
}

document.addEventListener('DOMContentLoaded', init);
