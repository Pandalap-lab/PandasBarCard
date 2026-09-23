export const LOCAL_KEY='pandas-barcard-draft-v1';
const source=new URL('../data/drinks.json',import.meta.url);
export let loadNotice='';
const CONFIG=new URL('../admin/config.json',import.meta.url);
export function setPhotoMap(map,merge=false){let previous={};if(merge){try{previous=JSON.parse(localStorage.getItem('bar-preview-photos')||'{}');}catch{}}localStorage.setItem('bar-preview-photos',JSON.stringify({...previous,...map}));}
export async function loadData({draft=false}={}){
 loadNotice='';
 if(draft){const raw=localStorage.getItem(LOCAL_KEY);if(raw){loadNotice='Vorschau · unveröffentlichter Arbeitsentwurf';return validate(JSON.parse(raw));}}
 try{
  const configResponse=await fetch(CONFIG,{cache:'no-cache',signal:AbortSignal.timeout(8000)});if(!configResponse.ok)throw Error('Konfiguration fehlt');
  const config=await configResponse.json();
  const r=await fetch(config.supabaseUrl+'/rest/v1/bar_published?id=eq.1&select=document,published_at',{headers:{apikey:config.publishableKey},cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw Error('Karte nicht erreichbar');const rows=await r.json();if(!rows[0])throw Error('Karte noch nicht übernommen');
  const data=validate(rows[0].document);try{localStorage.setItem('bar-last-published',JSON.stringify({document:data,at:rows[0].published_at}));}catch{}return data;
 }catch{
  try{const cached=JSON.parse(localStorage.getItem('bar-last-published'));if(cached?.document){loadNotice='Gespeicherte Karte vom '+new Date(cached.at).toLocaleDateString('de-AT')+' · Aktualisierung nicht möglich. Preise bitte vor Ort bestätigen.';return validate(cached.document);}}catch{}
  const r=await fetch(source,{cache:'no-cache'});if(!r.ok)throw Error('Die Getränkekarte konnte nicht geladen werden.');
  loadNotice='Aktuelle Onlinekarte nicht erreichbar · Ersatzstand. Preise bitte vor Ort bestätigen.';return validate(await r.json());
 }
}
export function validate(d){if(!d||!Array.isArray(d.drinks)||!Array.isArray(d.categories)||!d.categories.length)throw Error('Ungültige Kartendaten');const cats=new Set(d.categories.map(c=>c.id));if(cats.size!==d.categories.length)throw Error('Doppelte Kategorie');const ids=new Set;for(const x of d.drinks){if(!x.id||ids.has(x.id)||!cats.has(x.categoryId)||typeof x.name!=='string'||!x.name.trim()||!Array.isArray(x.ingredients)||x.ingredients.some(i=>typeof i!=='string')||!(x.price===null||(typeof x.price==='number'&&Number.isFinite(x.price)&&x.price>=0))||typeof x.active!=='boolean')throw Error('Ungültiger Drink');ids.add(x.id);}return d;}
export function saveDraft(d){validate(d);localStorage.setItem(LOCAL_KEY,JSON.stringify(d));}
export function photoURL(value){if(!value)return '';if(value.startsWith('storage:')){try{return JSON.parse(localStorage.getItem('bar-preview-photos')||'{}')[value]||'';}catch{return '';}}if(/^data:image\/(webp|png|jpeg);base64,/i.test(value))return value;try{const u=new URL(value,new URL('../',import.meta.url));if(u.protocol==='https:'||u.origin===location.origin&&['http:','https:'].includes(u.protocol))return u.href;}catch{}return '';}
export const priceText=d=>d.price===null?'Preis auf Anfrage':new Intl.NumberFormat('de-AT',{style:'currency',currency:'EUR'}).format(d.price);
