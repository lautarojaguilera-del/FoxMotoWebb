import puppeteer from 'puppeteer';
import fs from 'fs';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log("Starting checkout...");
  await page.goto('https://catalogo.duxsoftware.com.ar/foxmoto', { waitUntil: 'networkidle2' });
  
  // Add item
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent && b.textContent.includes('Agregar'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  // Go to cart
  await page.goto('https://catalogo.duxsoftware.com.ar/foxmoto/cart', { waitUntil: 'networkidle2' });
  
  // Proceed to checkout
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const checkoutBtn = btns.find(b => b.textContent && b.textContent.includes('Iniciar Compra'));
    if (checkoutBtn) checkoutBtn.click();
  });
  await page.waitForSelector('#email', { visible: true, timeout: 10000 });
  
  // Fill step 1
  await page.type('#email', 'test@example.com');
  await page.type('input[type="tel"]', '1123456789');
  await page.type('#name', 'Test');
  await page.type('#lastname', 'User');
  await page.type('#idNumber', '12345678');
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const contBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Continuar');
    if (contBtn) contBtn.click();
  });
  
  // Fill step 2
  await page.waitForSelector('#street', { visible: true, timeout: 10000 });
  await page.type('#street', 'Av Siempreviva');
  await page.type('#streetNumber', '742');
  await page.type('#zipCode', '1000');
  
  await page.evaluate(() => {
    const provBtn = document.querySelector('button[name="province"]');
    if (provBtn) (provBtn as HTMLElement).click();
  });
  await page.waitForSelector('[role="option"]', { visible: true, timeout: 5000 });
  await page.evaluate(() => {
    const options = Array.from(document.querySelectorAll('[role="option"]'));
    if (options.length > 0) (options[0] as HTMLElement).click();
  });
  
  await new Promise(r => setTimeout(r, 1500));
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const locBtn = btns.find(b => b.textContent && b.textContent.includes('Selecciona la localidad'));
    if (locBtn) locBtn.click();
  });
  await page.waitForSelector('[role="option"]', { visible: true, timeout: 5000 });
  await page.evaluate(() => {
    const options = Array.from(document.querySelectorAll('[role="option"]'));
    if (options.length > 0) (options[0] as HTMLElement).click();
  });
  
  await new Promise(r => setTimeout(r, 1500));
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const contBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Continuar');
    if (contBtn) contBtn.click();
  });
  
  // Step 3
  await page.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.some(b => b.textContent && b.textContent.includes('Finalizar Pedido') && b.offsetParent !== null);
  }, { timeout: 10000 });
  
  console.log("Clicking Finalizar Pedido...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const finBtn = btns.find(b => b.textContent && b.textContent.includes('Finalizar Pedido') && b.offsetParent !== null);
    if (finBtn) finBtn.click();
  });
  
  console.log("Waiting 5 seconds...");
  await new Promise(r => setTimeout(r, 5000));
  
  await page.screenshot({ path: 'final_result.png', fullPage: true });
  const html = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('final_result.html', html);
  
  console.log("Done!");
  await browser.close();
}

run().catch(console.error);
