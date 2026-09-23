import {ApiError,parseClaims} from './policy.js';

// The UV bit is signed as part of authenticatorData. It becomes trusted ONLY
// after Supabase verifies the exact assertion and returns a fresh session.
export function requireVerifiedDevice(input,origin){
 const c=input?.credential;
 const decode=s=>{if(typeof s!=='string'||s.length>20000||!/^[A-Za-z0-9_-]+$/.test(s))throw Error();return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),x=>x.charCodeAt(0));};
 try{
  if(typeof input.challengeId!=='string'||input.challengeId.length>100||c?.type!=='public-key'||typeof c.id!=='string')throw Error();
  const auth=decode(c.response?.authenticatorData);
  if(auth.length<37||(auth[32]&5)!==5)throw Error(); // UP and UV are both mandatory.
  const data=JSON.parse(new TextDecoder().decode(decode(c.response?.clientDataJSON)));
  if(data.type!=='webauthn.get'||data.origin!==origin||data.crossOrigin===true)throw Error();
  decode(c.response?.signature);decode(c.rawId);
  if(JSON.stringify(input).length>60000)throw Error();
 }catch{throw new ApiError(403,'Passkey muss mit Face ID, Touch ID oder Gerätesperre bestätigt werden. Alternativ Passwort und Code verwenden.');}
 return c;
}

export async function completePasskey(input,{origin,env,db,checked,audit}){
 const credential=requireVerifiedDevice(input,origin);
 // Auth owns challenge expiry, single use, RP/origin checks and signature
 // verification. Never accept tokens supplied alongside a client assertion.
 const response=await fetch(env('SUPABASE_URL')+'/auth/v1/passkeys/authentication/verify',{
  method:'POST',headers:{apikey:env('SUPABASE_ANON_KEY'),'Content-Type':'application/json'},
  body:JSON.stringify({challenge_id:input.challengeId,credential}),signal:AbortSignal.timeout(15000)
 });
 if(!response.ok)throw new ApiError(401,'Passkey-Anmeldung nicht bestätigt. Bitte erneut versuchen.');
 const result=await response.json();
 if(typeof result.access_token!=='string'||typeof result.refresh_token!=='string')throw new ApiError(401,'Keine gültige Passkey-Sitzung.');
 const claims=parseClaims(result.access_token);
 const {data:auth,error}=await db.auth.getUser(result.access_token);
 if(error||!auth.user||claims.sub!==auth.user.id||!claims.session_id||!(claims.exp*1000>Date.now()))throw new ApiError(401,'Ungültige Passkey-Sitzung.');
 const actor=auth.user.id;
 if(!await checked(db.rpc('bar_session_valid',{p_session:claims.session_id,p_user:actor})))throw new ApiError(401,'Sitzung beendet.');
 const member=await checked(db.from('bar_members').select('*').eq('user_id',actor).maybeSingle());
 if(!member?.enabled||!['admin','editor','viewer'].includes(member.role))throw new ApiError(403,'Kein freigeschalteter Zugang.');
 // Only service_role may write this table. The grant is bound to the Auth
 // session and user, expires after eight hours, and never changes JWT AAL.
 await checked(db.from('bar_passkey_sessions').insert({session_id:claims.session_id,user_id:actor,expires_at:new Date(Date.now()+8*60*60*1000).toISOString()}));
 await audit(actor,'auth.passkey_device_verified');
 return {access_token:result.access_token,refresh_token:result.refresh_token};
}
