// /js/pricerunner-rotator.js
// — Home-karussel med pile + kategori-specifik visning pr. key —

// 1) Home-karussel (de 3 du allerede har)
const WIDGETS_HOME = [
  {
    id: 'pr-product-widget-5ef258a0',
    src: 'https://api.pricerunner.com/publisher-widgets/dk/product.js?onlyInStock=true&offerOrigin=NATIONAL&offerLimit=4&productId=3385670828&partnerId=adrunner_dk_opskrift-drikke&widgetId=pr-product-widget-5ef258a0',
    link: 'https://www.pricerunner.dk/pl/84-3385670828/Blendere/Ninja-Detect-TB301EU-Blender-Pro-Sammenlign-Priser'
  },
  {
    id: 'pr-product-widget-7b9e4810',
    src: 'https://api.pricerunner.com/publisher-widgets/dk/product.js?onlyInStock=true&offerOrigin=NATIONAL&offerLimit=4&productId=3673343&partnerId=adrunner_dk_opskrift-drikke&widgetId=pr-product-widget-7b9e4810',
    link: 'https://www.pricerunner.dk/pl/82-3673343/Kaffemaskiner/DeLonghi-Magnifica-S-ECAM-21.117.B-Sammenlign-Priser'
  },
  {
    id: 'pr-product-widget-8870c090',
    src: 'https://api.pricerunner.com/publisher-widgets/dk/product.js?onlyInStock=true&offerOrigin=NATIONAL&offerLimit=4&productId=3299718083&partnerId=adrunner_dk_opskrift-drikke&widgetId=pr-product-widget-8870c090',
    link: 'https://www.pricerunner.dk/pl/84-3299718083/Blendere/Nutribullet-Pro-900-NB907MAB-Sammenlign-Priser'
  }
];

