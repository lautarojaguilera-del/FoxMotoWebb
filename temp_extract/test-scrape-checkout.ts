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
  console.log("Going to cart...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cartBtn = btns.find(b => b.querySelector('[data-testid="cart-total"]'));
    if (cartBtn) cartBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Dumping cart HTML...");
  const cartHtml = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('dump_cart_drawer.html', cartHtml);
  
  await page.screenshot({ path: 'cart_before_checkout.png', fullPage: true });
  
  // Proceed to checkout
  console.log("Clicking checkout button...");
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const checkoutBtn = btns.find(b => b.textContent && (b.textContent.includes('Iniciar Compra') || b.textContent.includes('Continuar al checkout') || b.textContent.includes('Checkout')));
    if (checkoutBtn) {
      checkoutBtn.click();
      return true;
    }
    return false;
  });
  
  console.log("Checkout button clicked:", clicked);
  
  if (clicked) {
    console.log("Waiting for navigation to checkout page...");
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(e => console.log("Navigation timeout or error:", e.message));
  }
  
  await new Promise(r => setTimeout(r, 5000));
  
  console.log("Current URL:", page.url());
  
  console.log("Dumping checkout HTML...");
  const html = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('dump_checkout_form.html', html);
  
  console.log("Done!");
  await browser.close();
}

run().catch(console.error);

