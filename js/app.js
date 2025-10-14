// /js/app.js
async function mountPartial(id, url){
  const el = document.getElementById(id);
  if (!el) return;
  try{
    const res = await fetch(url, { cache: "no-cache" });
    if(!res.ok) throw new Error(`${url} ${res.status}`);
    el.innerHTML = await res.text();
  }catch(err){
    console.error("Partial mount failed:", url, err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  mountPartial('header', '/partials/header.html');
  mountPartial('footer', '/partials/footer.html');
});
