// /js/pricerunner-rotator.js

// ------------- Consent (ret til din CMP hvis du har en) -------------
const hasConsent = () => {
  // byt til din rigtige cookie consent logik:
  // fx return window.__cmp?.('getPurposeConsents')?.ads === true
  return localStorage.getItem('od_marketing_ok') === '1';
};

// ------------- Dine 3 widgets (som givet) -------------
const WIDGETS = [
  {
    id: 'pr-product-widget-5ef258a0',
    html: `
<div id="pr-product-widget-5ef258a0" style="display: block; width: 100%"></div>
<script type="text/javascript" src="https://api.pricerunner.com/publisher-widgets/dk/product.js?onlyInStock=true&offerOrigin=NATIONAL&offerLimit=4&productId=3385670828&partnerId=adrunner_dk_opskrift-drikke&widgetId=pr-product-widget-5ef258a0" async></script>
<div style="display: inline-block">
  <a href="https://www.pricerunner.dk/pl/84-3385670828/Blendere/Ninja-Detect-TB301EU-Blender-Pro-Sammenlign-Priser" rel="nofollow">
    <p style="font: 14px 'Klarna Text', Helvetica, sans-serif; font-style: italic; color: var(--grayscale100); text-decoration: underline;">
      Annonce i samarbejde med <span style="font-weight:bold">PriceRunner</span>
    </p>
  </a>
</div>`
  },
  {
    id: 'pr-product-widget-7b9e4810',
    html: `
<div id="pr-product-widget-7b9e4810" style="display: block; width: 100%"></div>
<script type="text/javascript" src="https://api.pricerunner.com/publisher-widgets/dk/product.js?onlyInStock=true&offerOrigin=NATIONAL&offerLimit=4&productId=3673343&partnerId=adrunner_dk_opskrift-drikke&widgetId=pr-product-widget-7b9e4810" async></script>
<div style="display: inline-block">
  <a href="https://www.pricerunner.dk/pl/82-3673343/Kaffemaskiner/DeLonghi-Magnifica-S-ECAM-21.117.B-Sammenlign-Priser" rel="nofollow">
    <p style="font: 14px 'Klarna Text', Helvetica, sans-serif; font-style: italic; color: var(--grayscale100); text-decoration: underline;">
      Annonce i samarbejde med <span style="font-weight:bold">PriceRunner</span>
    </p>
  </a>
</div>`
  },
  {
    id: 'pr-product-widget-8870c090',
    html: `
<div id="pr-product-widget-8870c090" style="display: block; width: 100%"></div>
<script type="text/javascript" src="https://api.pricerunner.com/publisher-widgets/dk/product.js?onlyInStock=true&offerOrigin=NATIONAL&offerLimit=4&productId=3299718083&partnerId=adrunner_dk_opskrift-drikke&widgetId=pr-product-widget-8870c090" async></script>
<div style="display: inline-block">
  <a href="https://www.pricerunner.dk/pl/84-3299718083/Blendere/Nutribullet-Pro-900-NB907MAB-Sammenlign-Priser" rel="nofollow">
    <p style="font: 14px 'Klarna Text', Helvetica, sans-serif; font-style: italic; color: var(--grayscale100); text-decoration: underline;">
      Annonce i samarbejde med <span style="font-weight:bold">PriceRunner</span>
    </p>
  </a>
</div>`
  }
];

// ------------- Utils -------------
const pickRandom = (arr) => arr[Math.floor(Math.random()*arr.length)];

function clearChildren(node){
  while (node.firstChild) node.removeChild(node.firstChild);
}

function wrapCard(innerHtml){
  // pæn ramme som matcher sitet
  return `
  <div class="card bg-white p-4 border rounded-2xl">
    <div class="text-sm opacity-70 mb-2">Annonce i samarbejde med PriceRunner</div>
    ${innerHtml}
  </div>`;
}

// ------------- Mount -------------
export function mountPR(selector = '#pr-home-slot'){
  const slot = document.querySelector(selector);
  if (!slot) return;

  // kun hvis samtykke
  if (!hasConsent()){
    // vis en lille placeholder med mulighed for at aktivere (valgfrit)
    slot.innerHTML = `
      <div class="card bg-white p-4 border rounded-2xl">
        <div class="text-sm opacity-80">Marketing-cookies er slået fra.</div>
        <div class="text-sm opacity-70 mt-1">Aktivér for at se pris-sammenligninger fra PriceRunner.</div>
      </div>`;
    return;
  }

  const inject = () => {
    const chosen = pickRandom(WIDGETS);
    clearChildren(slot);
    // card wrapper + widget html
    slot.insertAdjacentHTML('beforeend', wrapCard(chosen.html));
  };

  // lazy: kun når i viewport
  const observer = new IntersectionObserver((entries) => {
    if (entries.some(e=>e.isIntersecting)){
      observer.disconnect();
      inject();
    }
  }, {rootMargin:'200px'});
  observer.observe(slot);
}

// auto-mount på forsiden
document.addEventListener('DOMContentLoaded', () => {
  mountPR('#pr-home-slot');
});
