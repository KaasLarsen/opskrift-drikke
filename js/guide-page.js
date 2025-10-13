// /js/guide-page.js
import { currentUser } from './auth.js';
import { showToast } from './app.js';

// --- PriceRunner widget (failsafe + kompatibel med begge mappings) ---
async function safeMountPRWidget(guide){
  try {
    const rotator = await import('/js/pricerunner-rotator.js');
    const mapping = await import('/js/pr-widgets-map.js');

    let key = null;
    if (typeof mapping.chooseWidgetKeys === 'function') {
      const keys = mapping.chooseWidgetKeys(guide) || [];
      key = Array.isArray(keys) && keys.length ? keys[0] : null;
    } else if (typeof mapping.chooseWidgetKeyFrom === 'function') {
      key = mapping.chooseWidgetKeyFrom(guide.category, guide.tags || []);
    }
    if (!key) {
      console.warn('PR (guide): ingen widget-key for', guide.category, guide.tags);
      return;
    }

    // sørg for at slotten findes i main-kolonnen (under kommentarer)
    const slotSel = '#pr-guide-slot';
    if (!document.querySelector(slotSel)) {
      const mainCol = document.querySelector('#guideMainCol') || document.querySelector('.md\\:col-span-2');
      if (mainCol) {
        const holder = document.createElement('div');
        holder.className = 'card bg-white p-6 mt-6';
        holder.innerHTML = '<h3 class="text-lg font-medium">Anbefalet udstyr</h3><div id="pr-guide-slot" class="mt-2"></div>';
        mainCol.appendChild(holder);
      }
    }

    console.log('PR (guide): mount key =', key, 'for category=', guide.category, 'tags=', guide.tags);
    rotator.mountPRByKey(slotSel, key);

    // mild fallback hvis script blokeres
    setTimeout(() => {
      const slot = document.querySelector(slotSel);
      if (slot && !slot.querySelector('iframe') && !slot.querySelector('[id^="prw-"] iframe')) {
        const note = document.createElement('div');
        note.className = 'text-sm opacity-70 mt-2 pr-fallback-note';
        note.textContent = 'Annonce – kunne ikke indlæse tilbud lige nu.';
        if (!slot.querySelector('.pr-fallback-note')) slot.appendChild(note);
      }
    }, 4000);
  } catch (err) {
    console.warn('PriceRunner-widget (guide) blev sprunget over (valgfri):', err);
  }
}

// Helpers
function qs(id){ return document.getElementById(id); }
function getSlug(){ const p = new URLSearchParams(location.search); return (p.get('slug') || '').trim(); }

function commentsKey(slug){ return `od_guide_comments_${slug}`; }
function loadComments(slug){ try { return JSON.parse(localStorage.getItem(commentsKey(slug))||'[]'); } catch { return []; } }
function saveComments(slug, list){ localStorage.setItem(commentsKey(slug), JSON.stringify(list.slice(-200))); }
function addComment(slug, entry){ const list = loadComments(slug); list.push(entry); saveComments(slug, list); return list; }
function renderComments(slug, wrap){
  const list = loadComments(slug).sort((a,b)=>b.ts-a.ts);
  wrap.innerHTML = list.length
    ? list.map(c => `
        <div class="border rounded-2xl p-3">
          <div class="text-sm opacity-70">${new Date(c.ts).toLocaleString('da-DK')}</div>
          <div class="mt-1">${c.text}</div>
          <div class="text-sm opacity-70 mt-1">${c.user||'Anonym'}</div>
        </div>`).join('')
    : '<p class="opacity-70">Ingen kommentarer endnu.</p>';
}

async function init(){
  const slug = getSlug();
  const titleEl = qs('guideTitle');
  const introEl = qs('guideIntro');
  const contentEl = qs('guideContent');
  const breadEl = qs('breadcrumbTitle');
  const relatedEl = qs('relatedGuides');
  const commentList = qs('commentList');
  const commentText = qs('commentText');
  const commentSubmit = qs('commentSubmit');
  const commentHint = qs('commentHint');

  if (!slug){ titleEl.textContent = 'Slug mangler i URL'; return; }

  // hent guides-data
  let guides = [];
  try {
    const res = await fetch('/data/guides.json', { cache: 'no-cache' });
    guides = await res.json();
  } catch (e){
    titleEl.textContent = 'Kunne ikke indlæse guides';
    console.error(e);
    return;
  }

  const guide = guides.find(g => (g.slug||'').toLowerCase() === decodeURIComponent(slug).toLowerCase());
  if (!guide){ titleEl.textContent = 'Guide ikke fundet'; return; }

  // meta
  document.title = guide.title + ' – opskrift-drikke.dk';
  breadEl.textContent = guide.title;
  titleEl.textContent = guide.title;
  introEl.textContent = guide.intro || '';

  // indhold (forventer at content er trusted HTML fra dit build)
  contentEl.innerHTML = guide.content || '';

  // relaterede (samme kategori)
  const rel = guides.filter(g => g.slug !== guide.slug && g.category === guide.category).slice(0,5);
  relatedEl.innerHTML = rel.length
    ? rel.map(r => `<li><a class="hover:underline" href="/pages/guide.html?slug=${r.slug}">${r.title}</a></li>`).join('')
    : '<li class="opacity-70">Ingen relaterede guides fundet.</li>';

  // kommentarer
  const u = currentUser();
  commentHint.textContent = u ? `Logget ind som ${u.email}` : 'Du skal være logget ind.';
  renderComments(slug, commentList);
  commentSubmit.addEventListener('click', ()=>{
    const u = currentUser(); if (!u){ showToast('Du skal være logget ind for at kommentere'); return; }
    const txt = (commentText.value||'').trim(); if (!txt){ showToast('Skriv en kommentar først'); return; }
    const entry = { text: txt, ts: Date.now(), user: u.email };
    addComment(slug, entry);
    renderComments(slug, commentList);
    commentText.value = '';
    showToast('Kommentar tilføjet');
  });

  // PriceRunner (under kommentarer)
  await safeMountPRWidget(guide);
}

document.addEventListener('DOMContentLoaded', init);
