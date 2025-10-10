
# opskrift-drikke.dk – statisk site

det her projekt er klar til github pages eller vercel.

## start

1) læg hele mappen i et repo på github (fx `higthub/opskrift-drikke.dk`).
2) vercel: peg på `index.html` som entry. github pages: aktiver pages for `main` branch.
3) analytics: sæt `window.ANALYTICS = { ga4: 'G-XXXX', plausible: 'opskrift-drikke.dk' }` i `<head>` før `analytics.js` eller via inline script.
4) opskrifter: de 500 opskrifter ligger i `/data/recipes.json`. kun du tilføjer nye – redigér JSON direkte.
5) login/favoritter/kommentarer er **kun lokale** i browseren (localStorage). det er fint til start, men ikke sikkert til rigtige brugere.

## struktur

- `partials/` header og footer (ens på alle sider, indlæses via js)
- `pages/opskrift.html` viser en opskrift ud fra `?slug=`
- `data/recipes.json` alle opskrifter
- `js/` al funktionalitet: søgning, login, favoritter, kommentarer, schema.org, analytics
- `assets/icons.svg` ikon-sprite (logo, søg, hjerte, stjerne, bruger, kommentar, indstillinger)

## seo

- `sitemap.xml` + `robots.txt`
- `Recipe` schema via json-ld på opskrift-siden
- meta description på alle sider

## design

- lys, moderne, runde bokse, tailwind via cdn
- ingen billeder – kun svg-ikoner

god fornøjelse.


## v2 ændringer
- ES modules på al JS (robust import og rækkefølge)
- interaktiv bruger-bedømmelse på opskriftssider (lokal lagring)
- manifest + favicon + open graph
- søgning/performance rettet, kort-rendering via eksport
- partials hentes relativt for at virke på både vercel og gh pages


v2.1: partials hentes nu via absolut sti (/partials/...) for Vercel.

v2.2: opskrifter udvidet til 3.000. sitemap opdateret.