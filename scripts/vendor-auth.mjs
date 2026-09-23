import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
mkdirSync('js/vendor',{recursive:true});
const src=readFileSync('node_modules/@supabase/supabase-js/dist/umd/supabase.js','utf8');
writeFileSync('js/vendor/supabase.js',src+'\nexport const createClient = supabase.createClient;\n');
// Supabase's npm tarball omits LICENSE; the upstream MIT license is kept alongside this script's output.
