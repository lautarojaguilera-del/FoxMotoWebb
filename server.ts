import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { db } from "./src/firebase";
import { collection, doc, setDoc, getDocs, writeBatch, serverTimestamp } from "firebase/firestore";

export const app = express();
const PORT = process.env.PORT || 3000;

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We don't throw here to avoid crashing the scraper, but we log it
}

let cachedProducts: any[] = [];
let isScraping = false;
let scrapeProgress = { current_page: 0, total_products: 0, status: 'idle' };

async function updateScrapeStatus(status: any) {
  try {
    await setDoc(doc(db, 'status', 'current'), {
      ...status,
      last_run: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'status/current');
  }
}

// Dynamic import for puppeteer to avoid issues on Vercel where it's not used
async function getBrowser() {
  const puppeteer = await import("puppeteer");
  return await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });
}

async function scrapeAllPages() {
  if (isScraping) return;
  isScraping = true;
  scrapeProgress.status = 'syncing';
  scrapeProgress.current_page = 1;
  console.log("Starting full catalog scrape...");
  await updateScrapeStatus(scrapeProgress);
  
  let browser;
  try {
    browser = await getBrowser();
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
          
          const text = parent.innerText as string;
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
      const uniqueProducts = Array.from(new Map(allProducts.map(p => [p?.sku, p])).values());
      cachedProducts = uniqueProducts;
      scrapeProgress.total_products = cachedProducts.length;
      
      // Save to Firestore in batches
      try {
        const batch = writeBatch(db);
        pageProducts.forEach((p: any) => {
          if (p && p.sku) {
            const productRef = doc(db, 'products', p.sku);
            batch.set(productRef, {
              ...p,
              last_updated: serverTimestamp()
            });
          }
        });
        await batch.commit();
        console.log(`Saved ${pageProducts.length} products to Firestore batch.`);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'products');
      }

      await updateScrapeStatus(scrapeProgress);
      
      currentPage++;
      
      // Safety limit to avoid infinite loops
      if (currentPage > 50) break;
    }
    
    console.log(`Finished scraping. Total products: ${cachedProducts.length}`);
    scrapeProgress.status = 'idle';
    await updateScrapeStatus(scrapeProgress);
  } catch (err) {
    console.error("Error scraping products:", err);
    scrapeProgress.status = 'error';
    await updateScrapeStatus(scrapeProgress);
  } finally {
    await browser.close();
    isScraping = false;
  }
}

// Start initial scrape in the background (skip on Vercel)
if (!process.env.VERCEL) {
  scrapeAllPages();
  // Schedule every 30 minutes
  setInterval(scrapeAllPages, 30 * 60 * 1000);
}

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

    console.log("Processing order for:", customer.email);
    
    try {
      // Record order in Firestore
      const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await setDoc(doc(db, 'orders', orderId), {
        items,
        customer,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Optional: Update stock in Firestore if needed
      // For now, we just return success as the frontend handles the WhatsApp redirect
      
      res.json({ 
        success: true, 
        message: "Order recorded successfully",
        orderId
      });
    } catch (error: any) {
      console.error("Checkout error:", error);
      res.status(500).json({ error: error.message || "Checkout failed" });
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

  if (!process.env.VERCEL) {
    app.listen(PORT as number, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

// Start server for local development and AI Studio
if (!process.env.VERCEL) {
  startServer();
} else {
  // On Vercel, we still need to run the setup logic (like routes) but not listen
  startServer();
}

export default app;