// 2) Kategori-/tag-specifikke widgets (bruges på opskrift/guide med key)
const WIDGETS_KEYED = [
  // Smoothie
  { key:'blender-ninja-1',       divId:'prw-blender-ninja-1',       productId:'3385670828',
    link:'https://www.pricerunner.dk/pl/84-3385670828/Blendere/Ninja-Detect-TB301EU-Blender-Pro-Sammenlign-Priser' },
  { key:'blender-nutribullet-1', divId:'prw-blender-nutribullet-1', productId:'3299718083',
    link:'https://www.pricerunner.dk/pl/84-3299718083/Blendere/Nutribullet-Pro-900-NB907MAB-Sammenlign-Priser' },
  { key:'blender-wilfa-1',       divId:'prw-blender-wilfa-1',       productId:'3389596724',
    link:'https://www.pricerunner.dk/pl/84-3389596724/Blendere/Wilfa-BLPS-1000S-Sammenlign-Priser' },

  // Shots / Juice
  { key:'slowjuicer-philips-1',  divId:'prw-slowjuicer-philips-1',  productId:'4334296',
    link:'https://www.pricerunner.dk/pl/83-4334296/Juicere/Philips-Viva-Collection-HR1889-Sammenlign-Priser' },
  { key:'citrus-braun-1',        divId:'prw-citrus-braun-1',        productId:'2988785',
    link:'https://www.pricerunner.dk/pl/83-2988785/Juicere/Braun-CJ-3050-Sammenlign-Priser' },
  { key:'citrus-solis-1',        divId:'prw-citrus-solis-1',        productId:'3206152439',
    link:'https://www.pricerunner.dk/pl/83-3206152439/Juicere/Solis-Citrus-Juicer-Typ-8453-Zitruspresse-Sammenlign-Priser' },

  // Kaffe
  { key:'kaffemaskine-delonghi-1', divId:'prw-kaffemaskine-delonghi-1', productId:'3673343',
    link:'https://www.pricerunner.dk/pl/82-3673343/Kaffemaskiner/DeLonghi-Magnifica-S-ECAM-21.117.B-Sammenlign-Priser' },
  { key:'kaffekvaern-timemore-1',  divId:'prw-kaffekvaern-timemore-1',  productId:'3414287640',
    link:'https://www.pricerunner.dk/pl/621-3414287640/Kaffekvaerne/Timemore-Chestnut-C2-Folded-White-Sammenlign-Priser' },
  { key:'maelkeskummer-severin-1', divId:'prw-maelkeskummer-severin-1', productId:'3208410769',
    link:'https://www.pricerunner.dk/pl/82-3208410769/Kaffemaskiner/Severin-SM-3588-Sammenlign-Priser' },

  // Te & varme
  { key:'kedel-hario-12',  divId:'prw-kedel-hario-12',  productId:'3364339',
    link:'https://www.pricerunner.dk/pl/68-3364339/Vandkedel/Hario-V60-Buono-Drip-1.2L-Sammenlign-Priser' },
  { key:'kedel-hario-10',  divId:'prw-kedel-hario-10',  productId:'4437701',
    link:'https://www.pricerunner.dk/pl/68-4437701/Vandkedel/Hario-V60-Buono-1L-Sammenlign-Priser' },
  { key:'kedel-hario-temp',divId:'prw-kedel-hario-temp',productId:'5178840',
    link:'https://www.pricerunner.dk/pl/68-5178840/Vandkedel/Hario-V60-Buono-80-with-Temperature-Sammenlign-Priser' },

  // Mocktails / Uden alkohol
  { key:'sodastream-duo-1', divId:'prw-sodastream-duo-1', productId:'3200852682',
    link:'https://www.pricerunner.dk/pl/1312-3200852682/Sodavandsmaskiner/SodaStream-Duo-with-carbon-dioxide-cylinder-Sammenlign-Priser' },
  { key:'sodastream-duo-2', divId:'prw-sodastream-duo-2', productId:'3335407774',
    link:'https://www.pricerunner.dk/pl/1312-3335407774/Sodavandsmaskiner/SodaStream-Duo-White-2-Bottles-Sammenlign-Priser' },
  { key:'sodastream-duo-3', divId:'prw-sodastream-duo-3', productId:'3203547039',
    link:'https://www.pricerunner.dk/pl/1312-3203547039/Sodavandsmaskiner/SodaStream-Duo-Titan-without-CO2-Cylinder-Sammenlign-Priser' },

  // Cocktails
  { key:'boston-zone-1',     divId:'prw-boston-zone-1',     productId:'3200061470',
    link:'https://www.pricerunner.dk/pl/461-3200061470/Koekkentilbehoer/Zone-Denmark-Rocks-Boston-Cocktailshaker-29.5cm-Sammenlign-Priser' },
  { key:'boston-pro-1',      divId:'prw-boston-pro-1',      productId:'4980783',
    link:'https://www.pricerunner.dk/pl/461-4980783/Koekkentilbehoer/Boston-Professional-Cocktailshaker-80cl-17.5cm-Sammenlign-Priser' },
  { key:'boston-barcraft-1', divId:'prw-boston-barcraft-1', productId:'3762756',
    link:'https://www.pricerunner.dk/pl/461-3762756/Koekkentilbehoer/Boston-Bar-Craft-Boston-Cocktail-Cocktailshaker-65cl-Sammenlign-Priser' },

  // Gløgg
  { key:'stanley-termoflaske-1', divId:'prw-stanley-termoflaske-1', productId:'5044186',
    link:'https://www.pricerunner.dk/pl/461-5044186/Koekkentilbehoer/Stanley-Classic-Termoflaske-1L-Sammenlign-Priser' },
  { key:'gryde-tefal-5l',        divId:'prw-gryde-tefal-5l',        productId:'3200022122',
    link:'https://www.pricerunner.dk/pl/1266-3200022122/Kasseroller-Stegepander/Tefal-Nordica-med-laag-24cm-Sammenlign-Priser' },
  { key:'gryde-dorre-5l',        divId:'prw-gryde-dorre-5l',        productId:'3276645688',
    link:'https://www.pricerunner.dk/pl/1266-3276645688/Kasseroller-Stegepander/Dorre-Karla-Gryde-5-L-med-laag-24cm-Sammenlign-Priser' }
];

