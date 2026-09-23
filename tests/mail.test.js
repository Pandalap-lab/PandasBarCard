import test from 'node:test';
import assert from 'node:assert/strict';
import {gmailMessage,sendMail} from '../supabase/functions/bar-admin/mail.js';
test('Gmail MIME preserves umlauts and rejects header injection',()=>{
 const raw=gmailMessage('sender@gmail.com','admin@example.com','Passwort zurücksetzen','Grüße\nhttps://example.com/#token_hash=test');
 const mime=Buffer.from(raw,'base64url').toString('utf8');
 assert.match(mime,/Content-Type: text\/plain; charset=UTF-8/);
 const body=Buffer.from(mime.split('\r\n\r\n')[1].replace(/\r\n/g,''),'base64').toString('utf8');
 assert.equal(body,'Grüße\nhttps://example.com/#token_hash=test');
 assert.throws(()=>gmailMessage('sender@gmail.com','a@example.com\r\nBcc: b@example.com','Test','Body'));
 assert.throws(()=>gmailMessage('sender@gmail.com','a@example.com','Test\r\nBcc: b@example.com','Body'));
});
test('Gmail refresh credentials remain server-side; only access token goes to send endpoint',async()=>{
 const config={MAIL_PROVIDER:'gmail',MAIL_FROM:'sender@gmail.com',GMAIL_CLIENT_ID:'test-client',GMAIL_CLIENT_SECRET:'test-secret',GMAIL_REFRESH_TOKEN:'test-refresh'};
 const calls=[];
 await sendMail(k=>config[k],'admin@example.com','Test','Body',async(url,options)=>{
  calls.push(url);
  if(url==='https://oauth2.googleapis.com/token'){
   assert.equal(options.body.get('grant_type'),'refresh_token');return Response.json({access_token:'test-access'});
  }
  assert.equal(url,'https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
  assert.equal(options.headers.Authorization,'Bearer test-access');assert.ok(!options.body.includes('test-secret'));return Response.json({id:'sent'});
 });
 assert.equal(calls.length,2);
 let attempts=0;
 await assert.rejects(sendMail(k=>config[k],'admin@example.com','Test','Body',async()=>{attempts++;return new Response('',{status:401});}));
 assert.equal(attempts,1);
});
