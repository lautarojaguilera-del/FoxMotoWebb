const puppeteer = require('puppeteer');
const fs = require('fs');

async function test() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://catalogo.duxsoftware.com.ar/foxmoto', { waitUntil: 'networkidle2' });
  
  // Click the first enabled add to cart button
  const addBtn = await page.$('[data-testid="grid-item-button"]:not([disabled])');
  if (addBtn) {
    console.log("Clicking add to cart...");
    await addBtn.click();
    await new Promise(r => setTimeout(r, 2000));
    
    // Click the cart icon (the button containing the cart total)
    const cartBtn = await page.$('button:has([data-testid="cart-total"])');
    if (cartBtn) {
      console.log("Clicking cart...");
      await cartBtn.click();
      await new Promise(r => setTimeout(r, 2000));
      
      // Look for a checkout button
      const clicked = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const checkoutBtn = btns.find(b => b.textContent && b.textContent.includes('Continuar al checkout'));
        if (checkoutBtn) {
          checkoutBtn.click();
          return true;
        }
        return false;
      });
      
      if (clicked) {
        console.log("Clicking checkout...");
        await new Promise(r => setTimeout(r, 2000));
        
        // Fill out the form
        console.log("Filling out checkout form...");
        await page.type('#email', 'test@example.com');
        await page.type('input[type="tel"]', '1123456789');
        await page.type('#name', 'Juan');
        await page.type('#lastname', 'Perez');
        await page.type('#idNumber', '12345678');
        
        // Click Continuar
        const continuarClicked = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const contBtn = btns.find(b => b.textContent && b.textContent.includes('Continuar'));
          if (contBtn) {
            contBtn.click();
            return true;
          }
          return false;
        });
        
        if (continuarClicked) {
          console.log("Clicked Continuar...");
          await new Promise(r => setTimeout(r, 2000));
          
          // Fill out billing form
          console.log("Filling out billing form...");
          await page.type('#street', 'Av Siempreviva');
          await page.type('#streetNumber', '742');
          await page.type('#zipCode', '1000');
          
          // Select province
          const provBtn = await page.$('button[name="province"]');
          if (provBtn) {
            await provBtn.click();
            await new Promise(r => setTimeout(r, 1000));
            // Click the first option in the popover
            await page.evaluate(() => {
              const options = Array.from(document.querySelectorAll('[role="option"]'));
              if (options.length > 0) options[0].click();
            });
            await new Promise(r => setTimeout(r, 1000));
          }
          
          // Select locality
          const locBtn = await page.evaluateHandle(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.find(b => b.textContent && b.textContent.includes('Selecciona la localidad'));
          });
          if (locBtn) {
            await locBtn.click();
            await new Promise(r => setTimeout(r, 1000));
            await page.evaluate(() => {
              const options = Array.from(document.querySelectorAll('[role="option"]'));
              if (options.length > 0) options[0].click();
            });
            await new Promise(r => setTimeout(r, 1000));
          }
          
          // Click Continuar again
          const continuar2Clicked = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            // Find the "Continuar" button that is not "Volver"
            const contBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Continuar');
            if (contBtn) {
              contBtn.click();
              return true;
            }
            return false;
          });
          
          if (continuar2Clicked) {
            console.log("Clicked Continuar 2...");
            await new Promise(r => setTimeout(r, 3000));
            const checkoutBody3 = await page.evaluate(() => document.body.innerHTML);
            fs.writeFileSync('dump_checkout3.html', checkoutBody3);
            console.log("Dumped checkout step 3 to dump_checkout3.html");
            
            // Click Finalizar Pedido
            const finalizarClicked = await page.evaluate(() => {
              const btns = Array.from(document.querySelectorAll('button'));
              const finBtn = btns.find(b => b.textContent && b.textContent.includes('Finalizar Pedido'));
              if (finBtn) {
                finBtn.click();
                return true;
              }
              return false;
            });
            
            if (finalizarClicked) {
              console.log("Clicked Finalizar Pedido...");
              await new Promise(r => setTimeout(r, 4000));
              const finalBody = await page.evaluate(() => document.body.innerHTML);
              fs.writeFileSync('dump_final.html', finalBody);
              console.log("Dumped final page to dump_final.html");
            } else {
              console.log("No Finalizar Pedido button found.");
            }
          } else {
            console.log("No Continuar 2 button found.");
          }
        } else {
          console.log("No Continuar button found.");
        }
      } else {
        console.log("No checkout button found.");
      }
    }
  }
  await browser.close();
}

test();
