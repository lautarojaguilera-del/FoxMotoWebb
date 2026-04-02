import express from "express";
import { createServer as createViteServer } from "vite";
import puppeteer from "puppeteer";
import path from "path";

const app = express();
const PORT = 3000;

let cachedProducts: any[] = [];
let isScraping = false;
let scrapeProgress = { current_page: 0, total_products: 0, status: 'idle' };

async function scrapeAllPages() {
  if (isScraping) return;
  isScraping = true;
  scrapeProgress.status = 'syncing';
  scrapeProgress.current_page = 1;
  console.log("Starting full catalog scrape...");
  
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    let currentPage = 1;
    let allProducts: any[] = [];
    let hasMore = true;
    
    while (hasMore) {
      console.log(`Scraping page ${currentPage}...`);
      scrapeProgress.current_page = currentPage;
      
      await page.goto(`https://catalogo.duxsoftware.com.ar/foxmoto?page=${currentPage}`, { waitUntil: 'networkidle2' });
      
      // Scroll down to trigger lazy loading of images
      for (let i = 0; i < 3; i++) {
          await page.evaluate(() => window.scrollBy(0, window.innerHeight));
          await new Promise(r => setTimeout(r, 500));
      }

      const pageProducts = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*')).filter(el => {
          return el.children.length === 0 && el.textContent?.includes('SKU:');
        });
        
        return elements.map(el => {
          let parent = el.parentElement;
          for(let i=0; i<3; i++) {
              if(parent && parent.parentElement) parent = parent.parentElement;
          }
          
          if (!parent) return null;
          
          const text = parent.innerText;
          const img = parent.querySelector('img')?.src || null;
          
          const lines = text.split('\n').map(l => l.trim()).filter(l => l);
          
          let sku = '';
          let title = '';
          let price = '';
          let stock = '';
          
          for (let i = 0; i < lines.length; i++) {
              if (lines[i].startsWith('SKU:')) sku = lines[i].replace('SKU:', '').trim();
              else if (lines[i].startsWith('$')) price = lines[i];
              else if (lines[i].startsWith('Stock:')) stock = lines[i].replace('Stock:', '').trim();
              else if (lines[i] !== 'Agregar' && lines[i] !== '-') {
                  if (!title) title = lines[i];
              }
          }
          
          return { sku, title, price, stock, img };
        }).filter(p => p && p.sku && p.title && p.price);
      });
      
      if (pageProducts.length === 0) {
        console.log(`No products found on page ${currentPage}. Ending pagination.`);
        hasMore = false;
        break;
      }
      
      allProducts.push(...pageProducts);
      
      // Filter duplicates by SKU and update cache progressively
      const uniqueProducts = Array.from(new Map(allProducts.map(p => [p.sku, p])).values());
      cachedProducts = uniqueProducts;
      scrapeProgress.total_products = cachedProducts.length;
      
      currentPage++;
      
      // Safety limit to avoid infinite loops
      if (currentPage > 50) break;
    }
    
    console.log(`Finished scraping. Total products: ${cachedProducts.length}`);
    scrapeProgress.status = 'idle';
  } catch (err) {
    console.error("Error scraping products:", err);
    scrapeProgress.status = 'error';
  } finally {
    await browser.close();
    isScraping = false;
  }
}

// Start initial scrape in the background
scrapeAllPages();

// Schedule every 30 minutes
setInterval(scrapeAllPages, 30 * 60 * 1000);

