// scripts/build-guides.mjs
// Generer 1000 unikke guides (DA), split i /data/guides-1..10.json (100 pr. fil)
// og skriv også en samlet /data/guides.json (fallback) + /sitemaps/sitemap-guides.xml

import fs from 'fs';
import path from 'path';

const COUNT          = 1000;
const CHUNK_SIZE     = 100;
const OUT_DIR        = 'data';
const OUT_JSON_MERGE = path.join(OUT_DIR, 'guides.json');
const SITE_ORIGIN    = 'https://www.opskrift-drikke.dk';
const SITEMAP_DIR    = 'sitemaps';
const SITEMAP_FILE   = path.join(SITEMAP_DIR, 'sitemap-guides.xml');

// ——— Kategorier/temaer ———
const CATS = [
  { key:'Kaffe', tags:['Espresso','Filter','Latte','Kværn','Skum'] },
  { key:'Te', tags:['Grøn te','Sort te','Urter','Temperatur','Trækketid'] },
  { key:'Smoothie', tags:['Protein','Grøn','Mætter','Fiber','Frysning'] },
  { key:'Juice', tags:['Gulerod','Ingefær','Citrus','Koldpresset','Frisk'] },
  { key:'Mocktails', tags:['Uden alkohol','Syrup','Urter','Is','Sodastream'] },
  { key:'Cocktails', tags:['Shaker','Oprøring','Syrup','Citrus','Is'] },
  { key:'Gløgg', tags:['Rødvin','Hvid gløgg','Krydderier','Servering','Opvarmning'] },
  { key:'Shots', tags:['Ingefærshots','Chili','Citron','Honning','Morgenrutine'] },
  { key:'Udstyr', tags:['Blender','Slowjuicer','Kaffemaskine','Kedel','Vægt'] },
  { key:'Barteknik', tags:['Ryst','Rør','Smag','Batch','Sanitet'] },
  { key:'Ernæring', tags:['Kalorier','Protein','Fiber','Sukker','Sødemidler'] },
];

const TOPICS = {
  'Kaffe': [
    'espresso der sidder i skabet', 'filterkaffe som café', 'latte art for begyndere',
    'kværn: indstilling og bønner', 'mælkeskum uden dyr maskine'
  ],
  'Te': [
    'grøn te uden bitterhed', 'sort te med fylde', 'urteblandinger der virker',
    'vandtemperatur og tid', 'koldbryg te'
  ],
  'Smoothie': [
    'smoothies der mætter', 'proteinrige smoothies', 'grøn smoothie uden bismag',
    'frysning og meal-prep', 'smoothie til børn'
  ],
  'Juice': [
    'gulerodsjuice med sødme', 'ingefærjuice uden brænd', 'citrusjuice til brunch',
    'koldpresset hjemme', 'saft uden sukker'
  ],
  'Mocktails': [
    'sprøde mocktails til fest', 'sirupper og sodastream', 'glas og is til mocktails',
    'balancer sødme og syre', 'friske urter i mocktails'
  ],
  'Cocktails': [
    'shaker basics', 'oprøring vs rystning', 'hjemmelavet simple syrup',
    'citrus: pres og strain', 'klar is der ser pro ud'
  ],
  'Gløgg': [
    'klassisk rødvinsgløgg', 'hvid gløgg med æble', 'krydderiblanding der dufter',
    'servering til mange', 'alkoholfri gløgg'
  ],
  'Shots': [
    'ingefærshots der virker', 'chili og citron', 'sødemidler og holdbarhed',
    'shots uden juicer', 'morgenrutine med shots'
  ],
  'Udstyr': [
    'vælg den rigtige blender', 'slowjuicer – hvad skal du vælge',
    'kaffemaskine til hverdagen', 'elkedel med temperatur', 'måleskeer og småting'
  ],
  'Barteknik': [
    'rysteteknik trin for trin', 'oprøring til klarhed', 'smagning og justering',
    'forbered sirup i batches', 'sanitet og is-håndtering'
  ],
  'Ernæring': [
    'kalorier i drikke', 'protein og mæthed', 'fiber fra frugt og grønt',
    'sukker kontra sødemidler', 'snacks i flydende form'
  ]
};

// ——— helpers ———
const fold = s => (s||'').toLowerCase()
  .replace(/[æÆ]/g,'ae').replace(/[øØ]/g,'oe').replace(/[åÅ]/g,'aa')
  .replace(/\s+/g,' ').trim();

