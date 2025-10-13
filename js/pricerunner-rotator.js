// /js/pricerunner-rotator.js
// PriceRunner-karussel med venstre/højre pile

const WIDGETS = [
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

// --- Flere widgets (til opskrifter/guides) ---
// Smoothies
WIDGETS.push(
  { key:'blender-ninja-1',       divId:'prw-blender-ninja-1',       productId:'3385670828',
    link:'https://www.pricerunner.dk/pl/84-3385670828/Blendere/Ninja-Detect-TB301EU-Blender-Pro-Sammenlign-Priser' },
  { key:'blender-nutribullet-1', divId:'prw-blender-nutribullet-1', productId:'3299718083',
    link:'https://www.pricerunner.dk/pl/84-3299718083/Blendere/Nutribullet-Pro-900-NB907MAB-Sammenlign-Priser' },
  { key:'blender-wilfa-1',       divId:'prw-blender-wilfa-1',       productId:'3389596724',
    link:'https://www.pricerunner.dk/pl/84-3389596724/Blendere/Wilfa-BLPS-1000S-Sammenlign-Priser' }
);

// Shots / Sunde shots / Juice
WIDGETS.push(
  { key:'slowjuicer-philips-1',  divId:'prw-slowjuicer-philips-1',  productId:'4334296',
    link:'https://www.pricerunner.dk/pl/83-4334296/Juicere/Philips-Viva-Collection-HR1889-Sammenlign-Priser' },
  { key:'citrus-braun-1',        divId:'prw-citrus-braun-1',        productId:'2988785',
    link:'https://www.pricerunner.dk/pl/83-2988785/Juicere/Braun-CJ-3050-Sammenlign-Priser' },
  { key:'citrus-solis-1',        divId:'prw-citrus-solis-1',        productId:'3206152439',
    link:'https://www.pricerunner.dk/pl/83-3206152439/Juicere/Solis-Citrus-Juicer-Typ-8453-Zitruspresse-Sammenlign-Priser' }
);

// Kaffe
WIDGETS.push(
  { key:'kaffemaskine-delonghi-1', divId:'prw-kaffemaskine-delonghi-1', productId:'3673343',
    link:'https://www.pricerunner.dk/pl/82-3673343/Kaffemaskiner/DeLonghi-Magnifica-S-ECAM-21.117.B-Sammenlign-Priser' },
  { key:'kaffekvaern-timemore-1',  divId:'prw-kaffekvaern-timemore-1',  productId:'3414287640',
    link:'https://www.pricerunner.dk/pl/621-3414287640/Kaffekvaerne/Timemore-Chestnut-C2-Folded-White-Sammenlign-Priser' },
  { key:'maelkeskummer-severin-1', divId:'prw-maelkeskummer-severin-1', productId:'3208410769',
    link:'https://www.pricerunner.dk/pl/82-3208410769/Kaffemaskiner/Severin-SM-3588-Sammenlign-Priser' }
);

// Te & varme drikke
WIDGETS.push(
  { key:'kedel-hario-12', divId:'prw-kedel-hario-12', productId:'3364339',
    link:'https://www.pricerunner.dk/pl/68-3364339/Vandkedel/Hario-V60-Buono-Drip-1.2L-Sammenlign-Priser' },
  { key:'kedel-hario-10', divId:'prw-kedel-hario-10', productId:'4437701',
    link:'https://www.pricerunner.dk/pl/68-4437701/Vandkedel/Hario-V60-Buono-1L-Sammenlign-Priser' },
  { key:'kedel-hario-temp', divId:'prw-kedel-hario-temp', productId:'5178840',
    link:'https://www.pricerunner.dk/pl/68-5178840/Vandkedel/Hario-V60-Buono-80-with-Temperature-Sammenlign-Priser' }
);

// Mocktails / Uden alkohol
WIDGETS.push(
  { key:'sodastream-duo-1', divId:'prw-sodastream-duo-1', productId:'3200852682',
    link:'https://www.pricerunner.dk/pl/1312-3200852682/Sodavandsmaskiner/SodaStream-Duo-with-carbon-dioxide-cylinder-Sammenlign-Priser' },
  { key:'sodastream-duo-2', divId:'prw-sodastream-duo-2', productId:'3335407774',
    link:'https://www.pricerunner.dk/pl/1312-3335407774/Sodavandsmaskiner/SodaStream-Duo-White-2-Bottles-Sammenlign-Priser' },
  { key:'sodastream-duo-3', divId:'prw-sodastream-duo-3', productId:'3203547039',
    link:'https://www.pricerunner.dk/pl/1312-3203547039/Sodavandsmaskiner/SodaStream-Duo-Titan-without-CO2-Cylinder-Sammenlign-Priser' }
);

// Cocktails / Med alkohol
WIDGETS.push(
  { key:'boston-zone-1',    divId:'prw-boston-zone-1',    productId:'3200061470',
    link:'https://www.pricerunner.dk/pl/461-3200061470/Koekkentilbehoer/Zone-Denmark-Rocks-Boston-Cocktailshaker-29.5cm-Sammenlign-Priser' },
  { key:'boston-pro-1',     divId:'prw-boston-pro-1',     productId:'4980783',
    link:'https://www.pricerunner.dk/pl/461-4980783/Koekkentilbehoer/Boston-Professional-Cocktailshaker-80cl-17.5cm-Sammenlign-Priser' },
  { key:'boston-barcraft-1',divId:'prw-boston-barcraft-1',productId:'3762756',
    link:'https://www.pricerunner.dk/pl/461-3762756/Koekkentilbehoer/Boston-Bar-Craft-Boston-Cocktail-Cocktailshaker-65cl-Sammenlign-Priser' }
);

// Gløgg
WIDGETS.push(
  { key:'stanley-termoflaske-1', divId:'prw-stanley-termoflaske-1', productId:'5044186',
    link:'https://www.pricerunner.dk/pl/461-5044186/Koekkentilbehoer/Stanley-Classic-Termoflaske-1L-Sammenlign-Priser' },
  { key:'gryde-tefal-5l',        divId:'prw-gryde-tefal-5l',        productId:'3200022122',
    link:'https://www.pricerunner.dk/pl/1266-3200022122/Kasseroller-Stegepander/Tefal-Nordica-med-laag-24cm-Sammenlign-Priser' },
  { key:'gryde-dorre-5l',        divId:'prw-gryde-dorre-5l',        productId:'3276645688',
    link:'https://www.pricerunner.dk/pl/1266-3276645688/Kasseroller-Stegepander/Dorre-Karla-Gryde-5-L-med-laag-24cm-Sammenlign-Priser' }
);


let currentIndex = 0;

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function createWidgetFrame(w) {
  const holder = document.createElement('div');
  holder.id = w.id;
  holder.style.display = 'block';
  holder.style.width = '100%';

  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = w.src;
  script.async = true;

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
  document.body.appendChild(script);

  return wrap;
}

function renderWidget(slot, index) {
  clear(slot);
  const w = WIDGETS[index];
  const frame = createWidgetFrame(w);

  const card = document.createElement('div');
  card.className = 'card bg-white p-4 border rounded-2xl relative';

  const label = document.createElement('div');
  label.className = 'text-sm opacity-70 mb-2';
  label.textContent = 'Annonce i samarbejde med PriceRunner';
  card.appendChild(label);
  card.appendChild(frame);

  // Pile
  const left = document.createElement('button');
  left.innerHTML = '◀';
  left.className = 'absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-500 text-2xl';
  left.onclick = () => {
    currentIndex = (currentIndex - 1 + WIDGETS.length) % WIDGETS.length;
    renderWidget(slot, currentIndex);
  };

  const right = document.createElement('button');
  right.innerHTML = '▶';
  right.className = 'absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-500 text-2xl';
  right.onclick = () => {
    currentIndex = (currentIndex + 1) % WIDGETS.length;
    renderWidget(slot, currentIndex);
  };

  card.appendChild(left);
  card.appendChild(right);

  slot.appendChild(card);
}

export function mountPR(selector = '#pr-home-slot') {
  const slot = document.querySelector(selector);
  if (!slot) return;

  const observer = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      observer.disconnect();
      renderWidget(slot, currentIndex);
    }
  }, { rootMargin: '200px' });
  observer.observe(slot);
}

document.addEventListener('DOMContentLoaded', () => {
  mountPR('#pr-home-slot');
});