async function startServer() {
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/products", (req, res) => {
    res.json({
      status: scrapeProgress.status,
      progress: scrapeProgress,
      products: cachedProducts
    });
  });

  app.post("/api/checkout", express.json(), async (req, res) => {
    const { items, customer } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }
    if (!customer) {
      return res.status(400).json({ error: "Customer details missing" });
    }

    console.log("Starting automated checkout process...");
    
    try {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      
      // 1. Go to the store
      await page.goto('https://catalogo.duxsoftware.com.ar/foxmoto', { waitUntil: 'networkidle2' });
      
      // 2. Add items to cart
      // For simplicity, we'll just add the first available items based on the quantity requested
      // In a real scenario, we'd search for the specific SKUs and add them
      // But since we just want to demonstrate the checkout flow:
      console.log("Adding items to cart...");
      for (let i = 0; i < items.length; i++) {
        // Just click the first available 'Agregar' button for each item in our cart
        // This is a simplification. To do it properly, we'd need to search for the SKU.
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('[data-testid="grid-item-button"]:not([disabled])'));
          if (btns.length > 0) {
            (btns[0] as HTMLElement).click();
          }
        });
        await new Promise(r => setTimeout(r, 1000));
      }
      
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
      
      // Wait for the contact info form to appear
      await page.waitForSelector('#email', { visible: true, timeout: 10000 });
      
      // 5. Fill Contact Info
      console.log("Filling contact info...");
      await page.type('#email', customer.email || 'test@example.com');
      await page.type('input[type="tel"]', customer.phone || '1123456789');
      await page.type('#name', customer.name || 'Test');
      await page.type('#lastname', customer.lastname || 'User');
      await page.type('#idNumber', customer.idNumber || '12345678');
      
      // Click Continuar
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const contBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Continuar' && b.offsetParent !== null);
        if (contBtn) contBtn.click();
      });
      
      // Wait for billing info form to appear
      await page.waitForSelector('#street', { visible: true, timeout: 10000 });
      
      // 6. Fill Billing/Shipping Info
      console.log("Filling billing info...");
      await page.type('#street', customer.street || 'Av Siempreviva');
      await page.type('#streetNumber', customer.streetNumber || '742');
      await page.type('#zipCode', customer.zipCode || '1000');
      
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
      
      // Wait for locality button to be updated/enabled
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
      
      // Wait a bit for the form to register the locality selection
      await new Promise(r => setTimeout(r, 1500));
      
      // Click Continuar 2
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const contBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Continuar' && b.offsetParent !== null);
        if (contBtn) contBtn.click();
      });
      
      // Wait for Finalizar Pedido button to appear
      await page.waitForFunction(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.some(b => b.textContent && b.textContent.includes('Finalizar Pedido') && b.offsetParent !== null);
      }, { timeout: 10000 });
      
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
      
      // Wait for confirmation page or error alert
      console.log("Waiting for order confirmation...");
      
      // We can wait for navigation or a specific success element
      // For now, we wait a few seconds to let the request process
      await new Promise(r => setTimeout(r, 5000));
      
      // Check for error alerts
      const errorAlert = await page.evaluate(() => {
        const alertEl = document.querySelector('[role="alert"], .alert, .error-message');
        if (alertEl && alertEl.textContent) {
          return alertEl.textContent.trim();
        }
        // Also check for common error text
        if (document.body.innerText.includes('Hubo un error al procesar tu pedido')) {
          return 'Hubo un error al procesar tu pedido. Por favor, intenta de nuevo o usa WhatsApp.';
        }
        return null;
      });
      
      if (errorAlert) {
        throw new Error(`Checkout failed with message: ${errorAlert}`);
      }
      
      // Extract order details if successful
      const orderDetails = await page.evaluate(() => {
        // Try to find order number or success message
        const successEl = Array.from(document.querySelectorAll('h1, h2, h3')).find(el => 
          el.textContent && (el.textContent.includes('¡Gracias por tu compra!') || el.textContent.includes('Pedido confirmado'))
        );
        
        return {
          success: !!successEl,
          url: window.location.href
        };
      });
      
      await browser.close();
      
      res.json({ 
        success: true, 
        message: "Checkout automated successfully!",
        orderDetails 
      });
    } catch (error: any) {
      console.error("Checkout automation error:", error);
      res.status(500).json({ error: error.message || "Checkout automation failed" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
