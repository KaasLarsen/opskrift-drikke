// /js/cookies.js
const KEY = 'od_consent_v1';

export function getConsent(){
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}
export function setConsent(obj){
  localStorage.setItem(KEY, JSON.stringify(obj));
  window.dispatchEvent(new CustomEvent('consent:changed', { detail: obj }));
}

function bannerHtml(){
  return `
  <div id="od_cookie_banner" class="fixed inset-x-0 bottom-0 z-[9998]">
    <div class="max-w-6xl mx-auto m-4 p-4 rounded-2xl bg-white shadow-xl border text-sm">
      <div class="md:flex md:items-center md:justify-between gap-4">
        <p class="md:flex-1">
          vi bruger kun nødvendige cookies og simple analytics. du kan altid ændre dit valg.
        </p>
        <div class="flex flex-wrap gap-2 mt-3 md:mt-0">
          <button id="od_cookie_customize" class="border px-3 py-1.5 rounded-2xl">tilpas</button>
          <button id="od_cookie_reject" class="border px-3 py-1.5 rounded-2xl">afvis</button>
          <button id="od_cookie_accept" class="px-3 py-1.5 rounded-2xl text-white" style="background:#111;">accepter</button>
        </div>
      </div>
      <div id="od_cookie_panel" class="hidden mt-4 border-t pt-3">
        <label class="flex items-start gap-2">
          <input type="checkbox" checked disabled>
          <span>nødvendige cookies <span class="opacity-70">(altid aktiveret)</span></span>
        </label>
        <label class="flex items-start gap-2 mt-2">
          <input id="od_ck_analytics" type="checkbox" checked>
          <span>analytics <span class="opacity-70">(hjælper os med at forbedre siden)</span></span>
        </label>
        <div class="mt-3 flex gap-2">
          <button id="od_cookie_save" class="px-3 py-1.5 rounded-2xl border">gem valg</button>
          <a href="/pages/privatliv.html" class="underline">læs mere</a>
        </div>
      </div>
    </div>
  </div>`;
}

export function mountCookieBanner(){
  if (getConsent()) return; // allerede valgt
  const wrap = document.createElement('div');
  wrap.innerHTML = bannerHtml();
  document.body.appendChild(wrap);

  const panel = document.getElementById('od_cookie_panel');
  document.getElementById('od_cookie_customize').onclick = () => {
    panel.classList.toggle('hidden');
  };
  document.getElementById('od_cookie_accept').onclick = () => {
    setConsent({ necessary:true, analytics:true, ts:Date.now() });
    document.getElementById('od_cookie_banner').remove();
  };
  document.getElementById('od_cookie_reject').onclick = () => {
    setConsent({ necessary:true, analytics:false, ts:Date.now() });
    document.getElementById('od_cookie_banner').remove();
  };
  document.getElementById('od_cookie_save').onclick = () => {
    const a = document.getElementById('od_ck_analytics').checked;
    setConsent({ necessary:true, analytics:a, ts:Date.now() });
    document.getElementById('od_cookie_banner').remove();
  };
}