// ---------- Home-karussel (pile) ----------
let currentHome = 0;

function clear(node){ while(node.firstChild) node.removeChild(node.firstChild); }

function createHomeFrame(w){
  const holder = document.createElement('div');
  holder.id = w.id;
  holder.style.display = 'block';
  holder.style.width = '100%';

  const s = document.createElement('script');
  s.type = 'text/javascript';
  s.async = true;
  s.src = w.src;
  document.body.appendChild(s);

  const disc = document.createElement('div');
  disc.style.display = 'inline-block';
  disc.innerHTML = `
    <a href="${w.link}" rel="nofollow">
      <p style="font:14px 'Klarna Text', Helvetica, sans-serif; font-style:italic; color:#444; text-decoration:underline;">
        Annonce i samarbejde med <span style="font-weight:bold">PriceRunner</span>
      </p>
    </a>`;

  const wrap = document.createElement('div');
  wrap.appendChild(holder);
  wrap.appendChild(disc);
  return wrap;
}

function renderHome(slot, idx){
  clear(slot);
  const w = WIDGETS_HOME[idx];

  const card = document.createElement('div');
  card.className = 'card bg-white p-4 border rounded-2xl relative';

  const label = document.createElement('div');
  label.className = 'text-sm opacity-70 mb-2';
  label.textContent = 'Annonce i samarbejde med PriceRunner';
  card.appendChild(label);
  card.appendChild(createHomeFrame(w));

  const left = document.createElement('button');
  left.innerHTML = '◀';
  left.className = 'absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-500 text-2xl';
  left.onclick = () => { currentHome = (currentHome - 1 + WIDGETS_HOME.length) % WIDGETS_HOME.length; renderHome(slot, currentHome); };

  const right = document.createElement('button');
  right.innerHTML = '▶';
  right.className = 'absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-500 text-2xl';
  right.onclick = () => { currentHome = (currentHome + 1) % WIDGETS_HOME.length; renderHome(slot, currentHome); };

  card.appendChild(left);
  card.appendChild(right);
  slot.appendChild(card);
}

// offentlige funktioner
export function mountPRHome(selector = '#pr-home-slot'){
  const slot = document.querySelector(selector);
  if (!slot) return;
  const io = new IntersectionObserver((entries, obs)=>{
    if (entries.some(e=>e.isIntersecting)){ obs.disconnect(); renderHome(slot, currentHome); }
  }, { rootMargin:'200px' });
  io.observe(slot);
}

// bagudkompatibel alias (din forside kalder måske mountPR)
export const mountPR = mountPRHome;

// ---------- Kategori/guide: vis bestemt key ----------
function widgetByKey(key){ return WIDGETS_KEYED.find(w => w.key === key); }

export function mountPRByKey(selector, key){
  const slot = document.querySelector(selector);
  if (!slot) return;
  const chosen = widgetByKey(key);
  if (!chosen) return;

  slot.innerHTML = `
    <div class="card bg-white p-4 border rounded-2xl">
      <div class="text-sm opacity-70 mb-2">Annonce i samarbejde med PriceRunner</div>
      <div id="${chosen.divId}" style="display:block;width:100%"></div>
      <div style="display:inline-block;margin-top:4px">
        <a href="${chosen.link}" rel="nofollow">
          <p style="font:14px 'Klarna Text', Helvetica, sans-serif; font-style:italic; color:#444; text-decoration:underline;">
            Annonce i samarbejde med <span style="font-weight:bold">PriceRunner</span>
          </p>
        </a>
      </div>
    </div>`;

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://api.pricerunner.com/publisher-widgets/dk/product.js?onlyInStock=true&offerOrigin=NATIONAL&offerLimit=4&productId=${chosen.productId}&partnerId=adrunner_dk_opskrift-drikke&widgetId=${chosen.divId}`;
  slot.appendChild(s);
}

// auto-mount kun for forsiden (hvis slot findes)
document.addEventListener('DOMContentLoaded', () => {
  const home = document.querySelector('#pr-home-slot');
  if (home) mountPRHome('#pr-home-slot');
});
