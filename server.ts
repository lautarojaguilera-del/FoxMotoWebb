import express from "express";
import path from "path";
import { db } from "./src/firebase";
import { doc, setDoc, serverTimestamp, collection, addDoc, writeBatch, increment } from "firebase/firestore";

export const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Register API routes synchronously to avoid race conditions on Vercel
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/checkout", async (req, res) => {
  const { items, customer } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }
  if (!customer) {
    return res.status(400).json({ error: "Customer details missing" });
  }

  console.log("Starting automated checkout process...");
  
  try {
    const { getBrowser } = await import("./scraper");
    const browser = await getBrowser();
    const page = await browser.newPage();
    
    // 1. Go to the store
    await page.goto('https://catalogo.duxsoftware.com.ar/foxmoto', { waitUntil: 'networkidle2' });
    
    // 2. Add items to cart
    console.log("Adding items to cart...");
    for (const item of items) {
      // Search for the SKU to be precise
      await page.waitForSelector('input[placeholder*="Buscar"]', { visible: true });
      await page.evaluate(() => {
        const input = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
        if (input) {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.type('input[placeholder*="Buscar"]', item.product.sku);
      await new Promise(r => setTimeout(r, 1000));

      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const addBtn = btns.find(b => b.textContent && b.textContent.includes('Agregar') && b.offsetParent !== null);
        if (addBtn) addBtn.click();
      });
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // 3. Go to cart
    console.log("Going to cart...");
    await page.evaluate(() => {
      const cartBtn = document.querySelector('button:has([data-testid="cart-total"]), .cart-button, button i.fa-shopping-cart');
      if (cartBtn) (cartBtn as HTMLElement).click();
      else {
        // Fallback: try to find by text or icon
        const allBtns = Array.from(document.querySelectorAll('button'));
        const found = allBtns.find(b => b.innerHTML.includes('shopping-cart') || (b.textContent && b.textContent.includes('$')));
        if (found) found.click();
      }
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
    await page.waitForSelector('#email', { visible: true, timeout: 15000 });
    
    // 5. Fill Contact Info
    console.log("Filling contact info...");
    await page.type('#email', customer.email);
    await page.type('input[type="tel"]', customer.phone);
    await page.type('#name', customer.name);
    await page.type('#lastname', customer.lastname);
    await page.type('#idNumber', customer.idNumber);
    
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
    await page.type('#street', customer.street);
    await page.type('#streetNumber', customer.streetNumber);
    await page.type('#zipCode', customer.zipCode);
    
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
    }, { timeout: 15000 });
    
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
    
    const orderDetails = await page.evaluate(() => {
      const successEl = Array.from(document.querySelectorAll('h1, h2, h3')).find(el => 
        el.textContent && (el.textContent.includes('¡Gracias por tu compra!') || el.textContent.includes('Pedido confirmado'))
      );
      return {
        success: !!successEl,
        url: window.location.href
      };
    });
    
    await browser.close();
    
    if (orderDetails.success) {
      try {
        const batch = writeBatch(db);
        for (const item of items) {
          const productRef = doc(db, 'products', item.product.sku);
          // We use increment to track sales
          batch.update(productRef, {
            salesCount: increment(item.quantity)
          });
        }
        await batch.commit();
        console.log("Sales counts updated in Firestore.");
      } catch (err) {
        console.error("Failed to update sales counts:", err);
        // We don't fail the whole request if this fails
      }
    }
    
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

app.get("/api/products", async (req, res) => {
  try {
    const { scrapeProgress, cachedProducts } = await import("./scraper");
    res.json({
      status: scrapeProgress.status,
      progress: scrapeProgress,
      products: cachedProducts
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch products", details: err.message });
  }
});

app.post("/api/scrape/start", async (req, res) => {
  try {
    const { scrapeAllPages, scrapeProgress } = await import("./scraper");
    if (scrapeProgress.isScraping) {
      return res.status(400).json({ error: "Scrape already in progress" });
    }
    
    // Trigger in background
    scrapeAllPages().catch(err => console.error("Manual scrape error:", err));
    
    res.json({ message: "Scrape started" });
  } catch (err: any) {
    console.error("Scrape start error:", err);
    res.status(500).json({ error: "Failed to start scrape", details: err.message });
  }
});

app.post("/api/scrape/reset", async (req, res) => {
  try {
    const { forceResetScraper } = await import("./scraper");
    await forceResetScraper();
    res.json({ message: "Scraper reset" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to reset scraper", details: err.message });
  }
});

// Checkout route removed per user request (WhatsApp only checkout)

// Start server for local development and AI Studio
if (!process.env.VERCEL) {
  // Register frontend middleware for local dev
  const setupFrontend = async () => {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
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
    
    app.listen(PORT as number, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  };
  
  setupFrontend();
  
  // Start background scrape
  import("./scraper").then(({ scrapeAllPages }) => {
    scrapeAllPages();
    setInterval(scrapeAllPages, 30 * 60 * 1000);
  });
}

export default app;
