import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {authorize,validateMenu,parseClaims} from '../supabase/functions/bar-admin/policy.js';
const menu=JSON.parse(readFileSync(new URL('../data/drinks.json',import.meta.url)));
test('Role and MFA policy denies writes and administration to unauthorized users',()=>{
 for(const role of ['admin','editor','viewer']){
  assert.throws(()=>authorize({role,enabled:true},{aal:'aal1'},'save'));
  assert.throws(()=>authorize({role,enabled:false},{aal:'aal2'},'read'));
  authorize({role,enabled:true},{aal:'aal2'},'read');
 }
 for(const role of ['editor','viewer'])for(const action of ['publish','users','audit'])assert.throws(()=>authorize({role,enabled:true},{aal:'aal2'},action));
 assert.throws(()=>authorize({role:'viewer',enabled:true},{aal:'aal2'},'save'));
 authorize({role:'admin',enabled:true},{aal:'aal2'},'publish');
 authorize({role:'editor',enabled:true},{aal:'aal2'},'save');
 assert.throws(()=>parseClaims('not-a-jwt'));
});
test('Current source imports and rejects malformed prices, category links and unsafe images',()=>{
 validateMenu(menu);
 for(const photo of ['javascript:alert(1)','images/../secret.png','https://evil.example/a.png','data:image/svg+xml;base64,AAAA','data:image/png;base64,YmFk']){
  const m=structuredClone(menu);m.drinks[0].photo=photo;assert.throws(()=>validateMenu(m));
 }
 for(const price of [-1,10000,'18']){const m=structuredClone(menu);m.drinks[0].price=price;assert.throws(()=>validateMenu(m));}
 const m=structuredClone(menu);m.drinks[0].categoryId='missing';assert.throws(()=>validateMenu(m));
});
test('Database migration: isolation, audit, concurrency, last admin, email recovery hook',async()=>{
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role;create role supabase_auth_admin;create schema auth;create table auth.users(id uuid primary key);create table auth.sessions(id uuid,user_id uuid,not_after timestamptz);create table auth.audit_log_entries(payload jsonb);`);
 await db.exec(readFileSync(new URL('../supabase/migrations/202609230001_admin.sql',import.meta.url),'utf8'));
 await db.exec(readFileSync(new URL('../supabase/migrations/202609230002_sessions.sql',import.meta.url),'utf8'));
 const a='11111111-1111-4111-8111-111111111111', b='22222222-2222-4222-8222-222222222222';
 await db.query('insert into auth.users values($1),($2)',[a,b]);
 await db.query('insert into auth.sessions(id,user_id) values($1,$1)',[a]);
 assert.equal((await db.query('select bar_session_valid($1,$1) as ok',[a])).rows[0].ok,true);
 assert.equal((await db.query('select bar_session_valid($1,$2) as ok',[a,b])).rows[0].ok,false);
 await db.query('delete from auth.sessions where id=$1',[a]);
 assert.equal((await db.query('select bar_session_valid($1,$1) as ok',[a])).rows[0].ok,false);
 await db.exec(`insert into auth.audit_log_entries values('{"action":"login","actor_id":"test","token":"must-not-copy"}')`);
 const authEvent=(await db.query("select details from bar_audit where event='auth.login'")).rows[0].details;
 assert.deepEqual(authEvent,{actor_id:'test'});
 await db.query("insert into bar_members(user_id,email,role) values($1,'a@example.test','admin'),($2,'b@example.test','editor')",[a,b]);
 await db.exec('set role anon');
 await assert.rejects(db.query('select * from bar_members'));
 await assert.rejects(db.query('select bar_save($1,0,$2,$3)',[a,{},'sha']));
 await db.exec('reset role;set role authenticated');await assert.rejects(db.query('select * from bar_draft'));
 await db.exec('reset role;set role service_role');
 assert.equal((await db.query('select bar_save($1,0,$2,$3) as v',[a,menu,'sha'])).rows[0].v,1);
 await assert.rejects(db.query('select bar_save($1,0,$2,$3)',[a,menu,'sha']));
 await assert.rejects(db.query('select bar_member_update($1,$1,$2,false)',[a,'admin']));
 await db.query('select bar_member_update($1,$2,$3,true)',[a,b,'admin']);
 await db.query('select bar_member_update($1,$1,$2,false)',[a,'admin']);
 await assert.rejects(db.exec("delete from bar_audit"));
 assert.equal((await db.query('select bar_limit($1,1) as ok',['key'])).rows[0].ok,true);
 assert.equal((await db.query('select bar_limit($1,1) as ok',['key'])).rows[0].ok,false);
 await db.exec('reset role;set role supabase_auth_admin');
 assert.equal((await db.query("select block_public_auth_email('{}') as r")).rows[0].r.error.http_code,403);
 await db.close();
});
