
// load header/footer partials
async function loadPartials() {
  const header = await fetch('/partials/header.html').then(r => r.text()).catch(()=>'');
  const footer = await fetch('/partials/footer.html').then(r => r.text()).catch(()=>'');
  document.getElementById('header').innerHTML = header;
  document.getElementById('footer').innerHTML = footer;

  // theme toggle (light only visual)
  const btn = document.getElementById('themeToggle');
  if (btn) btn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
  });
}
document.addEventListener('DOMContentLoaded', loadPartials);

// small util
export function formatStars(rating) {
  const full = Math.round(rating);
  let html = '';
  for (let i=1;i<=5;i++) {
    html += `<svg class="w-4 h-4 ${i<=full?'':'opacity-30'}"><use href="/assets/icons.svg#star"/></svg>`;
  }
  return html;
}
