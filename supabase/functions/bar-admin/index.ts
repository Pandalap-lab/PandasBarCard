import { createClient } from 'npm:@supabase/supabase-js@2.105.0';
import {ApiError,authorize,validateMenu,parseClaims} from './policy.js';
const env=(k:string)=>{const v=Deno.env.get(k);if(!v)throw new Error('Missing configuration: '+k);return v;};
const db=createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
const origin=env('ADMIN_ORIGIN');
const checked=async(q:any)=>{const {data,error}=await q;if(error)throw new ApiError(409,'Vorgang nicht abgeschlossen. Daten neu laden oder Administrator kontaktieren.');return data;};
const audit=(actor:string|null,event:string,details={})=>checked(db.from('bar_audit').insert({actor,event,details}));
async function mail(to:string,subject:string,text:string){
 const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env('RESEND_API_KEY'),'Content-Type':'application/json'},body:JSON.stringify({from:env('MAIL_FROM'),to:[to],subject,text})});
 if(!r.ok)throw new ApiError(502,'E-Mail konnte nicht versendet werden.');
}
async function notice(actor:string,event:string,details:any){
 try{await mail(env('SECURITY_EMAIL'),'PANDAsBarCard: '+event,JSON.stringify({at:new Date().toISOString(),actor,...details},null,2));return true;}
 catch{await audit(actor,'email.failed',{event});return false;}
}
async function github(path:string,method='GET',body?:any){
 const r=await fetch('https://api.github.com/repos/'+env('GITHUB_REPOSITORY')+path,{method,headers:{Authorization:'Bearer '+env('GITHUB_TOKEN'),Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json','User-Agent':'PandasBarCard'},body:body?JSON.stringify(body):undefined});
 if(!r.ok)throw new ApiError(r.status===409||r.status===422?409:502,'GitHub-Vorgang fehlgeschlagen. Bei Konflikt Daten neu laden.');
 return r.json();
}
const decode=(s:string)=>new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,'')),c=>c.charCodeAt(0)));
const encode=(s:string)=>{const bytes=new TextEncoder().encode(s);let bin='';for(let i=0;i<bytes.length;i+=8192)bin+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(bin);};
async function published(){
 const result=await github('/contents/data/drinks.json?ref='+encodeURIComponent(env('GITHUB_BRANCH')));
 // Contents API omits content for larger files: fetch the Git blob, never a caller-provided URL.
 const blob=result.content?result:await github('/git/blobs/'+result.sha);
 return {document:validateMenu(JSON.parse(decode(blob.content))),sha:result.sha};
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
  const policy:Record<string,string>={load:'read',save:'save',publish:'publish',users:'users',createUser:'users',updateUser:'users',resetPassword:'users',audit:'audit'};
  if(!policy[action])throw new ApiError(400,'Unbekannte Aktion.');authorize(member,claims,policy[action]);
  if(action==='load'){
   const live=await published();const draft=await checked(db.from('bar_draft').select('*').eq('id',1).single());
   return reply({published:live,...draft,document:draft.document??live.document,base_sha:draft.base_sha??live.sha});
  }
  if(action==='save'){
   const document=validateMenu(input.document);if(!Number.isInteger(input.version)||!/^[a-f0-9]{40}$/.test(input.base_sha))throw new ApiError(400,'Versionsangabe fehlt.');
   const version=await checked(db.rpc('bar_save',{p_actor:actor,p_version:input.version,p_document:document,p_sha:input.base_sha}));
   return reply({version});
  }
  if(action==='publish'){
   if(!Number.isInteger(input.version))throw new ApiError(400,'Versionsangabe fehlt.');
   if(!await checked(db.rpc('bar_limit',{p_key:actor+':publish',p_max:3})))throw new ApiError(429,'Bitte vor der nächsten Veröffentlichung warten.');
   const lock=crypto.randomUUID();
   const draft=await checked(db.from('bar_draft').update({publish_lock:lock,lock_at:new Date().toISOString()}).eq('id',1).eq('version',input.version).is('publish_lock',null).select().maybeSingle());
   if(!draft)throw new ApiError(409,'Kein gespeicherter Entwurf oder Veröffentlichung läuft.');
   if(!draft.document){await checked(db.from('bar_draft').update({publish_lock:null,lock_at:null}).eq('publish_lock',lock));throw new ApiError(409,'Zuerst Entwurf speichern.');}
   // Keep the lock on ambiguous network failure. Owner reconciles GitHub before unlocking.
   await audit(actor,'publish.started',{version:draft.version,lock});
   const live=await published();if(live.sha!==draft.base_sha){await checked(db.from('bar_draft').update({publish_lock:null,lock_at:null}).eq('publish_lock',lock));throw new ApiError(409,'GitHub wurde inzwischen geändert. Änderungen zuerst abgleichen.');}
   const document=validateMenu(draft.document);document.revision='published-'+new Date().toISOString();
   const result=await github('/contents/data/drinks.json','PUT',{message:'Barkarte veröffentlichen (Entwurf '+draft.version+')',content:encode(JSON.stringify(document,null,2)+'\n'),sha:live.sha,branch:env('GITHUB_BRANCH')});
   await checked(db.from('bar_draft').update({document,base_sha:result.content.sha,version:draft.version+1,publish_lock:null,lock_at:null}).eq('publish_lock',lock));
   await audit(actor,'publish.committed',{commit:result.commit.sha,version:draft.version});
   const emailSent=await notice(actor,'Veröffentlichung',{commit:result.commit.sha});
   return reply({commit:result.commit.sha,emailSent,message:'Commit erstellt. GitHub Pages muss den neuen Stand noch ausliefern.'});
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
