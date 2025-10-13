// /js/guide-page.js
import { currentUser } from './auth.js';
import { showToast } from './app.js';

// ---------- utils ----------
const qs = (id) => document.getElementById(id);
const getSlug = () => (new URLSearchParams(location.search).get('slug') || '').trim();

function sentenceCase(str = '') {
  // drop leading/trailing, collapse spaces
  let s = (str || '').replace(/\s+/g, ' ').trim();
  if (!s) return s;
  // lav alt til små bogstaver, hæv første bogstav
  s = s.toLowerCase();
  s = s.charAt(0).toUpperCase() + s.slice(1);

  // efter kolon/parentes: gør første ord småt hvis det ikke er egennavn (heuristik)
  s = s.replace(/(:\s*)([A-ZÆØÅ])/g, (_, p1, p2) => p1 + p2.toLowerCase());
  s = s.replace(/(\()\s*([A-ZÆØÅ])/g, (_, p1, p2) => p1 + p2.toLowerCase());

  return s;
}

// ---------- PriceRunner under kommentarer ----------
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

    const slotSel = '#pr-guide-slot';
    rotator.mountPRByKey(slotSel, key);

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
    console.warn('PriceRunner-widget (guide) valgfrit, sprang over:', err);
  }
}

// ---------- kommentarer ----------
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

// ---------- strukturér indhold ----------
function renderStructuredContent(html, mount){
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';

  // neutralisér “skæve” styles fra WYSIWYG så teksten ikke skubber til højre
  tmp.querySelectorAll('p, ul, ol, h2, h3, h4, table, blockquote, div, figure').forEach(el => {
    el.style.float = 'none';
    el.style.textAlign = 'left';
    el.style.marginLeft = '';
    el.style.marginRight = '';
    el.style.maxWidth = 'unset';
  });

  const children = Array.from(tmp.childNodes);
  const sections = [];
  let buffer = [];

  const flush = (titleNode) => {
    // ignorér helt tom sektion
    const hasContent = buffer.some(n => (n.nodeType === 1 && n.tagName !== 'H2') || (n.nodeType === 3 && n.textContent.trim()));
    if (!titleNode && !hasContent) { buffer = []; return; }

    const card = document.createElement('div');
    card.className = 'card bg-white p-6 mt-6';
    if (titleNode) card.appendChild(titleNode);
    buffer.forEach(n => card.appendChild(n));
    sections.push(card);
    buffer = [];
  };

  // lav indholdsfortegnelse
  const toc = [];

  children.forEach(node => {
    if (node.nodeType === 1 && node.tagName === 'H2'){
      // luk foregående sektion
      flush();
      // lav ID + kopi af H2
      const id = (node.textContent || '').trim()
        .toLowerCase()
        .replace(/[^\w\s\-æøåÆØÅ]/g,'')
        .replace(/\s+/g,'-');
      const h2 = document.createElement('h2');
      h2.className = 'text-xl font-medium';
      h2.id = id;
      h2.textContent = sentenceCase(node.textContent || '');
      toc.push({ id, label: h2.textContent });
      // start ny sektion med denne H2
      flush(h2);
    } else {
      buffer.push(node);
    }
  });
  flush(); // sidste sektion

  // hvis ingen H2 → alt i ét card
  if (!sections.length){
    const only = document.createElement('div');
    only.className = 'card bg-white p-6 mt-6';
    only.innerHTML = tmp.innerHTML || '';
    mount.appendChild(only);
  } else {
    sections.forEach(s => mount.appendChild(s));
  }

  // vis TOC hvis der er flere sektioner
  const tocWrap = qs('tocWrap');
  const tocEl = qs('toc');
  if (toc.length > 1){
    tocWrap.classList.remove('hidden');
    tocEl.innerHTML = toc.map(t => `<a href="#${t.id}">${t.label}</a>`).join('');
  } else {
    tocWrap.classList.add('hidden');
  }
}

// ---------- init ----------
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

  // indhold i sektioner
  contentMount.innerHTML = '';
  renderStructuredContent(guide.content || '', contentMount);

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
