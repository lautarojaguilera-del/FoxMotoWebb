/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ShoppingCart, Search, Package, Loader2, AlertCircle, RefreshCw, X, Plus, Minus, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [progress, setProgress] = useState<SyncProgress>({ current_page: 0, total_products: 0, status: 'idle' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Checkout state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'form' | 'processing' | 'success'>('cart');
  const [customerForm, setCustomerForm] = useState({
    email: '',
    phone: '',
    name: '',
    lastname: '',
    idNumber: '',
    street: '',
    streetNumber: '',
    zipCode: ''
  });

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep('processing');
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: cart,
          customer: customerForm
        })
      });
      
      if (!response.ok) {
        throw new Error('Error en el checkout automatizado');
      }
      
      setCheckoutStep('success');
      setCart([]);
    } catch (error) {
      console.error(error);
      alert('Hubo un error al procesar tu pedido. Por favor, intenta de nuevo o usa WhatsApp.');
      setCheckoutStep('form');
    }
  };

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
    
    const interval = setInterval(() => {
      if (progress.status === 'syncing' || loading) {
        fetchProducts();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [progress.status, loading]);

  // Reset to page 1 when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Cart logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.sku === product.sku);
      if (existing) {
        return prev.map(item => 
          item.product.sku === product.sku 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (sku: string) => {
    setCart(prev => prev.filter(item => item.product.sku !== sku));
  };

  const updateQuantity = (sku: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.sku === sku) {
        const newQ = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const parsePrice = (priceStr: string) => {
    // Convert "$20.280,00" to 20280.00
    const cleaned = priceStr.replace(/[^0-9,-]+/g, "").replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  const cartTotal = cart.reduce((sum, item) => sum + parsePrice(item.product.price) * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const checkoutWhatsApp = () => {
    const text = cart.map(item => `${item.quantity}x ${item.product.title} (${item.product.sku}) - ${item.product.price}`).join('\n');
    const total = cartTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    const message = `¡Hola FoxMoto! Quiero hacer el siguiente pedido:\n\n${text}\n\n*Total estimado: ${total}*`;
    window.open(`https://wa.me/5492915221351?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getBrand = (title: string) => {
    const brands = ['AMA', 'FAR', 'GILERA', 'HONDA', 'YAMAHA', 'MOTOMEL', 'ZANELLA', 'CORVEN', 'GUERRERO', 'BAJAJ', 'BENELLI', 'KELLER', 'KTM', 'SUZUKI', 'KAWASAKI', 'BMW', 'DUCATI', 'TRIUMPH', 'HARLEY', 'ROYAL ENFIELD', 'VULCAN', 'MONDIAL', 'BRAVA', 'APPPIA', 'CERRO', 'GHIGGERI', 'JAWA', 'KYMCO', 'SYM', 'VOGE', 'ZONTES'];
    const titleUpper = title.toUpperCase();
    for (const brand of brands) {
      if (titleUpper.includes(brand)) return brand;
    }
    return 'GENÉRICO';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(circle_at_50%_50%,_#1a1a1a_0%,_#0a0a0a_100%)] text-white font-sans pb-12 pt-20">
      {/* Sync Banner */}
      {progress.status === 'syncing' && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-blue-700 text-sm font-medium">
            <RefreshCw size={16} className="animate-spin" />
            Sincronizando catálogo en vivo... Escaneando página {progress.current_page} ({progress.total_products} productos encontrados)
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Catálogo de Repuestos</h2>
            <p className="text-white/40 mt-1 font-medium">Encuentra todo lo que necesitas para tu moto.</p>
          </div>
          <div className="text-xs text-white/60 font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-sm inline-flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Package size={14} className="text-[#ff4d00]" />
              {filteredProducts.length} productos
            </div>
            <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-1 bg-transparent border-none text-xs text-white placeholder:text-white/20 focus:outline-none w-32 sm:w-48 transition-all"
              />
            </div>
            <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 text-white/70 hover:text-[#ff4d00] transition-colors relative"
            >
              <ShoppingCart size={14} />
              <span>Carrito ({cartCount})</span>
            </button>
          </div>
        </div>

        {loading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="animate-spin text-[#ff4d00]" size={48} />
            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Iniciando sincronización...</p>
          </div>
        ) : error && products.length === 0 ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <AlertCircle className="text-red-500 mb-4" size={48} />
            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Error al cargar</h3>
            <p className="text-white/60 mt-2 text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-8 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-red-900/20"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="mx-auto text-white/10 mb-6" size={80} />
            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">No se encontraron productos</h3>
            <p className="text-white/40 mt-2 font-medium">Intenta con otra búsqueda.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentProducts.map((product, index) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  key={product.sku}
                  className="bg-[#121212] rounded-3xl shadow-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-300 group flex flex-col"
                >
                  <div className="relative aspect-square bg-white m-3 rounded-2xl flex items-center justify-center overflow-hidden">
                    {product.img && !product.img.includes('no-product-image') ? (
                      <img 
                        src={product.img} 
                        alt={product.title} 
                        className="object-contain w-[85%] h-[85%] group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-gray-200 flex flex-col items-center">
                        <Package size={48} />
                        <span className="text-xs mt-2 font-medium">Sin imagen</span>
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-0 left-0 flex flex-col gap-1 p-2">
                      {parsePrice(product.price) > 10000 && (
                        <div className="bg-[#ff4d00] text-white text-[9px] font-black px-2.5 py-1 rounded-sm italic uppercase tracking-tighter shadow-lg">
                          Envío Gratis
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute top-0 right-0 bg-[#1a1a1a] text-white/50 text-[8px] font-bold px-3 py-1.5 rounded-bl-xl border-l border-b border-white/5">
                      SKU: {product.sku}
                    </div>

                    <div className="absolute bottom-2 right-2 opacity-10 grayscale">
                      <img src="https://catalogo.duxsoftware.com.ar/assets/img/e-biz-logo.png" alt="e-biz" className="h-3" />
                    </div>
                  </div>
                  
                  <div className="px-5 pb-5 pt-2 flex flex-col flex-1">
                    <h3 className="font-bold text-white text-[13px] line-clamp-2 mb-3 leading-snug h-9" title={product.title}>
                      {product.title}
                    </h3>
                    
                    <div className="mb-5">
                      <p className="text-2xl font-black text-white tracking-tight">
                        {product.price}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <button 
                        onClick={() => addToCart(product)}
                        className="bg-[#ff4d00] hover:bg-[#ff6a2a] text-white py-3 px-2 rounded-xl transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 group/btn"
                      >
                        <ShoppingCart size={16} className="group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Comprar</span>
                      </button>
                      
                      <a 
                        href={`https://wa.me/5492915221351?text=Hola! Me interesa el producto: ${product.title} (SKU: ${product.sku})`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-[#004d1a] bg-[#004d1a]/5 hover:bg-[#004d1a]/10 text-[#00ff44] py-3 px-2 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <MessageCircle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Consultar</span>
                      </a>
                    </div>
                    
                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00ff44] shadow-[0_0_8px_rgba(0,255,68,0.5)]"></div>
                        <span className="text-[9px] font-black text-[#00ff44] uppercase tracking-widest">
                          Stock {product.stock.toLowerCase().includes('ilimitado') ? 'Disponible' : product.stock}
                        </span>
                      </div>
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                        {getBrand(product.title)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-4">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-3 rounded-xl border border-white/10 bg-[#121212] text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="text-sm font-black uppercase tracking-widest text-white/40">
                  Página <span className="text-[#ff4d00]">{currentPage}</span> de {totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-xl border border-white/10 bg-[#121212] text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Shopping Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-96 bg-[#121212] shadow-2xl z-50 flex flex-col border-l border-white/5"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#1a1a1a]">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="text-[#ff4d00]" size={24} />
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Tu Pedido</h2>
                  <span className="bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10">
                    {cartCount} items
                  </span>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {checkoutStep === 'success' ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 bg-[#00ff44]/10 text-[#00ff44] rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,255,68,0.2)]">
                      <Package size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">¡Pedido Confirmado!</h3>
                    <p className="text-white/40 text-sm font-medium">Tu pedido ha sido procesado exitosamente en FoxMoto.</p>
                    <button 
                      onClick={() => {
                        setIsCartOpen(false);
                        setCheckoutStep('cart');
                      }}
                      className="mt-8 bg-[#ff4d00] hover:bg-[#ff6a2a] text-white font-black uppercase tracking-widest text-xs py-4 px-8 rounded-2xl transition-all shadow-lg shadow-orange-900/20"
                    >
                      Volver a la tienda
                    </button>
                  </div>
                ) : checkoutStep === 'processing' ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                    <Loader2 className="animate-spin text-[#ff4d00]" size={64} />
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Procesando tu pedido...</h3>
                    <p className="text-white/40 text-sm font-medium">Estamos automatizando tu compra en FoxMoto. Esto puede demorar unos segundos.</p>
                  </div>
                ) : checkoutStep === 'form' ? (
                  <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-black text-white uppercase tracking-widest text-[10px] border-b border-white/5 pb-2">Datos de Contacto</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                          <input required type="email" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ff4d00] focus:border-transparent transition-all" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 ml-1">Teléfono</label>
                          <input required type="tel" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ff4d00] focus:border-transparent transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 ml-1">Nombre</label>
                          <input required type="text" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ff4d00] focus:border-transparent transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 ml-1">Apellido</label>
                          <input required type="text" value={customerForm.lastname} onChange={e => setCustomerForm({...customerForm, lastname: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ff4d00] focus:border-transparent transition-all" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 ml-1">DNI / CUIT</label>
                          <input required type="text" value={customerForm.idNumber} onChange={e => setCustomerForm({...customerForm, idNumber: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ff4d00] focus:border-transparent transition-all" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <h3 className="font-black text-white uppercase tracking-widest text-[10px] border-b border-white/5 pb-2">Datos de Envío</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 ml-1">Calle</label>
                          <input required type="text" value={customerForm.street} onChange={e => setCustomerForm({...customerForm, street: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ff4d00] focus:border-transparent transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 ml-1">Número</label>
                          <input required type="text" value={customerForm.streetNumber} onChange={e => setCustomerForm({...customerForm, streetNumber: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ff4d00] focus:border-transparent transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 ml-1">Código Postal</label>
                          <input required type="text" value={customerForm.zipCode} onChange={e => setCustomerForm({...customerForm, zipCode: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ff4d00] focus:border-transparent transition-all" />
                        </div>
                      </div>
                    </div>
                  </form>
                ) : cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-6">
                    <ShoppingCart size={80} className="opacity-10" />
                    <p className="text-lg font-black uppercase tracking-widest">Tu carrito está vacío</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="text-[#ff4d00] text-sm font-black uppercase tracking-widest hover:underline"
                    >
                      Seguir comprando
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.product.sku} className="flex gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 group">
                        <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.product.img && !item.product.img.includes('no-product-image') ? (
                            <img src={item.product.img} alt={item.product.title} className="object-contain w-[80%] h-[80%] group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                          ) : (
                            <Package size={32} className="text-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <h4 className="text-sm font-bold text-white line-clamp-1 leading-tight">{item.product.title}</h4>
                            <p className="text-xs text-white/40 mt-1 uppercase font-black tracking-widest">SKU: {item.product.sku}</p>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <p className="text-lg font-black text-[#ff4d00]">{item.product.price}</p>
                            <div className="flex items-center gap-3 bg-black/40 rounded-lg p-1 border border-white/5">
                              <button 
                                onClick={() => updateQuantity(item.product.sku, -1)}
                                className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded transition-all"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-sm font-black w-4 text-center text-white">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.product.sku, 1)}
                                className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded transition-all"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.product.sku)}
                          className="text-white/20 hover:text-red-500 transition-colors self-start p-1"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && checkoutStep === 'cart' && (
                <div className="p-6 border-t border-white/5 bg-[#1a1a1a] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 font-black uppercase tracking-widest text-xs">Total estimado</span>
                    <span className="text-2xl font-black text-white tracking-tighter italic">
                      {cartTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => setCheckoutStep('form')}
                      className="w-full bg-[#ff4d00] hover:bg-[#ff6a2a] text-white font-black uppercase tracking-widest text-sm py-4 rounded-2xl transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-3"
                    >
                      <ShoppingCart size={20} />
                      <span>Proceder al pago</span>
                    </button>
                    <button 
                      onClick={checkoutWhatsApp}
                      className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black uppercase tracking-widest text-sm py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-900/20"
                    >
                      <MessageCircle size={20} />
                      <span>WhatsApp Checkout</span>
                    </button>
                  </div>
                </div>
              )}

              {checkoutStep === 'form' && (
                <div className="p-6 border-t border-white/5 bg-[#1a1a1a] flex gap-4">
                  <button 
                    onClick={() => setCheckoutStep('cart')}
                    className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 font-black uppercase tracking-widest text-xs py-4 rounded-2xl transition-all"
                  >
                    Volver
                  </button>
                  <button 
                    type="submit"
                    form="checkout-form"
                    className="flex-1 bg-[#ff4d00] hover:bg-[#ff6a2a] text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl transition-all shadow-lg shadow-orange-900/20"
                  >
                    Confirmar
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
