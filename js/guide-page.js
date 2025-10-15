// === guide-page.js — detaljeret guide-visning (robust slug) ===
import { loadAllGuides, renderGuideCard } from '/js/guides.js';

function getSlug(){
  const u = new URL(location.href);
  let s = u.searchParams.get('slug') ||
          decodeURIComponent((location.pathname.split('/').pop() || '').replace(/^guide(\.html)?$/i,''));
  // Rens slug for tilfældige tegn fra kopi/URL (f.eks. trailing ? eller #)
  s = String(s || '').trim().replace(/[?#]+$/g,'');
  return s;
}

function html(strings, ...vals){ return strings.map((s,i)=>s+(vals[i]??'')).join(''); }

function renderGuide(g, all){
  const root = document.getElementById('guideRoot');
  if (!root) return;

  const tags = (g.tags || []).slice(0,6).map(t =>
    `<span class="inline-flex text-[11px] px-2 py-0.5 rounded-full border border-orange-200 text-orange-700 bg-orange-50">${t}</span>`
  ).join(' ');

  const bodyHTML =
    g.html || g.content ||
    (Array.isArray(g.blocks) ? g.blocks.map(b=>`<p>${b}</p>`).join('') :
    (Array.isArray(g.paragraphs) ? g.paragraphs.map(p=>`<p>${p}</p>`).join('') : '<p>—</p>'));

  root.innerHTML = html`
    <article class="card border bg-white rounded-2xl p-4 md:p-6">
      <h1 class="text-2xl md:text-3xl font-semibold leading-snug">${g.title || 'Uden titel'}</h1>
      ${g.subtitle ? `<p class="mt-2 text-stone-700">${g.subtitle}</p>` : ''}
      <div class="mt-2 flex flex-wrap gap-2">${tags}</div>
      <div class="prose prose-stone max-w-none mt-6 text-[15px] leading-relaxed">${bodyHTML}</div>
    </article>

    <aside class="mt-6">
      <div class="card border bg-white rounded-2xl p-4">
        <h3 class="font-semibold mb-1">Relaterede guides</h3>
        <div id="relatedGuides" class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"></div>
      </div>
    </aside>
  `;

  const relSlot = document.getElementById('relatedGuides');
  if (relSlot){
    const t0 = (g.tags || [])[0];
    const rel = t0
      ? all.filter(x => (x.slug||x.id)!==(g.slug||g.id) && (x.tags||[]).includes(t0))
      : all.filter(x => (x.slug||x.id)!==(g.slug||g.id));
    relSlot.innerHTML = rel.slice(0,6).map(renderGuideCard).join('');
  }
}

async function mountGuide(){
  const root = document.getElementById('guideRoot');
  if (!root) return;
  root.innerHTML = `<div class="card border bg-white rounded-2xl p-4 md:p-6"><h1 class="text-3xl font-semibold">Indlæser…</h1></div>`;

  try{
    const slug = getSlug();
    const all  = await loadAllGuides();
    const g    = all.find(x => (x.slug || x.id) === slug);
    if(!g){
      root.innerHTML = `<div class="card border bg-white rounded-2xl p-4 md:p-6">Kunne ikke finde guiden: <code>${slug}</code>.</div>`;
      return;
    }
    renderGuide(g, all);
  }catch(e){
    console.error('[guide-page] fejl', e);
    root.innerHTML = `<div class="card border bg-white rounded-2xl p-4 md:p-6">Noget gik galt ved indlæsning.</div>`;
  }
}
document.addEventListener('DOMContentLoaded', mountGuide);