function sentenceCase(s=''){
  s = fold(s);
  if (!s) return s;
  s = s.replace(/(^|[.!?]\s+|:\s+|\(\s*)([a-zæøå])/g, (_,p1,p2)=> p1 + p2.toUpperCase());
  s = s.replace(/\s*:\s*/g, ': ');
  return s;
}

function slugify(s){
  return fold(s).replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-');
}

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function sectionH2(t){ return `<h2>${sentenceCase(t)}</h2>`; }

function buildContent(cat, topic){
  const tips = [
    'smag undervejs og juster syre/sødme', 'skriv ratioer ned når noget virker',
    'køl glas ned for bedre mundfølelse', 'friske råvarer giver størst forskel',
    'opbevar sirupper på køl i rene flasker'
  ];
  const faq = [
    ['kan jeg lave det uden særligt udstyr?', 'ja, start simpelt og opgrader senere.'],
    ['hvor længe kan det holde sig?', 'typisk 2–3 dage på køl i ren flaske.'],
    ['smagen er flad – hvad gør jeg?', 'tilføj syre eller en knivspids salt.']
  ];

  return [
    sectionH2(`${cat}: ${topic}`),
    `<p>her får du en praktisk gennemgang af ${topic} i kategorien ${cat.toLowerCase()}. målet er, at du lykkes i hverdagen uden dyre indkøb.</p>`,
    sectionH2('sådan kommer du i gang'),
    `<ol>
      <li>forstå sødt/surt/bittert/salt.</li>
      <li>arbejd småt og smag efter hvert trin.</li>
      <li>brug koldt filtreret vand hvor det giver mening.</li>
    </ol>`,
    sectionH2('det skal du bruge'),
    `<ul>
      <li>råvarer til ${topic}</li>
      <li>skarp kniv og skærebræt</li>
      <li>måleskeer eller digitalvægt</li>
    </ul>`,
    sectionH2('trin for trin'),
    `<ol>
      <li>forbered og mål af.</li>
      <li>bland efter enkel grundratio (fx 2:1:1).</li>
      <li>justér syre/sødme og konsistens.</li>
    </ol>`,
    sectionH2('fejlfinding og tips'),
    `<ul>
      <li>${pick(tips)}</li>
      <li>${pick(tips)}</li>
      <li>${pick(tips)}</li>
    </ul>`,
    sectionH2('ofte stillede spørgsmål'),
    `<div>
      ${faq.map(([q,a])=>`<p><strong>${sentenceCase(q)}</strong><br>${a}</p>`).join('')}
    </div>`
  ].join('\n');
}

function makeGuide(idx){
  const cat = pick(CATS).key;
  const topic = pick(TOPICS[cat]);
  const title = sentenceCase(topic);
  const intro = sentenceCase(`en praktisk guide til ${topic} i kategorien ${cat}.`);
  const slug = `${slugify(topic)}-${String(idx).padStart(4,'0')}`;
  const content = buildContent(cat, topic);
  const tagPool = new Set([cat, ...topic.split(' ').slice(0,2)]);
  return {
    title, slug, intro, category: cat, tags: Array.from(tagPool), content
  };
}

function buildAll(n=COUNT){
  const out = [];
  const titles = new Set();
  const slugs  = new Set();

  let i = 1;
  while(out.length < n){
    const g = makeGuide(i);
    // unikhed: titel+slug
    if (titles.has(fold(g.title)) || slugs.has(fold(g.slug))) continue;
    titles.add(fold(g.title)); slugs.add(fold(g.slug));
    out.push(g); i++;
  }
  return out;
}

function ensureDirs(){
  fs.mkdirSync(OUT_DIR, { recursive:true });
  fs.mkdirSync(SITEMAP_DIR, { recursive:true });
}

function writeChunks(items){
  // samlet fallback
  fs.writeFileSync(OUT_JSON_MERGE, JSON.stringify(items, null, 2), 'utf8');
  // split i 100 stk
  const pages = Math.ceil(items.length / CHUNK_SIZE);
  for (let p=0; p<pages; p++){
    const slice = items.slice(p*CHUNK_SIZE, (p+1)*CHUNK_SIZE);
    fs.writeFileSync(path.join(OUT_DIR, `guides-${p+1}.json`), JSON.stringify(slice, null, 2), 'utf8');
  }
}

function writeSitemap(items){
  const urls = items.map(g => `
  <url>
    <loc>${SITE_ORIGIN}/pages/guide.html?slug=${g.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  fs.writeFileSync(SITEMAP_FILE, xml, 'utf8');
}

function main(){
  ensureDirs();
  const items = buildAll(COUNT);
  writeChunks(items);
  writeSitemap(items);
  console.log(`✔ Skrev ${items.length} guides → ${Math.ceil(items.length/CHUNK_SIZE)} filer i /data + samlet guides.json`);
  console.log(`✔ Sitemap: ${SITEMAP_FILE}`);
}
main();
