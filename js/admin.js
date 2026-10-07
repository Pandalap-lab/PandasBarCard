import{countChanges}from './changes.js?v=2';
import{createActionRunner}from './action-feedback.js?v=20261007-2';
import{loadData,saveDraft,validate,photoURL,setPhotoMap}from './store.js';const $=id=>document.getElementById(id);let baseline,data,current,dirty=false,uploading=false;
function msg(s){$('message').textContent=s;}function persist(silent=false){try{saveDraft(data);updateDraftStatus();if(!silent)msg('Entwurf in diesem Browser gespeichert.');return true;}catch(e){if(!silent)msg('Nicht gespeichert: Browserspeicher voll oder nicht verfügbar. Bitte Daten exportieren.');return false;}}
function node(tag,text){const e=document.createElement(tag);if(text)e.textContent=text;return e;}
function askLeave(){return !dirty||confirm('Ungespeicherte Änderungen verwerfen?');}
function render(){const query=$('search').value.toLocaleLowerCase();$('list').replaceChildren();for(const d of [...data.drinks].sort((a,b)=>a.order-b.order).filter(d=>d.name.toLocaleLowerCase().includes(query))){const r=node('div');r.className='list-row'+(d.id===current?' selected':'');const b=node('button',d.name+(d.active?'':' · pausiert'));b.className='select-drink';b.onclick=()=>{if(askLeave()){select(d.id);if(matchMedia('(max-width:760px)').matches)$('editor').scrollIntoView({block:'start'});}};r.append(b);for(const [text,step]of [['↑',-1],['↓',1]]){const move=node('button',text);move.className='sort';move.setAttribute('aria-label',d.name+(step<0?' nach vorne':' nach hinten'));const siblings=data.drinks.filter(x=>x.categoryId===d.categoryId).sort((a,b)=>a.order-b.order);const at=siblings.findIndex(x=>x.id===d.id);move.disabled=!siblings[at+step];move.onclick=()=>{const other=siblings[at+step];[other.order,d.order]=[d.order,other.order];persist();render();};r.append(move);}$('list').append(r);}}
function categories(){const old=$('category').value;$('category').replaceChildren();$('categoryList').replaceChildren();for(const c of [...data.categories].sort((a,b)=>a.order-b.order)){const o=node('option',c.name);o.value=c.id;$('category').append(o);const r=node('div');r.className='cat-row';const input=node('input');input.value=c.name;input.maxLength=100;input.setAttribute('aria-label','Kategoriename '+c.name);const save=node('button','Umbenennen');save.onclick=()=>{if(!input.value.trim())return msg('Bitte einen Kategorienamen eingeben.');c.name=input.value.trim();persist();categories();};const del=node('button','Löschen');del.onclick=()=>{if(data.categories.length===1)return msg('Mindestens eine Kategorie muss erhalten bleiben.');if(data.drinks.some(d=>d.categoryId===c.id))return msg('Diese Kategorie enthält Drinks. Bitte zuerst neu zuordnen.');if(confirm('Kategorie „'+c.name+'“ löschen?')){data.categories=data.categories.filter(x=>x.id!==c.id);persist();categories();}};r.append(input,save,del);$('categoryList').append(r);}$('category').value=data.categories.some(c=>c.id===old)?old:data.categories[0].id;}
function preview(){const url=photoURL($('photo').value);$('photoPreview').hidden=!url;if(url)$('photoPreview').src=url;else $('photoPreview').removeAttribute('src');}
function select(id){newPalette=null;current=id;const d=data.drinks.find(x=>x.id===id);for(const key of ['name','price','description','photo','glass','garnish','serving','alcoholContent'])$(key).value=d?.[key]??'';$('ingredients').value=d?.ingredients.join('\n')||'';$('active').checked=d?.active??true;$('category').value=d?.categoryId||data.categories[0].id;$('upload').value='';$('delete').disabled=!d;$('editorTitle').textContent=d?'Drink bearbeiten':'Neuer Drink';dirty=false;preview();render();}
function paletteFrom(canvas){try{const ctx=canvas.getContext('2d',{willReadFrequently:true}),{data:p}=ctx.getImageData(0,0,canvas.width,canvas.height);let r=0,g=0,b=0,n=0;for(let i=0;i<p.length;i+=64){const max=Math.max(p[i],p[i+1],p[i+2]),min=Math.min(p[i],p[i+1],p[i+2]);if(p[i+3]>128&&max>35&&min<230){r+=p[i];g+=p[i+1];b+=p[i+2];n++;}}if(!n)return ['#563322','#ad7946'];const h=v=>Math.round(v/n*.55).toString(16).padStart(2,'0');return ['#'+h(r)+h(g)+h(b),'#ad7946'];}catch{return ['#563322','#ad7946'];}}
let newPalette=null;$('upload').onchange=async()=>{const f=$('upload').files[0];if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>25*1024*1024)return msg('Bitte JPG, PNG oder WebP bis 25 MB wählen.');uploading=true;msg('Foto wird optimiert …');try{const image=await createImageBitmap(f);const factor=Math.min(1,1200/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*factor);canvas.height=Math.round(image.height*factor);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.close();const optimized=canvas.toDataURL('image/webp',.82);if(online){const result=await online.api('upload',{photo:optimized});setPhotoMap({[result.photo]:result.url},true);$('photo').value=result.photo;}else $('photo').value=optimized;newPalette=paletteFrom(canvas);dirty=true;preview();msg(online?'Foto geschützt hochgeladen. Zum Zuordnen „Drink speichern“ wählen; damit wird der Entwurf auf dem Server gespeichert.':'Foto optimiert. Zum Übernehmen lokal speichern.');}catch{msg('Dieses Foto konnte nicht verarbeitet werden.');}finally{uploading=false;}};
$('editor').addEventListener('input',()=>{dirty=true;});$('photo').addEventListener('change',()=>{newPalette=null;preview();});$('photoPreview').onerror=()=>{$('photoPreview').hidden=true;msg('Foto konnte nicht geladen werden. Bitte Pfad prüfen.');};
function commitEditor(){if(uploading)throw Error('Bitte warten, bis das Foto fertig ist.');const photo=$('photo').value.trim();if(photo&&!photoURL(photo))throw Error('Bitte relativen Bildpfad oder HTTPS-Adresse verwenden.');let d=data.drinks.find(x=>x.id===current);const fields={name:$('name').value.trim(),price:$('price').value===''?null:Number($('price').value),categoryId:$('category').value,description:$('description').value.trim(),ingredients:$('ingredients').value.split('\n').map(x=>x.trim()).filter(Boolean),photo,active:$('active').checked,glass:$('glass').value.trim(),garnish:$('garnish').value.trim(),serving:$('serving').value.trim(),alcoholContent:$('alcoholContent').value.trim()||null};if(!fields.name)throw Error('Bitte einen Namen eingeben.');if(!d){d={id:'drink-'+crypto.randomUUID(),order:Math.max(-1,...data.drinks.map(x=>x.order))+1,allergens:[],tags:[],alcoholContent:null,source:null,notes:'',palette:['#563322','#ad7946']};data.drinks.push(d);}Object.assign(d,fields);if(newPalette)d.palette=newPalette;current=d.id;
 // Browser backup is separate from backend confirmation.
 if(persist(!!online)){dirty=false;newPalette=null;}else if(!online)return false;
 render();$('delete').disabled=false;return true;}
