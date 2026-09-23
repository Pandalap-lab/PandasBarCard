function canonical(value){if(typeof value==='string'&&/^https:\/\/owsbknyknzaihxtnutyk\.supabase\.co\/storage\/v1\/object\/public\/bar-published\/[a-f0-9]{64}\.(webp|png|jpg)$/.test(value))return 'storage:'+value.split('/').pop();if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().filter(k=>!(['serving','alcoholContent'].includes(k)&&(value[k]===''||value[k]===null))).map(k=>[k,canonical(value[k])]));return value;}
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
export function countChanges(base,draft){
 let count=0;
 for(const key of ['drinks','categories']){
 const a=new Map(base[key].map(x=>[x.id,x])),b=new Map(draft[key].map(x=>[x.id,x]));
 for(const id of new Set([...a.keys(),...b.keys()]))if(!equal(a.get(id),b.get(id)))count++;
 }
 if(!equal(base.settings,draft.settings))count++;
 return count;
}
