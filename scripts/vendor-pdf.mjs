import {copyFileSync} from 'node:fs';
copyFileSync('node_modules/pdf-lib/dist/pdf-lib.esm.min.js','js/vendor/pdf-lib.js');
copyFileSync('node_modules/pdf-lib/LICENSE.md','js/vendor/pdf-lib-LICENSE.md');
