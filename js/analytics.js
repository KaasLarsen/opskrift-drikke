
// Simple analytics loader. Set window.ANALYTICS = { ga4: 'G-XXXX', plausible: 'opskrift-drikke.dk' } before load to enable.
(function(){
  const cfg = window.ANALYTICS || {};
  if (cfg.ga4){
    const s = document.createElement('script'); s.async=true; s.src=`https://www.googletagmanager.com/gtag/js?id=${cfg.ga4}`; document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);} window.gtag = gtag;
    gtag('js', new Date()); gtag('config', cfg.ga4);
  }
  if (cfg.plausible){
    const s = document.createElement('script'); s.defer=true; s.setAttribute('data-domain', cfg.plausible); s.src='https://plausible.io/js/plausible.js'; document.head.appendChild(s);
  }
})();
