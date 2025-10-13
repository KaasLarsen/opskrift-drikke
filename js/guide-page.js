// /js/guide-page.js
import { currentUser } from './auth.js';
import { showToast } from './app.js';

// ---------- utils ----------
const qs = (id) => document.getElementById(id);
const getSlug = () => (new URLSearchParams(location.search).get('slug') || '').trim();

// Ægte sentence case: stort første bogstav i starten OG efter . ! ? :
function sentenceCase(str = '') {
  let s = (str || '').replace(/\s+/g, ' ').trim();
  if (!s) return s;

  // lav alt til små bogstaver
  s = s.toLowerCase();

  // stort bogstav i starten og efter sætnings-skilletegn
  s = s.replace(/(^|[.!?:]\s+|\(\s*)([a-zæøå])/g, (_, p1, p2) => p1 + p2.toUpperCase());

  // fjern dobbeltmellemrum omkring kolon (kosmetik)
  s = s.replace(/\s*:\s*/g, ': ');

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

    rotator.mountPRByKey('#pr-guide-slot', key);

    // mild fallback hvis script blokeres
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
function renderStructuredContent(html, mount, pageTitle){
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';

  // 0) fjern et evt. første H1, især hvis det duplikerer sidenavnet
  const firstH1 = tmp.querySelector('h1');
  if (firstH1) {
    const h1txt = (firstH1.textContent || '').trim().toLowerCase();
    const pgtxt = (pageTitle || '').trim().toLowerCase();
    if (h1txt === pgtxt || h1txt.replace(/[:\-–—]\s*.*/, '') === pgtxt) {
      firstH1.remove();
    }
  }

  // 1) neutralisér “skæve” styles der kan skubbe indholdet til højre
  tmp.querySelectorAll('p, ul, ol, h2, h3, h4, table, blockquote, div, figure, img').forEach(el => {
    el.style.float = 'none';
    el.style.clear = 'none';
    el.style.textAlign = 'left';
    el.style.marginLeft = '';
    el.style.marginRight = '';
    el.style.maxWidth = '100%';
  });

  const children = Array.from(tmp.childNodes);
  const sections = [];
  let buffer = [];

  const flush = (titleNode) => {
    const hasContent = buffer.some(n =>
      (n.nodeType === 1 && n.tagName !== 'H2') ||
      (n.nodeType === 3 && n.textContent.trim())
    );
    if (!titleNode && !hasContent) { buffer = []; return; }

    const card = document.createElement('div');
    card.className = 'card bg-white p-6 mt-6';

    if (titleNode) {
      // sikre sentence case på overskriften
      titleNode.textContent = sentenceCase(titleNode.textContent || '');
      card.appendChild(titleNode);
    }

    // wrap indhold i en “prose”-agtig container
    const body = document.createElement('div');
    body.style.lineHeight = '1.7';
    body.style.color = '#1f2937';
    body.style.marginTop = titleNode ? '10px' : '0';

    buffer.forEach(n => body.appendChild(n));
    card.appendChild(body);

    sections.push(card);
    buffer = [];
  };

  const toc = [];

  children.forEach(node => {
    if (node.nodeType === 1 && node.tagName === 'H2'){
      // luk forrige sektion
      flush();

      // ID + kopi af H2 (sentence-case)
      const id = (node.textContent || '').trim()
        .toLowerCase()
        .replace(/[^\w\s\-æøåÆØÅ]/g,'')
        .replace(/\s+/g,'-');

      const h2 = document.createElement('h2');
      h2.className = 'text-xl font-medium';
      h2.id = id;
      h2.textContent = sentenceCase(node.textContent || '');

      toc.push({ id, label: h2.textContent });

      // start ny sektion
      flush(h2);
    } else {
      buffer.push(node);
    }
  });
  flush(); // sidste sektion

  // ingen H2 → alt i ét card
  if (!sections.length){
    const only = document.createElement('div');
    only.className = 'card bg-white p-6 mt-6';
    const body = document.createElement('div');
    body.style.lineHeight = '1.7';
    body.style.color = '#1f2937';
    body.innerHTML = tmp.innerHTML || '';
    only.appendChild(body);
    mount.appendChild(only);
  } else {
    sections.forEach(s => mount.appendChild(s));
  }

  // TOC hvis mere end én sektion
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
  renderStructuredContent(guide.content || '', contentMount, niceTitle);

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
