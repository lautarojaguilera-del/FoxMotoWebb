const AdmZip = require('adm-zip');
const zip = new AdmZip('foxmoto-store.zip');
zip.extractAllTo('catalogo', true);
console.log('Extraction complete');
