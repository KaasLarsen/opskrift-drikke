// /js/pricerunner-rotator.js
// Simpel version – PriceRunner vises altid (ingen cookie-tjek)

// ------------- Dine 3 widgets -------------
const WIDGETS = [
  {
    id: 'pr-product-widget-5ef258a0',
    html: `
<div id="pr-product-widget-5ef258a0" style="display: block; width: 100%"></div>
<script type="text/javascript" src="https://api.pricerunner.com/publisher-widgets/dk/product.js?onlyInStock=true&offerOrigin=NATIONAL&offerLimit=4&productId=3385670828&partnerId=adrunner_dk_opskrift-drikke&widgetId=pr-product-widget-5ef258a0" async></script>
<div style="display: inline-block">
  <a href="https://www.pricerunner.dk/pl/84-3385670828/Blendere/Ninja-Detect-TB301EU-Blender-Pro-Sammenlign-Priser" rel="nofollow">
    <p style="font: 14px 'Klarna Text', Helvetica, sans-serif; font-style: italic; color: #444; text-decoration: underline;">
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
    <p style="font: 14px 'Klarna Text', Helvetica, sans-serif; font-style: italic; color: #444; text-decoration: underline;">
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
    <p style="font: 14px 'Klarna Text', Helvetica, sans-serif; font-style: italic; color: #444; text-decoration: underline;">
      Annonce i samarbejde med <span style="font-weight:bold">PriceRunner</span>
    </p>
  </a>
</div>`
  }
];

// ------------- Utils -------------
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function clearChildren(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function wrapCard(innerHtml) {
  return `
  <div class="card bg-white p-4 border rounded-2xl">
    <div class="text-sm opacity-70 mb-2">Annonce i samarbejde med PriceRunner</div>
    ${innerHtml}
  </div>`;
}

// ------------- Mount -------------
export function mountPR(selector = '#pr-home-slot') {
  const slot = document.querySelector(selector);
  if (!slot) return;

  const inject = () => {
    const chosen = pickRandom(WIDGETS);
    clearChildren(slot);
    slot.insertAdjacentHTML('beforeend', wrapCard(chosen.html));
  };

  // Lazy load (kun når i viewport)
  const observer = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      observer.disconnect();
      inject();
    }
  }, { rootMargin: '200px' });
  observer.observe(slot);
}

// Auto-mount på forsiden
document.addEventListener('DOMContentLoaded', () => {
  mountPR('#pr-home-slot');
});
