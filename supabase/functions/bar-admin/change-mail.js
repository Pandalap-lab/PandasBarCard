const labels={name:'Name',price:'Preis',description:'Beschreibung',ingredients:'Zutaten',categoryId:'Kategorie',photo:'Bild',active:'Verfügbar',order:'Reihenfolge',glass:'Glas',garnish:'Garnitur',serving:'Menge / Portion',alcoholContent:'Alkoholangabe',allergens:'Allergene',tags:'Tags',notes:'Notizen',palette:'Bildfarben',source:'Quelle',unavailableMode:'Nicht verfügbare Drinks'};
const roles={admin:'Administrator',editor:'Bearbeiten',viewer:'Nur lesen'};
function canonical(value){
 if(typeof value==='string')return value.replace(/^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/bar-published\//,'storage:');
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().filter(k=>!(['serving','alcoholContent'].includes(k)&&(value[k]===''||value[k]===null))).map(k=>[k,canonical(value[k])]));
 return value;
}
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const text=value=>value===undefined||value===null||value===''?'–':typeof value==='boolean'?(value?'Ja':'Nein'):Array.isArray(value)?value.join(', '):typeof value==='object'?JSON.stringify(value):String(value);
function display(key,value,document){
 if(key==='price'&&typeof value==='number')return value.toLocaleString('de-AT',{style:'currency',currency:'EUR'});
 if(key==='categoryId')return document.categories?.find(c=>c.id===value)?.name||text(value);
 if(key==='unavailableMode')return value==='hide'?'Ausblenden':value==='show'?'Anzeigen und kennzeichnen':text(value);
 if(key==='photo'&&value?.startsWith('data:'))return 'Neues hochgeladenes Bild';
 return text(value);
}
export function menuChanges(before,after){
 const lines=[];
 for(const [key,kind] of [['drinks','Drink'],['categories','Kategorie']]){
  const old=new Map((before[key]||[]).map(x=>[x.id,x])),next=new Map((after[key]||[]).map(x=>[x.id,x]));
  for(const id of new Set([...old.keys(),...next.keys()])){
   const a=old.get(id),b=next.get(id);if(equal(a,b))continue;
   lines.push(`${kind}: ${b?.name||a?.name} (${id})`);
   if(!a)lines.push('  Eintrag: Nicht vorhanden → Hinzugefügt');
   if(!b)lines.push('  Eintrag: Vorhanden → Entfernt');
   for(const field of new Set([...Object.keys(a||{}),...Object.keys(b||{})])){
    if(field==='id'||equal(a?.[field],b?.[field]))continue;
    lines.push(`  ${labels[field]||field}: ${display(field,a?.[field],before)} → ${display(field,b?.[field],after)}`);
   }
  }
 }
 for(const key of new Set([...Object.keys(before.settings||{}),...Object.keys(after.settings||{})]))if(!equal(before.settings?.[key],after.settings?.[key]))lines.push(`Einstellung – ${labels[key]||key}: ${display(key,before.settings?.[key],before)} → ${display(key,after.settings?.[key],after)}`);
 return lines.length?lines.join('\n'):'Keine inhaltlichen Änderungen.';
}
export function changeNotice({actor,email,event,details={},at=new Date()}){
 const lines=['PANDAsBarCard – '+event,'','Ausgeführt von: '+(email||actor),'Benutzerkennung: '+actor,'Zeitpunkt: '+at.toLocaleString('de-AT',{timeZone:'Europe/Vienna'})+' (Wien)',''];
 if(details.before&&details.after){
  lines.push(event==='Entwurf gespeichert'?'Der gemeinsame Entwurf wurde gespeichert. Die Gästekarte bleibt bis zur Veröffentlichung unverändert.':'Die Änderungen sind veröffentlicht. Gäste sehen sie beim nächsten Laden.','',menuChanges(details.before,details.after));
 }
 if(details.target)lines.push('Betroffener Benutzer: '+details.target);
 if(details.previous){
  lines.push('Rolle: '+(roles[details.previous.role]||details.previous.role)+' → '+(roles[details.role]||details.role));
  lines.push('Zugang: '+(details.previous.enabled?'Freigegeben':'Gesperrt')+' → '+(details.enabled?'Freigegeben':'Gesperrt'));
 }
 if(details.revision!==undefined)lines.push('Veröffentlichter Stand: '+details.revision);
 if(details.version!==undefined)lines.push('Entwurfsversion: '+details.version);
 return lines.join('\n');
}
