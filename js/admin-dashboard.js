const $=id=>document.getElementById(id);
let initialized=false,access,active='dashboard',loading=false;
const sections=[
 ['drinks','Drinks verwalten','Namen, Preise, Zutaten und Bilder bearbeiten.'],
 ['categories','Kategorien verwalten','Kategorien und Verfügbarkeit ordnen.'],
 ['publication','Entwurf & Veröffentlichung','Speichern, Vorschau prüfen und veröffentlichen.'],
 ['print','Druckkarte als PDF','Veröffentlichte Karte oder Entwurf als A5-PDF.'],
 ['statistics','Besucherstatistik','Seitenaufrufe heute, in 7 und 30 Tagen sowie gesamt.'],
 ['users','Benutzer & Protokoll','Zugänge, Berechtigungen und Sicherheitsereignisse.'],
 ['settings','Einstellungen & Sicherheit','Import, Export und persönliche Kontosicherheit.']
];
function allowed(id){
 if(id==='dashboard')return true;
 if(id==='users')return access?.role==='admin';
 if(id==='statistics')return !!access?.api;
 return sections.some(s=>s[0]===id);
}
function move(parent,...elements){for(const el of elements)if(el)parent.append(el);}
function setup(){
 if(initialized)return;initialized=true;
 const draft=$('draftWorkspace'),toolbar=draft.querySelector('.toolbar');
 for(const [id,title,description] of sections){
  const button=document.createElement('button');button.className='dashboard-tile';button.type='button';button.dataset.view=id;
  const heading=document.createElement('strong');heading.textContent=title;
  const copy=document.createElement('span');copy.textContent=description;button.append(heading,copy);
  button.onclick=()=>show(id);$('dashboardTiles').append(button);
  const panel=document.createElement('section');panel.id='view-'+id;panel.className='admin-view';panel.hidden=true;
  panel.setAttribute('aria-label',title);$('adminViews').append(panel);
 }
 const dataTools=document.createElement('section');dataTools.id='dataTools';dataTools.className='notice';
 const title=document.createElement('h2');title.textContent='Daten importieren / exportieren';dataTools.append(title);
 move(dataTools,$('export'),$('import').closest('label'));move($('view-settings'),dataTools,$('securityPanel'));
 move($('view-publication'),draft.querySelector('aside'),draft.querySelector('[aria-label="Entwurfsstatus"]'),$('onlineTools'));
 move($('view-drinks'),toolbar,draft.querySelector('.workspace'));
 move($('view-categories'),draft.querySelector('.category-admin'));
 move($('view-print'),$('printPanel'));
 move($('view-users'),$('userManagement'),$('auditPanel'));
 move($('view-statistics'),$('statisticsPanel'));$('statisticsPanel').hidden=false;
 $('adminViews').before($('message'));
 $('dashboardBack').onclick=()=>show('dashboard');
 $('refreshStats').onclick=refreshStats;
 window.addEventListener('hashchange',()=>{if(access)show(location.hash.slice(1)||'dashboard',false);});
}
function show(id,updateHash=true){
 if(!allowed(id))id='dashboard';active=id;
 $('adminDashboard').hidden=id!=='dashboard';$('adminViewNav').hidden=id==='dashboard';
 $('adminViews').hidden=id==='dashboard';
 for(const [name]of sections)$('view-'+name).hidden=name!==id;
 $('adminViewTitle').textContent=sections.find(s=>s[0]===id)?.[1]||'';
 if(updateHash)history.replaceState(null,'',location.pathname+location.search+(id==='dashboard'?'':'#'+id));
 const focus=id==='dashboard'?$('dashboardTitle'):$('adminViewTitle');focus.focus({preventScroll:true});
 window.scrollTo({top:0,behavior:'instant'});
 if(id==='statistics')void refreshStats();
}
async function refreshStats(){
 if(!access?.api||loading)return;loading=true;$('refreshStats').disabled=true;
 $('statisticsStatus').textContent='Statistik wird geladen …';
 for(const key of ['today','last7','last30','total'])$('stats-'+key).textContent='–';
 try{
  const result=await access.api('statistics');
  for(const key of ['today','last7','last30','total'])$('stats-'+key).textContent=Number(result[key]).toLocaleString('de-AT');
  $('statisticsStatus').textContent='Stand: '+new Date().toLocaleString('de-AT')+' · Tagesgrenze: Wien'+(result.since?' · Erfassung seit '+new Date(result.since+'T12:00:00').toLocaleDateString('de-AT'):' · Noch keine Aufrufe erfasst.');
 }catch{$('statisticsStatus').textContent='Statistik derzeit nicht erreichbar. Die Barkarte und die übrige Verwaltung bleiben verfügbar. Bitte später erneut laden.';}
 finally{loading=false;$('refreshStats').disabled=false;}
}
export function startDashboard(connection){
 if(!$('adminDashboard'))return; // Cached pre-dashboard HTML remains usable during rollout.
 setup();access=connection;
 for(const button of $('dashboardTiles').children)button.hidden=!allowed(button.dataset.view);
 const readOnly=connection.role==='viewer';
 for(const id of ['view-drinks','view-categories','dataTools'])$(id).inert=readOnly;
 $('dashboardMode').textContent=connection.api?(readOnly?'Lesezugriff · Änderungen sind für deine Rolle gesperrt.':'Was möchtest du tun?'):'Lokaler Entwurf · ohne Online-Veröffentlichung';
 $('offlineMode').hidden=true;$('loginForm').hidden=!!connection.api;
 $('securityPanel').hidden=!connection.api;
 show('dashboard');
}
