export class ApiError extends Error { constructor(status,message){super(message);this.status=status;} }
export function authorize(member,claims,action){
 if(!member?.enabled)throw new ApiError(403,'Kein freigeschalteter Zugang.');
 if(action==='session')return;
 if(claims.aal!=='aal2')throw new ApiError(403,'Zweiten Faktor bestätigen.');
 const allowed={read:['admin','editor','viewer'],save:['admin','editor'],publish:['admin'],users:['admin'],audit:['admin']};
 if(!allowed[action]?.includes(member.role))throw new ApiError(403,'Berechtigung fehlt.');
}
export function validateMenu(d){
 const bad=()=>{throw new ApiError(400,'Ungültige Kartendaten.');};
 if(!d||!Array.isArray(d.categories)||!d.categories.length||d.categories.length>100||!Array.isArray(d.drinks)||d.drinks.length>2000)bad();
 const ids=new Set(),cats=new Set();
 const str=(s,max)=>typeof s==='string'&&s.length<=max;
 for(const c of d.categories){if(!str(c.id,100)||!c.id||cats.has(c.id)||!str(c.name,100)||!c.name.trim()||!Number.isFinite(c.order))bad();cats.add(c.id);}
 for(const x of d.drinks){
  if(!str(x.id,100)||!x.id||ids.has(x.id)||!cats.has(x.categoryId)||!str(x.name,120)||!x.name.trim()||typeof x.active!=='boolean'||!Number.isFinite(x.order))bad();
  ids.add(x.id);if(!(x.price===null||Number.isFinite(x.price)&&x.price>=0&&x.price<=9999))bad();
  if(!Array.isArray(x.ingredients)||x.ingredients.length>100||x.ingredients.some(i=>!str(i,1000)))bad();
  for(const k of ['description','glass','garnish','serving','photoAlt'])if(x[k]!=null&&!str(x[k],5000))bad();
  if(x.photo){
   // Publish only same-site raster assets or bounded raster data URLs, never SVG/HTML/remote trackers.
   if(!/^images\/[a-zA-Z0-9_./-]+\.(webp|png|jpe?g)$/.test(x.photo)&&!/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/]+=*$/.test(x.photo))bad();
   if(x.photo.includes('..')||x.photo.length>750000)bad();
   if(x.photo.startsWith('data:')){
    let bin;try{bin=atob(x.photo.split(',')[1]);}catch{bad();}
    if(x.photo.startsWith('data:image/webp')&&!(bin.slice(0,4)==='RIFF'&&bin.slice(8,12)==='WEBP'))bad();
    if(x.photo.startsWith('data:image/png')&&!bin.startsWith('\x89PNG\r\n\x1a\n'))bad();
    if(x.photo.startsWith('data:image/jpeg')&&!(bin.charCodeAt(0)===255&&bin.charCodeAt(1)===216&&bin.charCodeAt(2)===255))bad();
   }
  }
 }
 if(JSON.stringify(d).length>4500000)throw new ApiError(413,'Entwurf zu groß (max. 4,5 MB).');
 return d;
}
export function parseClaims(token){try{return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));}catch{throw new ApiError(401,'Ungültige Sitzung.');}}
