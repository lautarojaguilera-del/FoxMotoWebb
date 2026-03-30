import express from "express";
import path from "path";
import { db } from "./src/firebase";
import { doc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";

export const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

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
