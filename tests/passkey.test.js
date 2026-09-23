import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {requireVerifiedDevice,completePasskey} from '../supabase/functions/bar-admin/passkey.js';
import {authorize} from '../supabase/functions/bar-admin/policy.js';
const origin='https://pandalap-lab.github.io';
const id='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const b64=x=>Buffer.from(x).toString('base64url');
function assertion(flags=5){const a=Buffer.alloc(37);a[32]=flags;return {challengeId:'provider-challenge',credential:{id:'aQ',rawId:'aQ',type:'public-key',response:{authenticatorData:b64(a),clientDataJSON:b64(JSON.stringify({type:'webauthn.get',origin,challenge:'challenge'})),signature:'c2ln'}}};}
test('Passkey requires signed presence and verification flags plus same-origin WebAuthn response',()=>{
 requireVerifiedDevice(assertion(),origin);
 for(const f of [0,1,4])assert.throws(()=>requireVerifiedDevice(assertion(f),origin));
 for(const data of [{type:'webauthn.create',origin},{type:'webauthn.get',origin:'https://evil.test'},{type:'webauthn.get',origin,crossOrigin:true}]){
  const a=assertion();a.credential.response.clientDataJSON=b64(JSON.stringify(data));assert.throws(()=>requireVerifiedDevice(a,origin));
 }
 const a=assertion();a.credential.response.authenticatorData='bad!';assert.throws(()=>requireVerifiedDevice(a,origin));
});
test('Only provider-verified assertion creates a grant bound to the newly issued session',async()=>{
 const original=globalThis.fetch;let inserts=[],events=[],providerOK=false,active=true,memberEnabled=true;
 const token='x.'+b64(JSON.stringify({sub:id,session_id:id,exp:Date.now()/1000+900}))+'.x';
 const db={auth:{getUser:async()=>({data:{user:{id}}})},rpc:()=>({data:active}),from:table=>({select:()=>({eq:()=>({maybeSingle:()=>({data:{enabled:memberEnabled,role:'admin'}})})}),insert:row=>{inserts.push({table,row});return {data:null};}})};
 globalThis.fetch=async(url,opts)=>{
  assert.equal(url,'https://unit.supabase.co/auth/v1/passkeys/authentication/verify');
  assert.deepEqual(JSON.parse(opts.body),{challenge_id:'provider-challenge',credential:assertion().credential});
  return new Response(JSON.stringify(providerOK?{access_token:token,refresh_token:'server-issued'}:{}),{status:providerOK?200:401});
 };
 const deps={origin,env:k=>k==='SUPABASE_URL'?'https://unit.supabase.co':'public-test-key',db,checked:async x=>x.data,audit:async(...x)=>events.push(x)};
 try{
  // A client can forge UV bytes; failed provider signature verification still denies it.
  await assert.rejects(completePasskey(assertion(),deps));assert.equal(inserts.length,0);
  providerOK=true;active=false;await assert.rejects(completePasskey(assertion(),deps));assert.equal(inserts.length,0);
  active=true;memberEnabled=false;await assert.rejects(completePasskey(assertion(),deps));assert.equal(inserts.length,0);
  memberEnabled=true;const a={...assertion(),access_token:'attacker-token'};const result=await completePasskey(a,deps);
  assert.equal(result.access_token,token);assert.equal(inserts[0].row.session_id,id);assert.equal(inserts[0].row.user_id,id);
  assert.deepEqual(events,[[id,'auth.passkey_device_verified']]);
  providerOK=false;await assert.rejects(completePasskey(assertion(),deps));assert.equal(inserts.length,1);
 }finally{globalThis.fetch=original;}
});
test('Passkey grants preserve roles; caller claims cannot grant access',()=>{
 assert.throws(()=>authorize({enabled:true,role:'admin'},{aal:'aal1',verifiedPasskey:true,strongAuth:true},'publish'));
 authorize({enabled:true,role:'admin'},{aal:'aal1'},'publish',true);
 authorize({enabled:true,role:'editor'},{aal:'aal1'},'save',true);
 assert.throws(()=>authorize({enabled:true,role:'editor'},{aal:'aal1'},'publish',true));
 assert.throws(()=>authorize({enabled:true,role:'viewer'},{aal:'aal1'},'save',true));
 assert.throws(()=>authorize({enabled:false,role:'admin'},{aal:'aal1'},'publish',true));
});
test('Passkey grant SQL denies client access and rejects expired, revoked and wrong-user sessions',async()=>{
 const db=new PGlite();
 try{
  await db.exec('create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create table auth.sessions(id uuid primary key,user_id uuid,not_after timestamptz);');
  await db.exec(readFileSync(new URL('../supabase/migrations/202609240004_passkey_sessions.sql',import.meta.url),'utf8'));
  await db.query('insert into auth.users values($1),($2)',[id,other]);await db.query('insert into auth.sessions(id,user_id) values($1,$1)',[id]);
  for(const role of ['anon','authenticated']){
   await db.exec('set role '+role);
   await assert.rejects(db.query('insert into bar_passkey_sessions(session_id,user_id,expires_at) values($1,$1,now()+interval \'1 hour\')',[id]));
   await assert.rejects(db.query('select bar_passkey_session_valid($1,$1)',[id]));
   await db.exec('reset role');
  }
  await db.query("insert into bar_passkey_sessions(session_id,user_id,expires_at) values($1,$1,now()+interval '1 hour')",[id]);
  const valid=async(user=id)=>(await db.query('select bar_passkey_session_valid($1,$2) as ok',[id,user])).rows[0].ok;
  assert.equal(await valid(),true);assert.equal(await valid(other),false);
  await db.exec("update bar_passkey_sessions set expires_at=now()-interval '1 second'");assert.equal(await valid(),false);
  await db.exec("update bar_passkey_sessions set expires_at=now()+interval '1 hour';update auth.sessions set not_after=now()-interval '1 second'");assert.equal(await valid(),false);
  await db.exec('delete from auth.sessions');assert.equal(await valid(),false);assert.equal((await db.query('select count(*)::int as n from bar_passkey_sessions')).rows[0].n,0);
 }finally{await db.close();}
});
