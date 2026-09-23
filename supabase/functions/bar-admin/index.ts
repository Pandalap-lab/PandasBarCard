import { createClient } from 'npm:@supabase/supabase-js@2.105.0';
import {sendMail} from './mail.js';
import {ApiError,authorize,validateMenu,parseClaims} from './policy.js';
const defaults:Record<string,string>={MAIL_PROVIDER:'resend',ADMIN_ORIGIN:'https://pandalap-lab.github.io',ADMIN_URL:'https://pandalap-lab.github.io/PandasBarCard/admin/'};
const env=(k:string)=>{const v=Deno.env.get(k)||defaults[k];if(!v)throw new Error('Missing configuration: '+k);return v;};
const db=createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
const origin=env('ADMIN_ORIGIN');
const checked=async(q:any)=>{const {data,error}=await q;if(error)throw new ApiError(409,'Vorgang nicht abgeschlossen. Daten neu laden oder Administrator kontaktieren.');return data;};
const audit=(actor:string|null,event:string,details={})=>checked(db.from('bar_audit').insert({actor,event,details}));
async function mail(to:string,subject:string,text:string){
 try{await sendMail(env,to,subject,text);}catch{throw new ApiError(502,'E-Mail konnte nicht bestätigt werden. Versandkonfiguration prüfen; bei Zeitüberschreitung zunächst Posteingang prüfen.');}
}
async function notice(actor:string,event:string,details:any){
 try{await mail(env('SECURITY_EMAIL'),'PANDAsBarCard: '+event,JSON.stringify({at:new Date().toISOString(),actor,...details},null,2));return true;}
 catch{await audit(actor,'email.failed',{event});return false;}
}
const storagePrefix=env('SUPABASE_URL')+'/storage/v1/object/public/bar-published/';
const refPattern=/^storage:([a-f0-9]{64}\.(?:webp|png|jpg))$/;
async function published(){
 const row=await checked(db.from('bar_published').select('*').eq('id',1).maybeSingle());
 if(!row)throw new ApiError(409,'Die Erstübernahme der veröffentlichten Karte fehlt.');
 return row;
}
function imageBytes(value:string){
 const match=/^data:image\/(webp|png|jpeg);base64,([A-Za-z0-9+/]+=*)$/.exec(value);
 if(!match||value.length>2700000)throw new ApiError(400,'Bild ungültig oder zu groß.');
 const bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));
 const head=String.fromCharCode(...bytes.subarray(0,12));
 if(bytes.length>2000000||!(match[1]==='webp'&&head.startsWith('RIFF')&&head.slice(8)==='WEBP'||match[1]==='png'&&head.startsWith('\x89PNG\r\n\x1a\n')||match[1]==='jpeg'&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255))throw new ApiError(400,'Kein unterstütztes Rasterbild.');
 return {bytes,type:'image/'+match[1],ext:match[1]==='jpeg'?'jpg':match[1]};
}
async function storeImage(value:string){
 const {bytes,type,ext}=imageBytes(value);
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const path=digest+'.'+ext;
 const {error}=await db.storage.from('bar-drafts').upload(path,bytes,{contentType:type,upsert:false});
 if(error&&String(error.statusCode)!=='409')throw new ApiError(502,'Bild konnte nicht gespeichert werden.');
 return 'storage:'+path;
}
async function photoMap(document:any){
 const refs=[...new Set<string>(document.drinks.map((x:any)=>x.photo).filter((x:any)=>refPattern.test(x)))];
 const map:Record<string,string>={};
 for(const ref of refs){const result=await checked(db.storage.from('bar-drafts').createSignedUrl(ref.slice(8),3600));map[ref]=result.signedUrl;}
 return map;
}
async function publicDocument(d:any){
 const result=structuredClone(d);
 const photos=new Map<string,string>();
 for(const drink of result.drinks){
  const photo=drink.photo;if(!photo)continue;
  if(!refPattern.test(photo)){
   if(photo.startsWith('data:'))throw new ApiError(409,'Bilder zuerst auf dem Server speichern.');
   continue;
  }
  if(!photos.has(photo)){
   const path=photo.slice(8);const blob=await checked(db.storage.from('bar-drafts').download(path));
   const upload=await db.storage.from('bar-published').upload(path,blob,{contentType:blob.type,cacheControl:'31536000',upsert:false});
   if(upload.error&&String(upload.error.statusCode)!=='409')throw new ApiError(502,'Bild konnte nicht veröffentlicht werden.');
   photos.set(photo,storagePrefix+path);
  }
  drink.photo=photos.get(photo);
 }
 result.revision='published-'+new Date().toISOString();return result;
}
async function body(req:Request){
 if(!req.headers.get('content-type')?.startsWith('application/json'))throw new ApiError(415,'JSON erforderlich.');
 const reader=req.body?.getReader();if(!reader)return {};
 let size=0;const parts:Uint8Array[]=[];
 while(true){const x=await reader.read();if(x.done)break;size+=x.value.length;if(size>5000000){await reader.cancel();throw new ApiError(413,'Anfrage zu groß.');}parts.push(x.value);}
 const all=new Uint8Array(size);let at=0;for(const x of parts){all.set(x,at);at+=x.length;}
 try{return JSON.parse(new TextDecoder().decode(all));}catch{throw new ApiError(400,'Ungültiges JSON.');}
}
Deno.serve(async(req)=>{
 const headers={'Access-Control-Allow-Origin':origin,'Vary':'Origin','Cache-Control':'no-store','Content-Type':'application/json','X-Content-Type-Options':'nosniff'};
 const reply=(v:any,status=200)=>new Response(JSON.stringify(v),{status,headers});
 if(req.headers.get('origin')!==origin)return reply({error:'Origin nicht erlaubt.'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Headers':'authorization,content-type,apikey,x-client-info','Access-Control-Allow-Methods':'POST'}});
 let actor:string|null=null;
 try{
  if(req.method!=='POST')throw new ApiError(405,'POST erforderlich.');
  const token=req.headers.get('authorization')?.replace(/^Bearer /,'');if(!token)throw new ApiError(401,'Anmeldung erforderlich.');
  // getUser verifies the supplied token with Auth BEFORE any decoded claim is trusted.
  const {data:auth,error}=await db.auth.getUser(token);if(error||!auth.user)throw new ApiError(401,'Sitzung abgelaufen.');actor=auth.user.id;
  const claims=parseClaims(token);if(claims.sub!==actor||claims.exp*1000<=Date.now())throw new ApiError(401,'Sitzung abgelaufen.');
  if(!claims.session_id||!await checked(db.rpc('bar_session_valid',{p_session:claims.session_id,p_user:actor})))throw new ApiError(401,'Sitzung beendet.');
  const member=await checked(db.from('bar_members').select('*').eq('user_id',actor).maybeSingle());
  authorize(member,claims,'session');
  if(!await checked(db.rpc('bar_limit',{p_key:actor,p_max:60})))throw new ApiError(429,'Zu viele Anfragen. Bitte eine Minute warten.');
  const input=await body(req);const action=input.action;
  if(action==='session')return reply({email:member.email,role:member.role,aal:claims.aal});
  const policy:Record<string,string>={load:'read',save:'save',publish:'publish',upload:'save',users:'users',createUser:'users',updateUser:'users',resetPassword:'users',testMail:'users',audit:'audit'};
  if(!policy[action])throw new ApiError(400,'Unbekannte Aktion.');authorize(member,claims,policy[action]);
  if(action==='testMail'){
   if(!await checked(db.rpc('bar_limit',{p_key:actor+':test-mail',p_max:1})))throw new ApiError(429,'Bitte eine Minute bis zur nächsten Testmail warten.');
   const recipient=env('SECURITY_EMAIL');
   try{await mail(recipient,'PANDAsBarCard - Testmail','Der E-Mail-Versand der PANDAsBarCard ist eingerichtet. Diese Testmail wurde durch einen angemeldeten Administrator ausgelöst.\n\nAbsender: '+env('MAIL_FROM')+'\nZeitpunkt: '+new Date().toISOString());}
   catch(e){await audit(actor,'email.failed',{event:'mail.test'});throw e;}
   await audit(actor,'mail.test.sent');return reply({ok:true,recipient});
  }
  if(action==='load'){
   const live=await published();const draft=await checked(db.from('bar_draft').select('*').eq('id',1).single());
   const document=draft.document??live.document;return reply({published:live,...draft,document,photos:await photoMap(document)});
  }
  if(action==='upload'){const photo=await storeImage(input.photo);const signed=await checked(db.storage.from('bar-drafts').createSignedUrl(photo.slice(8),3600));return reply({photo,url:signed.signedUrl});}
  if(action==='save'){
   const document=validateMenu(input.document);if(!Number.isInteger(input.version))throw new ApiError(400,'Versionsangabe fehlt.');
   for(const drink of document.drinks)if(drink.photo?.startsWith('data:'))drink.photo=await storeImage(drink.photo);
   const version=await checked(db.rpc('bar_save',{p_actor:actor,p_version:input.version,p_document:document,p_sha:null}));
   return reply({version,document,photos:await photoMap(document)});
  }
  if(action==='publish'){
   if(!Number.isInteger(input.version))throw new ApiError(400,'Versionsangabe fehlt.');
   if(!await checked(db.rpc('bar_limit',{p_key:actor+':publish',p_max:3})))throw new ApiError(429,'Bitte vor der nächsten Veröffentlichung warten.');
   const draft=await checked(db.from('bar_draft').select('*').eq('id',1).single());
   if(draft.version!==input.version||!draft.document)throw new ApiError(409,'Entwurf inzwischen geändert. Bitte neu laden.');
   const document=await publicDocument(validateMenu(draft.document));
   const revision=await checked(db.rpc('bar_publish',{p_actor:actor,p_version:input.version,p_document:document}));
   const emailSent=await notice(actor,'Veröffentlichung',{revision});
   return reply({revision,emailSent,message:'Veröffentlicht. Gäste sehen den neuen Stand beim nächsten Laden.'});
  }
  if(action==='users')return reply(await checked(db.from('bar_members').select('*').order('created_at')));
  if(action==='audit')return reply(await checked(db.from('bar_audit').select('*').order('id',{ascending:false}).limit(100)));
  if(action==='createUser'){
   if(!['admin','editor','viewer'].includes(input.role)||typeof input.email!=='string'||input.email.length>254||!/^\S+@\S+\.\S+$/.test(input.email))throw new ApiError(400,'E-Mail oder Rolle ungültig.');
   await audit(actor,'member.create.requested',{email:input.email,role:input.role});
   const user=await checked(db.auth.admin.createUser({email:input.email,email_confirm:true,password:crypto.randomUUID()+crypto.randomUUID()}));
   await checked(db.from('bar_members').insert({user_id:user.user.id,email:input.email,role:input.role}));
   await audit(actor,'member.created',{target:user.user.id,role:input.role});
   return reply({userId:user.user.id,message:'Konto angelegt. Administrator kann jetzt einen Einrichtungslink senden.'});
  }
  if(!/^[a-f0-9-]{36}$/.test(input.userId??''))throw new ApiError(400,'Benutzer fehlt.');
  const target=await checked(db.from('bar_members').select('*').eq('user_id',input.userId).single());
  if(action==='updateUser'){
   if(!['admin','editor','viewer'].includes(input.role)||typeof input.enabled!=='boolean')throw new ApiError(400,'Rolle ungültig.');
   await checked(db.rpc('bar_member_update',{p_actor:actor,p_target:target.user_id,p_role:input.role,p_enabled:input.enabled}));
   const emailSent=await notice(actor,'Berechtigung geändert',{target:target.email,role:input.role,enabled:input.enabled});return reply({ok:true,emailSent});
  }
  if(action==='resetPassword'){
   if(!target.enabled)throw new ApiError(409,'Benutzer ist gesperrt.');
   if(!await checked(db.rpc('bar_limit',{p_key:actor+':reset',p_max:3})))throw new ApiError(429,'Bitte warten.');
   await audit(actor,'password.reset.requested',{target:target.user_id});
   const link=await checked(db.auth.admin.generateLink({type:'recovery',email:target.email}));
   const url=new URL(env('ADMIN_URL'));url.hash=new URLSearchParams({token_hash:link.properties.hashed_token,type:'recovery'}).toString();
   try{await mail(target.email,'PANDAsBarCard: Passwort einrichten oder zurücksetzen','Ein Administrator hat diesen einmaligen Link angefordert. Er gilt 15 Minuten.\n\n'+url.href+'\n\nWenn dies unerwartet ist, bitte den Administrator kontaktieren.');}
   catch(e){await audit(actor,'email.failed',{event:'password.reset',target:target.user_id});throw e;}
   await audit(actor,'password.reset.sent',{target:target.user_id});await notice(actor,'Passwort-Reset angefordert',{target:target.email});return reply({ok:true});
  }
  throw new ApiError(400,'Unbekannte Aktion.');
 }catch(e){
  const status=e instanceof ApiError?e.status:500;
  if(actor&&status===403){try{await audit(actor,'access.denied');if(await checked(db.rpc('bar_limit',{p_key:actor+':denied-mail',p_max:1})))await notice(actor,'Zugriff verweigert',{});}catch{/* Do not mask denial. */}}
  return reply({error:e instanceof ApiError?e.message:'Serverfehler. Vorgang prüfen; nicht blind wiederholen.'},status);
 }
});
