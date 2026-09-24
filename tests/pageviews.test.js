import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {createPageviewCounter} from '../js/pageviews.js';
const url='https://pandalap-lab.github.io/PandasBarCard/';
test('Public document counts once; full reload creates a new count; admin/preview/local never count',async()=>{
 let writes=0;
 const fetcher=async(u,o)=>{
  if(o?.method==='POST'){writes++;assert.deepEqual(JSON.parse(o.body),{action:'pageview'});assert.equal(o.credentials,'omit');return new Response('{}');}
  return new Response(JSON.stringify({supabaseUrl:'https://test.supabase.co',publishableKey:'public-test'}));
 };
 const count=createPageviewCounter();await count({url,fetcher});
 await count({url:url+'#another-category',fetcher});assert.equal(writes,1);
 await createPageviewCounter()({url,fetcher});assert.equal(writes,2);
 for(const path of [url+'admin/',url+'?preview=1','http://127.0.0.1:8093/'])await createPageviewCounter()({url:path,fetcher});
 assert.equal(writes,2);
});
test('Unavailable or malformed statistics backend is isolated and never retried',async()=>{
 for(const fetcher of [async()=>{throw Error('offline');},async()=>new Response('invalid'),async()=>new Response('',{status:503})])await assert.doesNotReject(createPageviewCounter()({url,fetcher}));
 let calls=0;const count=createPageviewCounter();const fetcher=async()=>{calls++;throw Error('offline');};
 await count({url,fetcher});await count({url,fetcher});assert.equal(calls,1);
});
test('Aggregate database: correct inclusive day windows, atomic increment and private statistics',async()=>{
 const db=new PGlite();await db.exec('create role anon;create role authenticated;create role service_role;');
 await db.exec(readFileSync(new URL('../supabase/migrations/202609240001_pageviews.sql',import.meta.url),'utf8'));
 let stats=(await db.query('select bar_pageview_stats() as s')).rows[0].s;assert.equal(stats.total,0);assert.equal(stats.since,null);
 await db.exec(`insert into bar_pageviews(day,views) select (now() at time zone 'Europe/Vienna')::date-n,v from (values(0,2),(1,3),(6,5),(7,7),(29,11),(30,13)) a(n,v)`);
 stats=(await db.query('select bar_pageview_stats() as s')).rows[0].s;
 assert.equal(stats.today,2);assert.equal(stats.last7,10);assert.equal(stats.last30,28);assert.equal(stats.total,41);
 await db.exec('set role service_role');await Promise.all(Array.from({length:20},()=>db.query('select bar_count_pageview()')));
 stats=(await db.query('select bar_pageview_stats() as s')).rows[0].s;assert.equal(stats.today,22);assert.equal(stats.total,61);
 for(const role of ['anon','authenticated']){
  await db.exec('reset role;set role '+role);
  await assert.rejects(db.query('select * from bar_pageviews'));
  await assert.rejects(db.query('select bar_count_pageview()'));
  await assert.rejects(db.query('select bar_pageview_stats()'));
 }
 await db.exec('reset role');
 const cols=(await db.query("select column_name from information_schema.columns where table_name='bar_pageviews' order by ordinal_position")).rows.map(x=>x.column_name);
 assert.deepEqual(cols,['day','views']);await db.close();
});
