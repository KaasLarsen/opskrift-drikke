// /js/guide-page.js
import { loadAllGuides } from './guides.js';

// helpers
const $ = (id) => document.getElementById(id);
const slugFromUrl = () => new URLSearchParams(location.search).get('slug') || '';
const estReadMin = (html) => {
  // grov estimering: 900 tegn ~ 1 minut
  const text = html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const mins = Math.max(1, Math.round(text.length / 900));
  return `${mins} min læsning`;
};

function iconFor(title=''){
  const t = title.toLowerCase();
  if (t.includes('intro')) return 'sparkles';
  if (t.includes('det skal du bruge')) return 'tools';
  if (t.includes('sådan gør du')) return 'list-checks';
  if (t.includes('fejl')) return 'alert-triangle';
  if (t.includes('variation')) return 'shuffle';
  if (t.includes('opsummer')) return 'check-circle-2';
  return 'book-open';
}

function makeSectionCard(h2Text, innerHTML){
  const icon = iconFor(h2Text);
  return `
    <section class="card bg-white p-6" id="${h2Text.toLowerCase().replace(/[^a-z0-9]+/g,'-')}">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 opacity-80"><use href="/assets/icons.svg#${icon}"/></svg>
        <h2 class="text-xl font-medium">${h2Text}</h2>
      </div>
      <div class="prose prose-stone max-w-none mt-3">
        ${innerHTML}
      </div>
    </section>`;
}

function buildTOC(sections){
  return sections.map(s => {
    const id = s.id;
    const text = s.querySelector('h2')?.textContent || 'Sektion';
    return `<a href="#${id}" class="block hover:underline">${text}</a>`;
  }).join('');
}

function activateTOC(){
  const toc = $('toc');
  if (!toc) return;
  const links = [...toc.querySelectorAll('a')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href')));
  const onScroll = () => {
    let iTop = 0;
    for (let i=0;i<sections.length;i++){
      const r = sections[i]?.getBoundingClientRect();
      if (r && r.top <= 120) iTop = i;
    }
    links.forEach((a,idx)=>a.classList.toggle('active', idx===iTop));
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function buildSchema(g){
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": g.title,
    "about": g.category,
    "author": { "@type": "Person", "name": g.author || "Redaktionen" },
    "datePublished": new Date().toISOString().slice(0,10),
    "dateModified": new Date().toISOString().slice(0,10),
    "inLanguage": "da-DK",
    "publisher": { "@type": "Organization", "name": "opskrift-drikke.dk" },
    "articleSection": g.tags || [],
    "description": g.intro,
    "mainEntityOfPage": location.href
  };
}

async function init(){
  const slug = slugFromUrl();
  const tEl   = $('guideTitle');
  const bcEl  = $('breadcrumbTitle');
  const catEl = $('guideCategory');
  const tagsEl= $('guideTags');
  const readEl= $('guideReading');
  const rateEl= $('guideRating');
  const intro = $('guideIntro');
  const contentWrap = $('guideContentWrap');
  const content = $('guideContent');
  const toc = $('toc');
  const facts = $('quickFacts');
  const ld = $('ld_json');

  if (!slug){ tEl.textContent = 'Guide mangler slug i url'; return; }

  let all=[];
  try { all = await loadAllGuides(); }
  catch { tEl.textContent = 'Kunne ikke indlæse guides'; return; }

  const g = all.find(x => (x.slug||'').toLowerCase() === slug.toLowerCase());
  if (!g){ tEl.textContent = 'Guide ikke fundet'; return; }

  // meta
  document.title = `${g.title} – opskrift-drikke.dk`;
  tEl.textContent = g.title;
  bcEl.textContent = g.title;
  catEl.textContent = g.category || 'Guide';
  rateEl.innerHTML = `${g.rating?.toFixed?.(1) || '5.0'} ★ <span class="opacity-70">(${g.reviews||0})</span>`;

  // badges (tags)
  tagsEl.innerHTML = (g.tags||[]).slice(0,4).map(t => `<span class="badge">${t}</span>`).join('');

  // intro + læsetid
  intro.textContent = g.intro || '';
  readEl.textContent = estReadMin(g.content||'');

  // render sections som “rune bokse”
  // g.content er HTML med <h2> sektioner -> split dem
  content.innerHTML = g.content || '';
  const h = document.createElement('div');
  h.innerHTML = content.innerHTML;

  // samle sektioner: hver <h2> + efterfølgende elementer indtil næste <h2>
  const nodes = [...h.childNodes];
  const sectionCards = [];
  let cur = null;
  for (const n of nodes){
    if (n.nodeType === 1 && n.tagName === 'H2'){
      if (cur) sectionCards.push(cur);
      cur = { title: n.textContent, html: '' };
    } else {
      if (cur) cur.html += n.outerHTML || n.textContent || '';
    }
  }
  if (cur) sectionCards.push(cur);

  // injicer kort i DOM
  let htmlOut = '';
  for (const s of sectionCards){
    htmlOut += makeSectionCard(s.title, s.html);
  }
  contentWrap.insertAdjacentHTML('beforeend', htmlOut);

  // TOC
  const sectionEls = [...contentWrap.querySelectorAll('section[id]')];
  toc.innerHTML = buildTOC(sectionEls);
  activateTOC();

  // Quick facts
  facts.innerHTML = `
    <li><strong>Forfatter:</strong> ${g.author || 'Redaktionen'}</li>
    <li><strong>Kategori:</strong> ${g.category || '-'}</li>
    <li><strong>Tags:</strong> ${(g.tags||[]).slice(0,5).join(', ') || '-'}</li>
    <li><strong>Vurdering:</strong> ${g.rating?.toFixed?.(1) || '5.0'} (${g.reviews||0})</li>
  `;

  // Schema.org Article
  ld.textContent = JSON.stringify(buildSchema(g));
}

document.addEventListener('DOMContentLoaded', init);
