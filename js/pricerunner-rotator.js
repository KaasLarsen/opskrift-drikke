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
