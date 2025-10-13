// /js/pricerunner-rotator.js
// PriceRunner vises altid, lazy-load og korrekt script-injektion

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

const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];

function clear(node){ while(node.firstChild) node.removeChild(node.firstChild); }

function wrapCard(el){
  const card = document.createElement('div');
  card.className = 'card bg-white p-4 border rounded-2xl';
  const lbl = document.createElement('div');
  lbl.className = 'text-sm opacity-70 mb-2';
  lbl.textContent = 'Annonce i samarbejde med PriceRunner';
  card.appendChild(lbl);
  card.appendChild(el);
  return card;
}

// vigtig: opret script-elementet via DOM, ikke innerHTML
function injectWidget(slot, w){
  clear(slot);

  // widget container
  const holder = document.createElement('div');
  holder.id = w.id;
  holder.style.display = 'block';
  holder.style.width = '100%';

  // disclosure-link fra dit snippet
  const discWrap = document.createElement('div');
  discWrap.style.display = 'inline-block';
  discWrap.innerHTML = `
    <a href="${w.link}" rel="nofollow">
      <p style="font:14px 'Klarna Text', Helvetica, sans-serif; font-style:italic; color:#444; text-decoration:underline;">
        Annonce i samarbejde med <span style="font-weight:bold">PriceRunner</span>
      </p>
    </a>`;

  const frame = document.createElement('div');
  frame.appendChild(holder);
  frame.appendChild(discWrap);

  slot.appendChild(wrapCard(frame));

  // scriptet oprettes som element (ellers kører det ikke)
  const s = document.createElement('script');
  s.type = 'text/javascript';
  s.src = w.src;
  s.async = true;
  document.body.appendChild(s);
}

export function mountPR(selector = '#pr-home-slot'){
  const slot = document.querySelector(selector);
  if (!slot) return;

  const w = pick(WIDGETS);

  const onEnter = (entries, obs) => {
    if (entries.some(e => e.isIntersecting)) {
      obs.disconnect();
      injectWidget(slot, w);
    }
  };

  // lazy indlæsning når slotten er i viewport
  const io = new IntersectionObserver(onEnter, { rootMargin: '200px' });
  io.observe(slot);
}

document.addEventListener('DOMContentLoaded', () => {
  mountPR('#pr-home-slot');
});
