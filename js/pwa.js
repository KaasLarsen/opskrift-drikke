
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(()=>{});
  });
}
function toast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.position = 'fixed';
  t.style.left = '50%';
  t.style.transform = 'translateX(-50%)';
  t.style.bottom = '18px';
  t.style.padding = '8px 12px';
  t.style.background = 'rgba(0,0,0,.85)';
  t.style.color = '#fff';
  t.style.fontSize = '13px';
  t.style.borderRadius = '14px';
  t.style.zIndex = 99999;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1600);
}
window.addEventListener('offline', () => toast('Du er offline – viser cachede sider'));
window.addEventListener('online', () => toast('Tilbage online'));
window.__pwa = { installed: 'ok' };
