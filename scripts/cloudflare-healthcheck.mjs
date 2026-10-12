const origin=process.env.CARD_MONITOR_ORIGIN||'https://pandasbarcard.pandanuovo.com/candidate-test';
if(!['https://pandasbarcard.pandanuovo.com/candidate-test','https://pandasbarcard.pandanuovo.com'].includes(origin))throw Error('Unexpected monitor destination');
const checks=[];
try{
 for(const path of ['/healthz','/api/published']){
  const response=await fetch(origin+path,{headers:{Accept:'application/json'},redirect:'manual',signal:AbortSignal.timeout(15000)});
  if(response.status!==200)throw Error('Unexpected HTTP status');
  const value=await response.json();
  const pass=path==='/healthz'?value.ok===true&&value.scope==='published-row-only':Number.isInteger(value.revision)&&value.document?.drinks?.length===130&&value.document?.categories?.length===21;
  checks.push({path,pass});if(!pass)throw Error('Public inventory or health mismatch');
 }
 console.log(JSON.stringify({at:new Date().toISOString(),ok:true,origin,checks,visitorEndpointCalled:false,scope:'External HTTPS and public inventory; no administration, mail or restore test'}));
}catch(error){console.error(JSON.stringify({at:new Date().toISOString(),ok:false,origin,checks,errorType:error.name,visitorEndpointCalled:false}));process.exitCode=1;}
