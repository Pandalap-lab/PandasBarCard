// One attempt per document load. No interaction listeners, IDs, cookies or retries.
export function createPageviewCounter(){
 let started=false;
 return async function count({url=location.href,fetcher=fetch}={}){
  if(started)return;
  started=true;
  const page=new URL(url);
  if(page.origin!=='https://pandalap-lab.github.io'||
     !['/PandasBarCard/','/PandasBarCard/index.html'].includes(page.pathname)||
     page.searchParams.has('preview'))return;
  try{
   const configResponse=await fetcher(new URL('../admin/config.json',import.meta.url),{signal:AbortSignal.timeout(4000)});
   if(!configResponse.ok)return;
   const config=await configResponse.json();
   if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl))return;
   await fetcher(config.supabaseUrl+'/functions/v1/bar-admin',{
    method:'POST',headers:{'Content-Type':'application/json',apikey:config.publishableKey},
    body:JSON.stringify({action:'pageview'}),credentials:'omit',referrerPolicy:'no-referrer',
    signal:AbortSignal.timeout(4000),keepalive:true
   });
  }catch{/* Statistics must never affect the guest card. */}
 };
}
if(typeof document!=='undefined'&&document.body.classList.contains('guest'))void createPageviewCounter()();
