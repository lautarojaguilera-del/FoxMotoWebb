const puppeteer = require('puppeteer');
const fs = require('fs');

async function test() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://catalogo.duxsoftware.com.ar/foxmoto', { waitUntil: 'networkidle2' });
  
  const body = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('dump.html', body);
  console.log("Dumped to dump.html");
  await browser.close();
}

test();
