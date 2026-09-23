import {createClient} from './vendor/supabase.js';
import {signInWithVerifiedPasskey} from './passkey-login.js';
const $=id=>document.getElementById(id);
let client,config,member,factorId;
const message=s=>{$('authMessage').textContent=s;};
export async function api(action,fields={}){
 const {data:{session}}=await client.auth.getSession();
 if(!session)throw Error('Bitte erneut anmelden.');
 const r=await fetch(config.supabaseUrl+'/functions/v1/bar-admin',{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json',apikey:config.publishableKey},body:JSON.stringify({action,...fields})});
 const result=await r.json();if(!r.ok)throw Error(result.error||'Server nicht erreichbar.');return result;
}
function checked(result){if(result.error)throw result.error;return result.data;}
const run=fn=>async e=>{e?.preventDefault();try{await fn();}catch(error){message(error.message);}};
async function ready(){
 member=await api('session');$('authIdentity').textContent=member.email+' · '+member.role;
 $('loginForm').hidden=true;$('signOut').hidden=false;$('securityPanel').hidden=false;
 if(!member.strongAuth){
  $('mfaPanel').hidden=false;const factors=checked(await client.auth.mfa.listFactors());
  factorId=factors.totp.find(x=>x.status==='verified')?.id;
  $('enrollMfa').hidden=!!factorId;$('verifyMfa').hidden=!factorId;
  message(factorId?'Bitte Code aus der Authenticator-App eingeben.':'Bitte zuerst den zweiten Faktor einrichten.');return;
 }
 $('mfaPanel').hidden=true;message(member.verifiedPasskey?'Mit gerätebestätigtem Passkey angemeldet.':'Angemeldet.');
 $('showPassword').hidden=member.aal!=='aal2';
 let step=$('securityStepUp');if(!step){step=document.createElement('button');step.id='securityStepUp';step.type='button';step.textContent='Passwort / Passkeys verwalten (mit Sicherheitscode)';$('securityPanel').append(step);}
 step.hidden=member.aal==='aal2';step.onclick=run(async()=>{const factors=checked(await client.auth.mfa.listFactors());factorId=factors.totp.find(x=>x.status==='verified')?.id;$('mfaPanel').hidden=false;$('enrollMfa').hidden=!!factorId;$('verifyMfa').hidden=!factorId;message('Nur für Änderungen an Passwort oder Passkeys: Sicherheitscode bestätigen.');});
 $('onlineTools').hidden=false;$('registerPasskey').hidden=!config.passkeysEnabled||!window.PublicKeyCredential||member.aal!=='aal2';
 if(config.passkeysEnabled&&member.aal==='aal2'){try{await passkeys();}catch{message('Passkey-Verwaltung derzeit nicht verfügbar. Passwort/TOTP bleibt nutzbar.');}}
 $('userManagement').hidden=member.role!=='admin';$('auditPanel').hidden=member.role!=='admin';
 const editor=await import('./admin.js?v=20260923-pdf');await editor.startOnline({api,role:member.role});
}
async function passkeys(){
 const keys=checked(await client.auth.passkey.list());$('passkeyList').replaceChildren();
 for(const key of keys){const row=document.createElement('p');row.textContent=key.friendly_name||key.id;const b=document.createElement('button');b.textContent='Passkey entfernen';b.onclick=run(async()=>{if(!confirm('Diesen Passkey dauerhaft entfernen? Passwort und Zwei-Faktor-Anmeldung bleiben verfügbar.'))return;checked(await client.auth.passkey.delete({passkeyId:key.id}));await passkeys();});row.append(b);$('passkeyList').append(row);}
}
async function users(){
 const list=await api('users');$('userList').replaceChildren();
 for(const user of list){
  const row=document.createElement('div');row.className='notice';const label=document.createElement('p');label.textContent=user.email+(user.enabled?'':' · gesperrt');
  const role=document.createElement('select');role.setAttribute('aria-label','Rolle für '+user.email);
  for(const [v,text]of [['viewer','Nur lesen'],['editor','Bearbeiten'],['admin','Administrator']]){const o=document.createElement('option');o.value=v;o.textContent=text;role.append(o);}role.value=user.role;
  const save=document.createElement('button');save.textContent='Rolle speichern';save.onclick=run(async()=>{await api('updateUser',{userId:user.user_id,role:role.value,enabled:user.enabled});await users();message('Rolle gespeichert.');});
  const block=document.createElement('button');block.textContent=user.enabled?'Zugang sperren':'Zugang freigeben';block.onclick=run(async()=>{if(confirm('Zugang für '+user.email+' ändern?')){await api('updateUser',{userId:user.user_id,role:user.role,enabled:!user.enabled});await users();}});
  const reset=document.createElement('button');reset.textContent='Passwort-Reset senden';reset.onclick=run(async()=>{if(confirm('Einmaligen Einrichtungs-/Reset-Link an '+user.email+' senden?')){await api('resetPassword',{userId:user.user_id});message('Reset-Link versendet.');}});
  row.append(label,role,save,block,reset);$('userList').append(row);
 }
}
export async function init(){
 $('offlineMode').onclick=run(async()=>{if(confirm('Nur lokalen Entwurf öffnen? Hier sind keine Online-Veröffentlichungen möglich.')){const m=await import('./admin.js?v=20260923-pdf');await m.startOffline();message('Lokaler Entwurfsmodus ohne Online-Zugriff.');}});
 try{
  config=await (await fetch('./config.json',{cache:'no-store'})).json();
  if(!config.supabaseUrl||!config.publishableKey){message('Online-Administration noch nicht eingerichtet. Die lokale Entwurfsfunktion bleibt verfügbar.');$('loginForm').inert=true;return;}
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl))throw Error('Ungültige Backend-Konfiguration.');
  // Auth credentials are held only in memory. Reload deliberately requires a new login.
  message('Bitte anmelden.');client=createClient(config.supabaseUrl,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false,experimental:{passkey:!!config.passkeysEnabled}}});
  $('loginForm').onsubmit=run(async()=>{checked(await client.auth.signInWithPassword({email:$('loginEmail').value,password:$('loginPassword').value}));$('loginPassword').value='';await ready();});
  $('passkeyLogin').hidden=!config.passkeysEnabled||!window.PublicKeyCredential;$('passkeyLogin').onclick=run(async()=>{const b=$('passkeyLogin');b.disabled=true;try{await signInWithVerifiedPasskey(client,config);await ready();}finally{b.disabled=false;}});
  $('signOut').onclick=run(async()=>{checked(await client.auth.signOut({scope:'local'}));location.reload();});
  $('signOutAll').onclick=run(async()=>{checked(await client.auth.signOut({scope:'global'}));location.reload();});
  $('enrollMfa').onclick=run(async()=>{const result=checked(await client.auth.mfa.enroll({factorType:'totp',friendlyName:'PANDAsBarCard'}));factorId=result.id;$('mfaQr').src=result.totp.qr_code;$('mfaQr').hidden=false;$('mfaSecret').textContent=result.totp.secret;$('verifyMfa').hidden=false;$('enrollMfa').disabled=true;});
  $('verifyMfa').onsubmit=run(async()=>{checked(await client.auth.mfa.challengeAndVerify({factorId,code:$('mfaCode').value}));$('mfaCode').value='';$('mfaSecret').textContent='';$('mfaQr').removeAttribute('src');$('mfaQr').hidden=true;await ready();});
  $('registerPasskey').onclick=run(async()=>{if(!window.PublicKeyCredential)throw Error('Dieser Browser unterstützt keine Passkeys. Bitte Safari oder Chrome auf deinem Gerät verwenden.');if(member?.aal!=='aal2')throw Error('Bitte zuerst die Zwei-Faktor-Anmeldung abschließen.');checked(await client.auth.registerPasskey());await passkeys();message('Passkey gespeichert. Bei der nächsten Anmeldung „Mit Passkey anmelden“ wählen; dein Gerät bestätigt mit Face ID, Touch ID oder Gerätesperre.');});
  $('passwordForm').onsubmit=run(async()=>{checked(await client.auth.updateUser({password:$('newPassword').value}));$('newPassword').value='';$('passwordPanel').hidden=true;message('Passwort geändert. Bitte anschließend zweiten Faktor bestätigen.');await ready();});
  $('showPassword').onclick=()=>{$('passwordPanel').hidden=false;};
  if($('testMail'))$('testMail').onclick=async()=>{const b=$('testMail'),status=$('mailTestStatus');b.disabled=true;status.textContent='Testmail wird gesendet …';try{const r=await api('testMail');status.textContent='Versand von Gmail bestätigt an '+r.recipient+'. Bitte Posteingang und Spamordner prüfen.';}catch(e){status.textContent=e.message;}finally{b.disabled=false;}};
  $('loadUsers').onclick=run(users);
  $('createUserForm').onsubmit=run(async()=>{await api('createUser',{email:$('newUserEmail').value,role:$('newUserRole').value});$('newUserEmail').value='';await users();message('Benutzer angelegt. Zum Einrichten „Passwort-Reset senden“ wählen.');});
  $('loadAudit').onclick=run(async()=>{const rows=await api('audit');$('auditLog').textContent=rows.map(x=>`${x.at} · ${x.event} · ${JSON.stringify(x.details)}`).join('\n');});
  const fragment=new URLSearchParams(location.hash.slice(1));
  if(fragment.has('token_hash')){
   history.replaceState(null,'',location.pathname);checked(await client.auth.verifyOtp({token_hash:fragment.get('token_hash'),type:'recovery'}));
   $('loginForm').hidden=true;$('passwordPanel').hidden=false;$('signOut').hidden=false;await ready();message('Bitte gegebenenfalls den zweiten Faktor bestätigen und ein neues Passwort festlegen.');
  }
 }catch(error){message(error.message);}
}
await init();
