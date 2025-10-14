// /js/guide-page.js
// Loader guides (chunket el. fallback), finder slug og forbedrer layout så FAQ står for sig selv.

function sentenceCase(str=''){
  let s = (str || '').replace(/\s+/g,' ').trim().toLowerCase();
  if (!s) return s;
  s = s.replace(/(^|[.!?]\s+|:\s+|\(\s*)([a-zæøå])/g, (_,p1,p2)=> p1 + p2.toUpperCase());
  s = s.replace(/\s*:\s*/g, ': ');
  return s;
}

const V = 'guides-v1'; // bump hvis du opdaterer data
const j = (p) => fetch(`${p}?${V}`, { cache:'no-cache' }).then(r=>r.json());

async function loadAllGuides(){
  try {
    const first = await j('/data/guides-1.json');
    if (Array.isArray(first) && first.length){
      let all = [...first];
      for (let i=2;i<=20;i++){
        try{
          const arr = await j(`/data/guides-${i}.json`);
          if (!Array.isArray(arr) || !arr.length) break;
          all = all.concat(arr);
        }catch{ break; }
      }
      return all;
    }
  } catch { /* fallback */ }
  return await j('/data/guides.json');
}

function getSlug(){
  const p = new URLSearchParams(location.search);
  return (p.get('slug')||'').trim();
}

function enhanceGuideContent(root){
  // find “ofte stillede spørgsmål” overskriften
  const h2s = [...root.querySelectorAll('h2')];
  const faqH2 = h2s.find(h => /ofte\s+stillede\s+spørgsmål/i.test(h.textContent || ''));
  if (!faqH2) return;

  // lav en separat kort-sektion i siden
  let faqWrap = document.getElementById('faqWrap');
  if (!faqWrap){
    faqWrap = document.createElement('section');
    faqWrap.id = 'faqWrap';
    faqWrap.className = 'faq-card mt-6';
    // indsæt efter artiklen (eller hvor du vil have den)
    root.parentElement.appendChild(faqWrap);
  }

  // flyt FAQ-overskrift og alle søskende derefter over i faqWrap
  const frag = document.createDocumentFragment();
  frag.appendChild(faqH2);
  let n = faqH2.nextSibling;
  while (n){
    const next = n.nextSibling;
    frag.appendChild(n);
    n = next;
  }
  faqWrap.innerHTML = ''; // reset
  faqWrap.appendChild(frag);

  // lav <p><strong>Q</strong><br>A</p> om til details/summary
  const ps = [...faqWrap.querySelectorAll('p')];
  const items = [];
  ps.forEach(p=>{
    const strong = p.querySelector('strong');
    if (!strong) return;
    const q = strong.textContent.trim().replace(/[:\s]+$/,'');
    // svar = alt i p, efter <strong>...</strong><br>
    const html = p.innerHTML || '';
    const after = html.split('</strong>')[1] || '';
    const ans = after.replace(/^<br\s*\/?>/i,'').trim();
    const details = document.createElement('details');
    details.className = 'faq-item';
    const summary = document.createElement('summary');
    summary.textContent = sentenceCase(q);
    const body = document.createElement('div');
    body.className = 'mt-2 opacity-90';
    body.innerHTML = ans || '';
    details.appendChild(summary);
    details.appendChild(body);
    items.push({ orig:p, node:details });
  });
  // erstat p’erne med details
  items.forEach(({orig,node})=> orig.replaceWith(node));

  // hvis ingen items blev lavet, behold bare teksten
}

function renderGuide(g){
  const titleEl = document.getElementById('guideTitle');
  const introEl = document.getElementById('guideIntro');
  const bodyEl  = document.getElementById('guideContent');

  document.title = `${g.title} – opskrift-drikke.dk`;
  titleEl.textContent = sentenceCase(g.title||'Guide');
  introEl.textContent = sentenceCase(g.intro||'');
  bodyEl.classList.add('guide-article');
  bodyEl.innerHTML = g.content || '';

  // forbedr layout for FAQ
  enhanceGuideContent(bodyEl);
}

async function init(){
  const slug = getSlug();
  const titleEl = document.getElementById('guideTitle');
  const bodyEl  = document.getElementById('guideContent');
  if (!slug){ titleEl.textContent='Slug mangler'; return; }

  let data = [];
  try {
    data = await loadAllGuides();
  } catch(e){
    titleEl.textContent = 'Kunne ikke indlæse guides';
    console.error(e);
    return;
  }

  const g = data.find(x => (x.slug||'') === slug);
  if (!g){
    titleEl.textContent = 'Guide ikke fundet';
    bodyEl.innerHTML = '<p class="opacity-70">Prøv at gå tilbage til <a class="underline" href="/pages/guides.html">guides</a>.</p>';
    return;
  }

  renderGuide(g);
}

document.addEventListener('DOMContentLoaded', init);
