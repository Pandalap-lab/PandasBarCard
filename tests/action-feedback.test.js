import test from 'node:test';
import assert from 'node:assert/strict';
import {createActionRunner} from '../js/action-feedback.js';
const button=disabled=>({disabled,textContent:'Speichern',attributes:{},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];}});
test('Slow backend: one request, visible pending state, blocked edits and role restrictions restored',async()=>{
 const a=button(false),b=button(true),region={inert:false},status={textContent:''};let finish,calls=0;
 const run=createActionRunner({buttons:[a,b],regions:[region],status,vibrate(){throw Error('Unsupported');}});
 const first=run('Wird gespeichert …',async()=>{calls++;await new Promise(resolve=>finish=resolve);status.textContent='Server bestätigt.';});
 assert.equal(a.textContent,'Wird gespeichert …');assert.equal(a.disabled,true);assert.equal(region.inert,true);assert.equal(status.textContent,'Wird gespeichert …');
 await run('Wird gespeichert …',()=>calls++);assert.equal(calls,1);finish();await first;
 assert.equal(a.disabled,false);assert.equal(b.disabled,true);assert.equal(region.inert,false);assert.equal(status.textContent,'Server bestätigt.');assert.equal(run.busy,false);
});
test('Failure does not claim success and unlocks retry',async()=>{
 const a=button(false),status={textContent:''};const run=createActionRunner({buttons:[a],status,vibrate(){}});
 await run('Wird gespeichert …',()=>{throw Error('Versionskonflikt. Bitte laden.');});assert.equal(status.textContent,'Versionskonflikt. Bitte laden.');assert.equal(a.disabled,false);
 await run('Wird gespeichert …',()=>{status.textContent='Bestätigt';});assert.equal(status.textContent,'Bestätigt');
});
test('Touch browsers without button focus still label the actual initiating action',async()=>{
 const a=button(false),b=button(false),status={textContent:''};let finish;
 const run=createActionRunner({buttons:[a,b],primary:b,status,vibrate(){}});
 const task=run('Wird veröffentlicht …',()=>new Promise(resolve=>finish=resolve));
 assert.equal(a.textContent,'Speichern');assert.equal(b.textContent,'Wird veröffentlicht …');finish();await task;assert.equal(b.textContent,'Speichern');
});
