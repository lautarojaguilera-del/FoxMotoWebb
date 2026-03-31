const AdmZip = require('adm-zip');
const zip = new AdmZip('foxmoto-store.zip');
const zipEntries = zip.getEntries();
zipEntries.forEach(function(zipEntry) {
    console.log(zipEntry.entryName);
});
