import express from "express";
import path from "path";
import { db } from "./src/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export const app = express();
const PORT = process.env.PORT || 3000;

// Register API routes synchronously to avoid race conditions on Vercel
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
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

app.post("/api/checkout", express.json(), async (req, res) => {
  const { items, customer } = req.body;
  
  console.log("Checkout request received:", { 
    itemCount: items?.length, 
    customerEmail: customer?.email,
    env: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL
  });

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }
  if (!customer) {
    return res.status(400).json({ error: "Customer details missing" });
  }

  try {
    // Record order in Firestore
    const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    console.log("Attempting to record order:", orderId);
    
    await setDoc(doc(db, 'orders', orderId), {
      items,
      customer,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    console.log("Order recorded successfully:", orderId);
    res.json({ 
      success: true, 
      message: "Order recorded successfully",
      orderId
    });
  } catch (error: any) {
    console.error("Checkout error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      error: "Checkout failed", 
      details: error.message,
      code: error.code 
    });
  }
});

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
