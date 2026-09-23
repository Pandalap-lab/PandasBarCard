// Only sending permission is needed: https://www.googleapis.com/auth/gmail.send
const base64=s=>{
 const bytes=new TextEncoder().encode(s);let binary='';
 for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(binary);
};
export function gmailMessage(from,to,subject,text){
 const address=/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
 if(!address.test(from)||!address.test(to)||/[\r\n]/.test(subject)||subject.length>160)throw Error('Ungültige E-Mail-Adresse oder Betreff.');
 const encodedBody=base64(text).match(/.{1,76}/g)?.join('\r\n')||'';
 const mime=[`From: PANDAsBarCard <${from}>`,`To: ${to}`,`Subject: =?UTF-8?B?${base64(subject)}?=`,
  'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',encodedBody].join('\r\n');
 return base64(mime).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export async function sendMail(env,to,subject,text,request=fetch){
 const provider=env('MAIL_PROVIDER');
 if(provider==='gmail'){
  const raw=gmailMessage(env('MAIL_FROM'),to,subject,text);
  const tokenResponse=await request('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
   body:new URLSearchParams({client_id:env('GMAIL_CLIENT_ID'),client_secret:env('GMAIL_CLIENT_SECRET'),refresh_token:env('GMAIL_REFRESH_TOKEN'),grant_type:'refresh_token'}),signal:AbortSignal.timeout(15000)});
  if(!tokenResponse.ok)throw Error('Google-Versandfreigabe fehlt oder ist abgelaufen.');
  const token=await tokenResponse.json();if(typeof token.access_token!=='string')throw Error('Google-Versandfreigabe ungültig.');
  const result=await request('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'},body:JSON.stringify({raw}),signal:AbortSignal.timeout(15000)});
  // Never retry a send automatically: timeout may occur after delivery.
  if(!result.ok)throw Error('Gmail hat den Versand nicht bestätigt.');
  return;
 }
 if(provider!=='resend')throw Error('Maildienst nicht eingerichtet.');
 const response=await request('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env('RESEND_API_KEY'),'Content-Type':'application/json'},body:JSON.stringify({from:env('MAIL_FROM'),to:[to],subject,text}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('E-Mail konnte nicht versendet werden.');
}
