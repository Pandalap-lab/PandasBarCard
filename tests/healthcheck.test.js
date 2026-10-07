import test from 'node:test';
import assert from 'node:assert/strict';
import {checkHealth} from '../scripts/healthcheck.mjs';
const config={supabaseUrl:'https://unit.supabase.co',publishableKey:'public-test'};
test('Healthcheck makes one public GET, never counts a pageview or writes data',async()=>{
 let calls=0;await checkHealth(config,async(url,options)=>{calls++;assert.equal(url,'https://unit.supabase.co/rest/v1/bar_published?select=id&id=eq.1&limit=1');assert.equal(options.method,'GET');assert.equal(options.body,undefined);assert.deepEqual(Object.keys(options.headers).sort(),['Cache-Control','apikey']);return Response.json([{id:1}]);});assert.equal(calls,1);
});
test('Healthcheck fails visibly on paused/unreachable backend, missing row or malformed response',async()=>{
 for(const response of [new Response('',{status:503}),Response.json([]),Response.json({ok:true}),Response.json([{id:2}])])await assert.rejects(checkHealth(config,async()=>response));
 await assert.rejects(checkHealth({...config,supabaseUrl:'https://evil.example'},async()=>{throw Error('Must not fetch');}));
});
