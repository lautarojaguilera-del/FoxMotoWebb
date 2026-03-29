import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import { automateDuxCheckout } from "./duxAutomation";
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

app.post("/api/checkout", async (req, res) => {
  const { items, customer } = req.body;
  
  console.log("Checkout request received:", { 
    itemCount: items?.length, 
    customerEmail: customer?.email,
    bodyKeys: Object.keys(req.body || {}),
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
    console.log("Attempting to record order in Firestore:", orderId);
    
    if (!db) {
      throw new Error("Firestore database instance (db) is not initialized");
    }

    await setDoc(doc(db, 'orders', orderId), {
      items,
      customer,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    console.log("Order recorded successfully in Firestore:", orderId);

    // 1. Send email via Nodemailer (if configured)
    const sendEmail = async () => {
      const { EMAIL_USER, EMAIL_PASS, EMAIL_TO } = process.env;
      
      if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_TO) {
        console.warn("Email credentials missing (EMAIL_USER, EMAIL_PASS, EMAIL_TO). Skipping direct email.");
        return;
      }

      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS
          }
        });

        const itemsHtml = items.map((item: any) => `
          <tr>
            <td>${item.title}</td>
            <td>${item.quantity}</td>
            <td>${item.price}</td>
          </tr>
        `).join('');

        const mailOptions = {
          from: `"Fox Motorepuestos" <${EMAIL_USER}>`,
          to: EMAIL_TO,
          subject: `Nuevo Pedido #${orderId}`,
          html: `
            <h1>Nuevo Pedido Recibido</h1>
            <p><strong>ID de Pedido:</strong> ${orderId}</p>
            <h3>Datos del Cliente:</h3>
            <ul>
              <li><strong>Nombre:</strong> ${customer.name} ${customer.lastname}</li>
              <li><strong>Email:</strong> ${customer.email}</li>
              <li><strong>Teléfono:</strong> ${customer.phone}</li>
              <li><strong>Dirección:</strong> ${customer.street} ${customer.streetNumber}, ${customer.zipCode}</li>
            </ul>
            <h3>Productos:</h3>
            <table border="1" cellpadding="5" style="border-collapse: collapse;">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully via Nodemailer");
      } catch (mailErr) {
        console.error("Error sending email via Nodemailer:", mailErr);
      }
    };

    // 2. Write to 'mail' collection (for Firebase Trigger Email extension)
    const triggerFirebaseEmail = async () => {
      try {
        const { EMAIL_TO } = process.env;
        if (!EMAIL_TO) return;

        await addDoc(collection(db, 'mail'), {
          to: EMAIL_TO,
          message: {
            subject: `Nuevo Pedido #${orderId}`,
            html: `Nuevo pedido de ${customer.name} ${customer.lastname}. ID: ${orderId}`,
          },
          orderId: orderId,
          createdAt: serverTimestamp()
        });
        console.log("Trigger Email document added to Firestore");
      } catch (fireErr) {
        console.error("Error adding Trigger Email document:", fireErr);
      }
    };

    // Run both in background
    sendEmail();
    triggerFirebaseEmail();

    // 3. Automate Dux Checkout
    const runDuxAutomation = async () => {
      try {
        const orderData = {
          items: items.map((item: any) => ({
            sku: item.product.sku,
            quantity: item.quantity
          })),
          customer: {
            email: customer.email,
            name: customer.name,
            lastname: customer.lastname,
            phone: customer.phone,
            idNumber: customer.idNumber,
            street: customer.street,
            streetNumber: customer.streetNumber,
            zipCode: customer.zipCode,
            city: customer.city,
            province: customer.province
          }
        };

        const result = await automateDuxCheckout(orderData);
        if (result.success) {
          console.log("Dux Automation completed successfully");
        } else {
          console.error("Dux Automation failed:", result.error);
        }
      } catch (duxErr: any) {
        console.error("Error in Dux Automation:", duxErr.message);
      }
    };

    runDuxAutomation();

    res.json({ 
      success: true, 
      message: "Order recorded successfully",
      orderId
    });
  } catch (error: any) {
    console.error("Checkout error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
      dbInitialized: !!db
    });
    res.status(500).json({ 
      error: "Checkout failed", 
      details: error.message,
      code: error.code,
      dbInitialized: !!db
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
