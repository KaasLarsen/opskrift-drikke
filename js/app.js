
// ES module
export async function loadPartials() {
  const header = await fetch('/partials/header.html').then(r => r.text()).catch(()=>'');
  const footer = await fetch('/partials/footer.html').then(r => r.text()).catch(()=>'');
  document.getElementById('header').innerHTML = header;
  document.getElementById('footer').innerHTML = footer;

  const btn = document.getElementById('themeToggle');
  if (btn) btn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
  });
}

export function formatStars(rating) {
  const full = Math.round(rating);
  let html = '';
  for (let i=1;i<=5;i++) {
    html += `<svg class="w-4 h-4 ${i<=full?'':'opacity-30'}"><use href="/assets/icons.svg#star"/></svg>`;
  }
  return html;
}

document.addEventListener('DOMContentLoaded', loadPartials);


export function showToast(msg){
  let t = document.getElementById('od_toast');
  if (!t){
    t = document.createElement('div');
    t.id = 'od_toast';
    t.style.position='fixed';
    t.style.left='50%';
    t.style.bottom='20px';
    t.style.transform='translateX(-50%)';
    t.style.padding='10px 16px';
    t.style.background='rgba(0,0,0,.85)';
    t.style.color='#fff';
    t.style.borderRadius='12px';
    t.style.zIndex='9999';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity='1';
  setTimeout(()=>{ t.style.opacity='0'; }, 2000);
}
