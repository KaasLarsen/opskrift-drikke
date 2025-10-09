# opskrift-drikke.dk (green modern + theme toggle + search)
Statisk site til Vercel.

## kom i gang
1) push til GitHub
2) importér repo i Vercel (Framework: Other, Build: none, Output: /)
3) opdater `sitemaps/recipes-sitemap.xml` når du tilføjer nye opskrifter
4) forsiden og `seneste` læser automatisk fra `recipes-sitemap.xml`

## features
- lys/mørk tema (gemmes i localStorage, følger system som default)
- søgning: tryk `/` eller klik forstørrelsesglas (loader fra recipes-sitemap.xml)
- lette kort, grøn moderne stil

## ny opskrift
- kopiér en fil i `/opskrifter/`
- opdater `<title>`, meta, JSON-LD, H1, ingredienser og trin
- tilføj url i `sitemaps/recipes-sitemap.xml`
