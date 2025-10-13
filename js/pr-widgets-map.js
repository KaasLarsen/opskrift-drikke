// /js/pr-widgets-map.js
// fold = diakritik- og case-fri sammenligning
export const fold = (s='') => s.toLowerCase()
  .replace(/æ/g,'ae').replace(/ø/g,'oe').replace(/å/g,'aa')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'');

// prioriteret liste af widget-keys pr. kategori/tag
export const CATEGORY_TO_WIDGET_KEYS = {
  // Smoothies
  'smoothie': ['blender-ninja-1','blender-nutribullet-1','blender-wilfa-1'],

  // Shots
  'shots': ['slowjuicer-philips-1','citrus-braun-1','citrus-solis-1'],
  'sunde shots': ['slowjuicer-philips-1','citrus-braun-1','citrus-solis-1'],

  // Kaffe
  'kaffe': ['kaffemaskine-delonghi-1','kaffekvaern-timemore-1','maelkeskummer-severin-1'],

  // Te & varme drikke
  'te': ['kedel-hario-12','kedel-hario-10','kedel-hario-temp'],
  'te & varme drikke': ['kedel-hario-12','kedel-hario-10','kedel-hario-temp'],

  // Mocktails / uden alkohol
  'mocktails': ['sodastream-duo-1','sodastream-duo-2','sodastream-duo-3'],
  'uden alkohol': ['sodastream-duo-1','sodastream-duo-2','sodastream-duo-3'],

  // Cocktails / med alkohol
  'cocktails': ['boston-zone-1','boston-pro-1','boston-barcraft-1'],
  'med alkohol': ['boston-zone-1','boston-pro-1','boston-barcraft-1'],

  // Juice & saft (rettet → slowjuicer/citrus)
  'juice': ['slowjuicer-philips-1','citrus-braun-1','citrus-solis-1'],
  'saft':  ['slowjuicer-philips-1','citrus-braun-1','citrus-solis-1'],

  // Gløgg
  'gloegg': ['stanley-termoflaske-1','gryde-tefal-5l','gryde-dorre-5l'],
};

// vælg bedste widget for en recipe
export function chooseWidgetKeys(recipe){
  const cat = fold(recipe.category||'');
  const tags = (recipe.tags||[]).map(fold);

  if (CATEGORY_TO_WIDGET_KEYS[cat]) return CATEGORY_TO_WIDGET_KEYS[cat];

  for (const t of tags){
    if (CATEGORY_TO_WIDGET_KEYS[t]) return CATEGORY_TO_WIDGET_KEYS[t];
  }

  // generisk fallback = blenders
  return ['blender-ninja-1','blender-nutribullet-1','blender-wilfa-1'];
}
