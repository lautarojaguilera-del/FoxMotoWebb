/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import Layout from './components/Layout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Checkout from './pages/Checkout';
import ShippingReturns from './pages/ShippingReturns';
import FAQ from './pages/FAQ';
import { db } from './firebase';
import { collection, onSnapshot, query, doc, getDocFromServer } from 'firebase/firestore';

interface Product {
  sku: string;
  title: string;
  price: string;
  stock: string;
  img: string | null;
}

interface SyncProgress {
  current_page: number;
  total_products: number;
  status: 'idle' | 'syncing' | 'error';
}

interface CartItem {
  product: Product;
  quantity: number;
}

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
}

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => {
    const cached = localStorage.getItem('foxmoto_products');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Error parsing cached products', e);
      }
    }
    return [];
  });
  const [progress, setProgress] = useState<SyncProgress>({ current_page: 0, total_products: 0, status: 'idle' });
  const [loading, setLoading] = useState(() => {
    return !localStorage.getItem('foxmoto_products');
  });
  const [error, setError] = useState<string | null>(null);
  
  // Load cart from localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('foxmoto_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing cart from localStorage', e);
      }
    }
    return [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('foxmoto_cart', JSON.stringify(cart));
  }, [cart]);

  // Abandoned cart recovery
  useEffect(() => {
    if (cart.length > 0) {
      const lastActive = localStorage.getItem('foxmoto_last_active');
      const now = Date.now();
      // If no last active, or it's been more than 1 hour (3600000 ms)
      if (!lastActive || (now - parseInt(lastActive, 10)) > 3600000) {
        setTimeout(() => {
          toast('¡Hola! Dejaste productos en tu carrito', {
            description: '¿Quieres finalizar tu compra?',
            action: {
              label: 'Ver carrito',
              onClick: () => {
                window.location.href = '/checkout';
              }
            },
            duration: 10000,
            icon: '🛒',
          });
        }, 2000);
      }
    }
    
    // Update last active on mount and before unload
    localStorage.setItem('foxmoto_last_active', Date.now().toString());
    
    const handleUnload = () => {
      localStorage.setItem('foxmoto_last_active', Date.now().toString());
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []); // Run once on mount to check abandoned cart

  // Real-time Firestore sync
  useEffect(() => {
    // Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'status', 'current'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
          setError("Error de conexión con Firebase. Revisa tu configuración.");
        }
      }
    };
    testConnection();

    // Listen for products
    const productsUnsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const productsData = snapshot.docs.map(doc => doc.data() as Product);
      setProducts(productsData);
      if (productsData.length > 0) {
        localStorage.setItem('foxmoto_products', JSON.stringify(productsData));
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      if (products.length === 0) {
        setError("Error al cargar productos desde Firebase.");
      }
      setLoading(false);
    });

    // Listen for status
    const statusUnsubscribe = onSnapshot(doc(db, 'status', 'current'), (snapshot) => {
      if (snapshot.exists()) {
        setProgress(snapshot.data() as SyncProgress);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'status/current');
    });

    return () => {
      productsUnsubscribe();
      statusUnsubscribe();
    };
  }, []);

  const getStockNumber = (stockStr: string) => {
    if (!stockStr) return 0;
    if (stockStr.toLowerCase().includes('ilimitado') || stockStr.toLowerCase().includes('ilimitada')) return Infinity;
    const num = parseInt(stockStr.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  return (
    <>
      <Toaster position="top-center" richColors theme="dark" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="catalogo" element={
              <Catalog 
                products={products} 
                setProducts={setProducts}
                cart={cart}
                setCart={setCart}
                getStockNumber={getStockNumber}
                progress={progress}
                loading={loading}
                error={error}
              />
            } />
            <Route path="checkout" element={
              <Checkout 
                cart={cart}
                setCart={setCart}
                setProducts={setProducts}
                getStockNumber={getStockNumber}
              />
            } />
            <Route path="envios-devoluciones" element={<ShippingReturns />} />
            <Route path="faq" element={<FAQ />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}
