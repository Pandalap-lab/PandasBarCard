import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export async function checkHealth(config,request=fetch){
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl)||!config.publishableKey)throw Error('Ungültige öffentliche Backend-Konfiguration.');
 // Read one public row only. Never open the card or invoke the pageview action.
 const response=await request(config.supabaseUrl+'/rest/v1/bar_published?select=id&id=eq.1&limit=1',{
  method:'GET',headers:{apikey:config.publishableKey,'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000)
 });
 if(!response.ok)throw Error('Supabase-Healthcheck fehlgeschlagen: HTTP '+response.status);
 const rows=await response.json();
 if(!Array.isArray(rows)||rows.length!==1||rows[0].id!==1)throw Error('Veröffentlichter Kartenstand nicht erreichbar.');
 return true;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{await checkHealth(JSON.parse(await readFile(new URL('../admin/config.json',import.meta.url),'utf8')));console.log('Supabase erreichbar; öffentliche Datenbankabfrage bestätigt. Keine Daten verändert.');}
 catch(error){console.error(error.message);process.exitCode=1;}
}
