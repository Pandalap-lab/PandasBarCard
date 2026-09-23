const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const encode=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export async function signInWithVerifiedPasskey(client,config){
 if(!window.PublicKeyCredential)throw Error('Dieser Browser unterstützt keine Passkeys. Bitte Passwort und Code verwenden.');
 const {data,error}=await client.auth.passkey.startAuthentication();if(error)throw error;
 const options={...data.options,challenge:decode(data.options.challenge),userVerification:'required'};
 if(options.allowCredentials)options.allowCredentials=options.allowCredentials.map(c=>({...c,id:decode(c.id)}));
 let key;
 try{key=await navigator.credentials.get({publicKey:options});}
 catch(e){if(e.name==='NotAllowedError')throw Error('Passkey-Anmeldung abgebrochen oder nicht verfügbar. Erneut versuchen oder Passwort und Code verwenden.');throw e;}
 if(!key)throw Error('Kein Passkey bestätigt.');
 const r=key.response;
 const credential={id:key.id,rawId:encode(key.rawId),type:key.type,authenticatorAttachment:key.authenticatorAttachment,clientExtensionResults:key.getClientExtensionResults(),response:{authenticatorData:encode(r.authenticatorData),clientDataJSON:encode(r.clientDataJSON),signature:encode(r.signature),userHandle:r.userHandle?encode(r.userHandle):null}};
 const response=await fetch(config.supabaseUrl+'/functions/v1/bar-admin',{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({action:'passkeyComplete',challengeId:data.challenge_id,credential})});
 const session=await response.json();if(!response.ok)throw Error(session.error||'Passkey-Anmeldung fehlgeschlagen.');
 const saved=await client.auth.setSession({access_token:session.access_token,refresh_token:session.refresh_token});if(saved.error)throw saved.error;
}
