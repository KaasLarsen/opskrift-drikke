// /js/guide-page.js  (SAFE MODE renderer)
import { currentUser } from './auth.js';
import { showToast } from './app.js';

window.__GUIDE_VERSION = 'safe-7';

// --- utils ---
const qs = (id) => document.getElementById(id);
const getSlug = () => (new URLSearchParams(location.search).get('slug') || '').trim();

// Ægte sentence case: stort første bogstav i starten OG efter . ! ? :
function sentenceCase(str = '') {
  let s = (str || '').replace(/\s+/g, ' ').trim();
  if (!s) return s;
  s = s.toLowerCase();
  s = s.replace(/(^|[.!?]\s+|:\s+|\(\s*)([a-zæøå])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  s = s.replace(/\s*:\s*/g, ': ');
  return s;
}

// --- PR under kommentarer (samme som før) ---
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
    if (!key) return;
    rotator.mountPRByKey('#pr-guide-slot', key);

    setTimeout(() => {
      const slot = document.querySelector('#pr-guide-slot');
      if (slot && !slot.querySelector('iframe') && !slot.querySelector('[id^="prw-"] iframe')) {
        const note = document.createElement('div');
        note.className = 'text-sm opacity-70 mt-2 pr-fallback-note';
        note.textContent = 'Annonce – kunne ikke indlæse tilbud lige nu.';
        if (!slot.querySelector('.pr-fallback-note')) slot.appendChild(note);
      }
    }, 4000);
  } catch (err) {
    console.warn('PR-widget valgfri, sprang over:', err);
  }
}

// --- comments ---
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

// --- render (SAFE: ingen splitting i kort) ---
function renderContentAsArticle(html, mount){
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';

  // fjern et evt. første H1 der duplikerer sidens titel
  const firstH1 = tmp.querySelector('h1');
  if (firstH1) firstH1.remove();

  // neutralisér styles der kan skubbe indholdet til højre
  tmp.querySelectorAll('p, ul, ol, h2, h3, h4, table, blockquote, div, figure, img').forEach(el => {
    el.style.float = 'none';
    el.style.clear = 'none';
    el.style.textAlign = 'left';
    el.style.marginLeft = '';
    el.style.marginRight = '';
    el.style.maxWidth = '100%';
  });

  // sentence-case på H2/H3-overskrifter
  tmp.querySelectorAll('h2, h3').forEach(h => {
    const t = (h.textContent || '').trim();
    h.textContent = sentenceCase(t);
  });

  const article = document.createElement('article');
  article.className = 'card bg-white p-6 mt-6';
  article.style.lineHeight = '1.7';
  article.style.color = '#1f2937';
  article.append(...Array.from(tmp.childNodes));
  mount.appendChild(article);
}

// --- init ---
async function init(){
  const slug = getSlug();
  const titleEl = qs('guideTitle');
  const introEl = qs('guideIntro');
  const metaEl  = qs('guideMeta');
  const breadEl = qs('breadcrumbTitle');
  const relatedEl = qs('relatedGuides');
  const commentList = qs('commentList');
  const commentText = qs('commentText');
  const commentSubmit = qs('commentSubmit');
  const commentHint = qs('commentHint');
  const contentMount = qs('guideContent');

  if (!slug){ titleEl.textContent = 'Slug mangler i URL'; return; }

  // hent guides
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

  // meta + sentence-case
  const niceTitle = sentenceCase(guide.title || '');
  const niceIntro = guide.intro ? sentenceCase(guide.intro) : '';

  document.title = `${niceTitle} – opskrift-drikke.dk`;
  breadEl.textContent = niceTitle;
  titleEl.textContent = niceTitle;
  introEl.textContent = niceIntro;
  metaEl.textContent = [guide.category, (guide.tags||[]).join(' · ')].filter(Boolean).join(' · ');

  // indhold som én artikel (stabil)
  contentMount.innerHTML = '';
  renderContentAsArticle(guide.content || '', contentMount);

  // relaterede
  const rel = guides.filter(g => g.slug !== guide.slug && g.category === guide.category).slice(0,5);
  relatedEl.innerHTML = rel.length
    ? rel.map(r => `<li><a class="hover:underline" href="/pages/guide.html?slug=${r.slug}">${sentenceCase(r.title)}</a></li>`).join('')
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

  // PR under kommentarer
  await safeMountPRWidget(guide);
}

document.addEventListener('DOMContentLoaded', init);
