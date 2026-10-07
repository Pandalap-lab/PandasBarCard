// The Dashboard editor deploys one file; CLI deployment uses the original modules.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../supabase/functions/bar-admin/',import.meta.url);
const parts=[];
for(const name of ['policy.js','mail.js','passkey.js','change-mail.js','index.ts']){
 let source=await readFile(new URL(name,root),'utf8');
 source=source.replace(/^import .* from '\.\/[^']+';\r?\n/gm,'').replace(/^export /gm,'');
 parts.push(source);
}
const directory=new URL('../test-results/',import.meta.url);await mkdir(directory,{recursive:true});
const output=new URL('bar-admin-dashboard.ts',directory);
await writeFile(output,parts.join('\n'));console.log(fileURLToPath(output));
