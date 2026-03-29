import puppeteer from "puppeteer";

export interface DuxOrderData {
  items: { sku: string; quantity: number }[];
  customer: {
    email: string;
    name: string;
    lastname: string;
    phone: string;
    idNumber: string;
    street: string;
    streetNumber: string;
    zipCode: string;
    city: string;
    province: string;
  };
}

export async function automateDuxCheckout(order: DuxOrderData) {
  console.log("Starting Dux Automation for order:", order.customer.email);
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true
  });
  const page = await browser.newPage();
  
  try {
    // 1. Add items to cart
    for (const item of order.items) {
      console.log(`Adding SKU: ${item.sku} (Qty: ${item.quantity})`);
      await page.goto(`https://catalogo.duxsoftware.com.ar/foxmoto?search=${item.sku}`, { waitUntil: 'networkidle2' });
      
      // Wait for the product to appear and click Agregar
      try {
        await page.waitForSelector('button', { timeout: 5000 });
        await page.evaluate((qty) => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const addBtn = buttons.find(b => b.textContent?.trim() === 'Agregar');
          if (addBtn) {
            for (let i = 0; i < qty; i++) {
              (addBtn as any).click();
            }
          }
        }, item.quantity);
        await new Promise(r => setTimeout(r, 1000));
      } catch (e) {
        console.warn(`Could not find or add SKU: ${item.sku}`);
      }
    }

    // 2. Go to checkout
    console.log("Navigating to checkout...");
    await page.goto('https://catalogo.duxsoftware.com.ar/foxmoto/customer-checkout', { waitUntil: 'networkidle2' });

    // 3. Fill Step 1: Contact
    console.log("Filling Step 1...");
    await page.waitForSelector('#email');
    await page.type('#email', order.customer.email);
    await page.type('#name', order.customer.name);
    await page.type('#lastname', order.customer.lastname);
    await page.type('#idNumber', order.customer.idNumber);
    
    await page.evaluate((phone) => {
      const telInput = document.querySelector('input[type="tel"]') as HTMLInputElement;
      if (telInput) {
        telInput.focus();
        telInput.value = phone;
        telInput.dispatchEvent(new Event('input', { bubbles: true }));
        telInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, order.customer.phone);

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const continueBtn = buttons.find(b => b.textContent?.trim() === 'Continuar');
      if (continueBtn) (continueBtn as any).click();
    });

    await new Promise(r => setTimeout(r, 2000));

    // 4. Fill Step 2: Shipping
    console.log("Filling Step 2...");
    // We'll try to find selectors by placeholder or common IDs
    await page.evaluate((data) => {
      const inputs = Array.from(document.querySelectorAll('input, select')) as HTMLInputElement[];
      
      const fields = [
        { keywords: ['calle', 'street', 'address'], value: data.street },
        { keywords: ['numero', 'number'], value: data.streetNumber },
        { keywords: ['postal', 'zip'], value: data.zipCode },
        { keywords: ['localidad', 'city'], value: data.city },
        { keywords: ['provincia', 'state', 'province'], value: data.province }
      ];

      for (const field of fields) {
        const input = inputs.find(i => {
          const id = (i.id || "").toLowerCase();
          const name = (i.name || "").toLowerCase();
          const placeholder = (i.placeholder || "").toLowerCase();
          return field.keywords.some(k => id.includes(k) || name.includes(k) || placeholder.includes(k));
        });
        if (input) {
          input.value = field.value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }, order.customer);

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const continueBtn = buttons.find(b => b.textContent?.trim() === 'Continuar');
      if (continueBtn) (continueBtn as any).click();
    });

    await new Promise(r => setTimeout(r, 2000));

    // 5. Final Step: Summary & Confirm
    console.log("Finalizing order...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const finishBtn = buttons.find(b => b.textContent?.trim() === 'Confirmar' || b.textContent?.trim() === 'Finalizar' || b.textContent?.trim() === 'Enviar pedido');
      if (finishBtn) (finishBtn as any).click();
    });

    await new Promise(r => setTimeout(r, 5000));
    console.log("Order automation finished.");
    
    return { success: true };
  } catch (error) {
    console.error("Dux Automation Error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    await browser.close();
  }
}