$('editor').onsubmit=async e=>{e.preventDefault();if(serverRun?.busy)return;
 if(online){await runServer('Wird gespeichert …',async()=>{if(commitEditor())await saveServer();},$('message'));}
 else{try{commitEditor();try{navigator.vibrate?.(15);}catch{}}catch(error){msg(error.message);}}
};
$('new').onclick=()=>{if(askLeave()){newPalette=null;select(null);$('name').focus();}};$('search').oninput=render;$('delete').onclick=()=>{const d=data.drinks.find(x=>x.id===current);if(d&&confirm('„'+d.name+'“ aus dem lokalen Entwurf löschen?')){data.drinks=data.drinks.filter(x=>x.id!==current);persist();select(data.drinks[0]?.id);}};
$('newCategory').onsubmit=e=>{e.preventDefault();const name=$('categoryName').value.trim();if(!name)return;data.categories.push({id:'cat-'+crypto.randomUUID(),name,order:Math.max(...data.categories.map(c=>c.order))+1});persist();categories();$('categoryName').value='';};$('mode').onchange=()=>{data.settings={...data.settings,unavailableMode:$('mode').value};persist();};
$('export').onclick=()=>{if(dirty)return msg('Bitte den bearbeiteten Drink zuerst lokal speichern.');const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=node('a');a.href=url;a.download='drinks.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);msg('Export erstellt. Er enthält den aktuellen lokalen Datenstand, veröffentlicht ihn aber nicht.');};
$('import').onchange=async()=>{const f=$('import').files[0];if(!f)return;try{if(f.size>20*1024*1024)throw Error('Datei zu groß (max. 20 MB).');const next=validate(JSON.parse(await f.text()));if(confirm('Lokalen Entwurf durch diese Datei ersetzen?')){data=next;persist();categories();select(data.drinks[0]?.id);$('mode').value=data.settings?.unavailableMode||'show';}}catch(e){msg('Import abgebrochen: '+e.message);}$('import').value='';};window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
let online=null,serverVersion=null,serverDocument=null,serverRun=null;
function display(){updateDraftStatus();categories();select(data.drinks[0]?.id);$('mode').value=data.settings?.unavailableMode||'show';$('draftWorkspace').hidden=false;}
export async function startOffline(){online=null;baseline=await loadData();data=await loadData({draft:true});$('draftWorkspace').inert=false;$('onlineTools').hidden=true;$('saveDrink').textContent='Lokal speichern';display();}
export async function startOnline(connection){online=connection;await serverLoad();$('serverSave').disabled=online.role==='viewer';$('serverPublish').disabled=online.role!=='admin';$('saveDrink').disabled=online.role==='viewer';$('saveDrink').textContent='Drink speichern';$('draftWorkspace').inert=online.role==='viewer';$('modeLabel').textContent='Arbeitsentwurf · '+online.role;}
async function serverLoad(){if(dirty&&!confirm('Ungespeicherte Formularänderungen verwerfen?'))return;const r=await online.api('load');baseline=r.published.document;data=r.document;serverVersion=r.version;setPhotoMap(r.photos);serverDocument=JSON.stringify(data);const previous=localStorage.getItem("pandas-barcard-draft-v1");if(previous&&previous!==serverDocument)localStorage.setItem("pandas-barcard-before-server",previous);saveDraft(data);display();$('serverStatus').textContent=r.publish_lock?'Veröffentlichung muss im Backend geprüft werden (Sperre aktiv).':'Serverstand geladen · Version '+serverVersion;}
async function runServer(label,fn,status=$('serverStatus'),primary=$('saveDrink')){
 if(serverRun?.busy)return;
 serverRun=createActionRunner({buttons:[$('saveDrink'),$('serverSave'),$('serverPublish'),$('serverLoad')],regions:[$('editor'),$('list'),$('new'),$('view-categories'),$('dataTools'),$('loadPublished')].filter(Boolean),status,primary});
 await serverRun(label,fn);
 if(status!==$('serverStatus'))$('serverStatus').textContent=status.textContent;
}
async function saveServer(){
 if(!online||online.role==='viewer')throw Error('Für deine Rolle ist Speichern gesperrt.');
 if(uploading)throw Error('Bitte warten, bis das Foto fertig ist.');
 const selected=current;
 const r=await online.api('save',{document:structuredClone(data),version:serverVersion});
 serverVersion=r.version;data=r.document;serverDocument=JSON.stringify(data);dirty=false;newPalette=null;
 let warning='';try{setPhotoMap(r.photos);saveDraft(data);}catch{warning=' · Browserkopie konnte nicht gesichert werden; Serverstand ist gespeichert.';}
 updateDraftStatus();categories();select(selected);$('mode').value=data.settings?.unavailableMode||'show';
 const text='Entwurf auf Server gespeichert · Version '+serverVersion+'. Noch nicht veröffentlicht.'+(r.emailSent===false?' · Änderungs-E-Mail nicht bestätigt, siehe Protokoll.':'')+warning;
 $('serverStatus').textContent=text;msg(text);
}
$('serverLoad').onclick=async()=>{if(serverRun?.busy)return;if(confirm('Arbeitsentwurf durch Serverstand ersetzen? Vorher bei Bedarf exportieren.'))await runServer('Serverstand wird geladen …',serverLoad,$('serverStatus'),$('serverLoad'));};
$('serverSave').onclick=()=>runServer('Wird gespeichert …',async()=>{if(dirty){if(!$('editor').reportValidity())throw Error('Bitte die markierten Formularfelder prüfen.');if(!commitEditor())return;}await saveServer();},$('serverStatus'),$('serverSave'));
$('serverPublish').onclick=async()=>{
 if(serverRun?.busy)return;
 if(dirty||JSON.stringify(data)!==serverDocument){$('serverStatus').textContent='Bitte zuerst speichern, die Vorschau prüfen und dann veröffentlichen.';return;}
 if(!confirm('Geprüften Entwurf jetzt für alle Gäste veröffentlichen?'))return;
 await runServer('Wird veröffentlicht …',async()=>{
  const r=await online.api('publish',{version:serverVersion});
  serverDocument=null; // A second publish requires loading the newly committed version.
  const text=r.message+' Stand: '+r.revision+(r.emailSent?'':' · Änderungs-E-Mail nicht bestätigt, siehe Protokoll.');
  // Publishing succeeded even if the subsequent refresh cannot be completed.
  try{await serverLoad();$('serverStatus').textContent=text;}
  catch{$('serverStatus').textContent=text+' · Neuer Serverstand konnte nicht geladen werden. Bitte Serverstand laden; nicht erneut veröffentlichen.';}
 },$('serverStatus'),$('serverPublish'));
};


function updateDraftStatus(){if(!baseline||!data)return;const n=countChanges(baseline,data);$('draftStatus').textContent=n?`${n} unveröffentlichte Änderungen (Einträge/Kategorien/Einstellungen)`:'Keine offenen Änderungen';$('draftWarning').textContent=data.revision!==baseline.revision?'Dieser lokale Entwurf basiert auf einer älteren Karte. Vor dem Weiterarbeiten exportieren oder die aktuelle veröffentlichte Karte laden.':'';}
$('loadPublished').onclick=()=>{if(confirm('Lokalen Entwurf durch die aktuelle veröffentlichte Karte ersetzen? Nicht exportierte Änderungen gehen verloren.')){data=structuredClone(baseline);persist();categories();select(data.drinks[0]?.id);$('mode').value=data.settings?.unavailableMode||'show';}};
$('removePhoto').onclick=()=>{$('photo').value='';$('upload').value='';newPalette=null;dirty=true;preview();};

if($('printPDF'))$('printPDF').onclick=async()=>{
 const button=$('printPDF'),status=$('printStatus'),draft=$('printSource').value==='draft';
 if(draft&&dirty){status.textContent='Bitte den bearbeiteten Drink zuerst lokal speichern.';return;}
 button.disabled=true;status.textContent='Druckkarte wird erstellt …';
 try{
  const source=draft?structuredClone(data):(online?(await online.api('load')).published.document:await loadData());
  const {downloadMenuPDF}=await import('./print-menu.js?v=1');
  const r=await downloadMenuPDF(source,{draft});status.textContent=`PDF erstellt: ${r.pages} A5-Seiten, ${r.drinks} Einträge${draft?' · als Entwurf gekennzeichnet':''}.`;
 }catch(e){status.textContent='PDF konnte nicht erstellt werden: '+e.message;}finally{button.disabled=false;}
};
