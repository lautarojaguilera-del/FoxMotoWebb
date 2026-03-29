/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Checkout from './pages/Checkout';

interface Product {
  sku: string;
  title: string;
  price: string;
  stock: string;
  img: string | null;
  category?: string;
  brand?: string;
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

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [progress, setProgress] = useState<SyncProgress>({ current_page: 0, total_products: 0, status: 'idle' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('foxmoto-cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist cart
  useEffect(() => {
    localStorage.setItem('foxmoto-cart', JSON.stringify(cart));
  }, [cart]);

  const fetchProducts = () => {
    fetch('/api/products')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
      })
      .then(data => {
        setProducts(data.products);
        setProgress(data.progress);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
    
    // Set up EventSource for real-time progress
    const eventSource = new EventSource('/api/scrape/progress');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data);
      if (data.status === 'idle') {
        fetchProducts();
      }
    };

    eventSource.onerror = () => {
      console.error('EventSource failed');
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  const getStockNumber = (stockStr: string) => {
    if (!stockStr) return 0;
    if (stockStr.toLowerCase().includes('ilimitado')) return 999;
    const match = stockStr.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors theme="dark" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/catalogo" 
          element={
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
          } 
        />
        <Route 
          path="/checkout" 
          element={
            <Checkout 
              cart={cart}
              setCart={setCart}
              setProducts={setProducts}
              getStockNumber={getStockNumber}
            />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
