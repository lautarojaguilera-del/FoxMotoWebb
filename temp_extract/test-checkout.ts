import puppeteer from "puppeteer";
import fs from "fs";

async function testCheckout() {
  console.log("Starting automated checkout process...");
  
  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // 1. Go to the store
    await page.goto('https://catalogo.duxsoftware.com.ar/foxmoto', { waitUntil: 'networkidle2' });
    
    // 2. Add items to cart
    console.log("Adding items to cart...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('[data-testid="grid-item-button"]:not([disabled])'));
      if (btns.length > 0) {
        (btns[0] as HTMLElement).click();
      }
    });
    await new Promise(r => setTimeout(r, 1000));
    
    // 3. Go to cart
    console.log("Going to cart...");
    await page.evaluate(() => {
      const cartBtn = document.querySelector('button:has([data-testid="cart-total"])');
      if (cartBtn) (cartBtn as HTMLElement).click();
    });
    await new Promise(r => setTimeout(r, 2000));
    
    // 4. Click Continuar al checkout
    console.log("Proceeding to checkout...");
    const checkoutClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const checkoutBtn = btns.find(b => b.textContent && b.textContent.includes('Continuar al checkout'));
      if (checkoutBtn) {
        checkoutBtn.click();
        return true;
      }
      return false;
    });
    
    if (!checkoutClicked) throw new Error("Could not find checkout button");
    
    await page.waitForSelector('#email', { visible: true, timeout: 10000 });
    
    // 5. Fill Contact Info
    console.log("Filling contact info...");
    await page.type('#email', 'test@example.com');
    await page.type('input[type="tel"]', '1123456789');
    await page.type('#name', 'Test');
    await page.type('#lastname', 'User');
    await page.type('#idNumber', '12345678');
    
    // Click Continuar
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const contBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Continuar' && b.offsetParent !== null);
      if (contBtn) contBtn.click();
    });
    
    await page.waitForSelector('#street', { visible: true, timeout: 10000 });
    
    // 6. Fill Billing/Shipping Info
    console.log("Filling billing info...");
    await page.type('#street', 'Av Siempreviva');
    await page.type('#streetNumber', '742');
    await page.type('#zipCode', '1000');
    
    // Select province
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
    
    // Select locality
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const locBtn = btns.find(b => b.textContent && b.textContent.includes('Selecciona la localidad') && b.offsetParent !== null);
      if (locBtn) locBtn.click();
    });
    await page.waitForSelector('[role="option"]', { visible: true, timeout: 5000 });
    await page.evaluate(() => {
      const options = Array.from(document.querySelectorAll('[role="option"]'));
      if (options.length > 0) (options[0] as HTMLElement).click();
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Dump HTML of step 2
    const step2Html = await page.evaluate(() => document.body.innerHTML);
    fs.writeFileSync('step2.html', step2Html);
    
    // Click Continuar 2
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const contBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Continuar' && b.offsetParent !== null);
      if (contBtn) contBtn.click();
    });
    
    console.log("Waiting for step 3 (Resumen)...");
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent && b.textContent.includes('Finalizar Pedido') && b.offsetParent !== null);
    }, { timeout: 10000 });
    
    // Dump HTML of step 3
    const step3Html = await page.evaluate(() => document.body.innerHTML);
    fs.writeFileSync('step3.html', step3Html);
    
    // 7. Click Finalizar Pedido
    console.log("Clicking Finalizar Pedido...");
    const finalizarClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const finBtn = btns.find(b => b.textContent && b.textContent.includes('Finalizar Pedido') && b.offsetParent !== null);
      if (finBtn) {
        finBtn.click();
        return true;
      }
      return false;
    });
    
    if (!finalizarClicked) throw new Error("Could not find Finalizar Pedido button");
    
    await new Promise(r => setTimeout(r, 5000));
    
    console.log("Checkout automated successfully!");
    await browser.close();
  } catch (error: any) {
    console.error("Checkout automation error:", error);
  }
}

testCheckout();
