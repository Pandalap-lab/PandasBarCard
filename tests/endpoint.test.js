import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const env={SUPABASE_URL:'https://unit.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-only',ADMIN_ORIGIN:'https://pandalap-lab.github.io',GITHUB_REPOSITORY:'Pandalap-lab/PandasBarCard',GITHUB_BRANCH:'main',GITHUB_TOKEN:'test-only',RESEND_API_KEY:'test-only',MAIL_FROM:'test@example.test',SECURITY_EMAIL:'security@example.test'};
let handler,role='admin',aal='aal2',enabled=true,sha='a'.repeat(40),publishWrites=0,session=true,updates=[],version=1;
const id='11111111-1111-4111-8111-111111111111';
const doc=JSON.parse(readFileSync(new URL('../data/drinks.json',import.meta.url)));
globalThis.Deno={env:{get:k=>env[k]},serve:fn=>{handler=fn;}};
globalThis.fetch=async(url,opts={})=>{
 const u=new URL(url instanceof Request?url.url:url),path=u.pathname;
 const respond=(v,status=200)=>new Response(v===null?null:JSON.stringify(v),{status,headers:{'Content-Type':'application/json'}});
 if(path==='/auth/v1/user')return respond({id,email:'test@example.test'});
 if(path.endsWith('/rpc/bar_session_valid'))return respond(session);
 if(path.endsWith('/rpc/bar_limit'))return respond(true);
 if(path.endsWith('/bar_members'))return respond({user_id:id,email:'test@example.test',role,enabled});
 if(path.endsWith('/bar_audit'))return respond(null,201);
 if(path.endsWith('/bar_draft'))return respond({id:1,version,document:doc});
 if(path.endsWith('/rpc/bar_publish')){publishWrites++;return respond(2);}
 if(u.hostname==='api.resend.com')return respond({id:'test'});
 throw Error('Unexpected mocked request '+path);
};
let src=readFileSync(new URL('../supabase/functions/bar-admin/index.ts',import.meta.url),'utf8');
src=src.replace('npm:@supabase/supabase-js@2.105.0',import.meta.resolve('@supabase/supabase-js')).replace('./policy.js',new URL('../supabase/functions/bar-admin/policy.js',import.meta.url).href);
await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(src)).toString('base64'));
const request=(action,origin=env.ADMIN_ORIGIN)=>{
 const token='x.'+Buffer.from(JSON.stringify({sub:id,aal,session_id:id,exp:Date.now()/1000+900})).toString('base64url')+'.x';
 return handler(new Request('https://unit.supabase.co/functions/v1/bar-admin',{method:'POST',headers:{origin,authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({action,version})}));
};
test('HTTP endpoint rejects origin, disabled users, revoked sessions, missing MFA and wrong roles before writes',async()=>{
 assert.equal((await request('publish','https://evil.example')).status,403);
 enabled=false;assert.equal((await request('publish')).status,403);enabled=true;
 session=false;assert.equal((await request('publish')).status,401);session=true;
 aal='aal1';assert.equal((await request('publish')).status,403);aal='aal2';
 role='editor';assert.equal((await request('publish')).status,403);role='viewer';assert.equal((await request('users')).status,403);role='admin';
 assert.equal(publishWrites,0);
});
test('Publication commits a Supabase snapshot without any GitHub call',async()=>{
 const response=await request('publish');assert.equal(response.status,200);assert.equal((await response.json()).revision,2);assert.equal(publishWrites,1);
});
