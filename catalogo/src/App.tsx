/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ShoppingCart, Search, Package, Loader2, AlertCircle, RefreshCw, X, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-orange-600 text-white p-2 rounded-lg">
              <Package size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">FoxMoto Store</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar repuestos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-64 transition-all"
              />
            </div>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors relative"
            >
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        {/* Mobile Search */}
        <div className="sm:hidden px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar repuestos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </header>

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
            <h2 className="text-2xl font-bold text-gray-900">Catálogo de Repuestos</h2>
            <p className="text-gray-500 mt-1">Encuentra todo lo que necesitas para tu moto.</p>
          </div>
          <div className="text-sm text-gray-500 font-medium bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm inline-flex items-center gap-2">
            <Package size={16} className="text-orange-500" />
            {filteredProducts.length} productos disponibles
          </div>
        </div>

        {loading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="animate-spin text-orange-600" size={48} />
            <p className="text-gray-500 font-medium">Iniciando sincronización con FoxMoto...</p>
          </div>
        ) : error && products.length === 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <AlertCircle className="text-red-500 mb-2" size={32} />
            <h3 className="text-lg font-semibold text-red-800">Error al cargar</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900">No se encontraron productos</h3>
            <p className="text-gray-500 mt-1">Intenta con otra búsqueda.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentProducts.map((product, index) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  key={product.sku}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
                >
                  <div className="relative aspect-square bg-gray-100 p-4 flex items-center justify-center overflow-hidden">
                    {product.img && !product.img.includes('no-product-image') ? (
                      <img 
                        src={product.img} 
                        alt={product.title} 
                        className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-gray-300 flex flex-col items-center">
                        <Package size={48} />
                        <span className="text-xs mt-2 font-medium">Sin imagen</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-mono font-bold text-gray-600 border border-gray-200">
                      SKU: {product.sku}
                    </div>
                  </div>
                  
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2 flex-1" title={product.title}>
                      {product.title}
                    </h3>
                    
                    <div className="flex items-end justify-between mt-auto pt-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Precio</p>
                        <p className="text-lg font-bold text-gray-900">{product.price}</p>
                      </div>
                      <button 
                        onClick={() => addToCart(product)}
                        className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                      >
                        <ShoppingCart size={18} />
                        <span className="sr-only sm:not-sr-only sm:text-sm font-medium pr-1">Agregar</span>
                      </button>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {product.stock}
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
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="text-sm font-medium text-gray-700">
                  Página <span className="text-orange-600 font-bold">{currentPage}</span> de {totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={20} />
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-orange-600" size={24} />
                  <h2 className="text-lg font-bold text-gray-900">Tu Pedido</h2>
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                    {cartCount} items
                  </span>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {checkoutStep === 'success' ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                      <Package size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">¡Pedido Confirmado!</h3>
                    <p className="text-gray-500">Tu pedido ha sido procesado exitosamente en FoxMoto.</p>
                    <button 
                      onClick={() => {
                        setIsCartOpen(false);
                        setCheckoutStep('cart');
                      }}
                      className="mt-6 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                      Volver a la tienda
                    </button>
                  </div>
                ) : checkoutStep === 'processing' ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <Loader2 className="animate-spin text-orange-600" size={48} />
                    <h3 className="text-lg font-bold text-gray-900">Procesando tu pedido...</h3>
                    <p className="text-gray-500 text-sm">Estamos automatizando tu compra en FoxMoto. Esto puede demorar unos segundos.</p>
                  </div>
                ) : checkoutStep === 'form' ? (
                  <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
                    <h3 className="font-bold text-gray-900 border-b pb-2">Datos de Contacto</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                        <input required type="email" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                        <input required type="tel" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                        <input required type="text" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Apellido</label>
                        <input required type="text" value={customerForm.lastname} onChange={e => setCustomerForm({...customerForm, lastname: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">DNI / CUIT</label>
                        <input required type="text" value={customerForm.idNumber} onChange={e => setCustomerForm({...customerForm, idNumber: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                      </div>
                    </div>

                    <h3 className="font-bold text-gray-900 border-b pb-2 mt-6">Datos de Envío</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Calle</label>
                        <input required type="text" value={customerForm.street} onChange={e => setCustomerForm({...customerForm, street: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Número</label>
                        <input required type="text" value={customerForm.streetNumber} onChange={e => setCustomerForm({...customerForm, streetNumber: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Código Postal</label>
                        <input required type="text" value={customerForm.zipCode} onChange={e => setCustomerForm({...customerForm, zipCode: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                      </div>
                    </div>
                  </form>
                ) : cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                    <ShoppingCart size={64} className="opacity-20" />
                    <p className="text-sm font-medium">Tu carrito está vacío</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="text-orange-600 text-sm font-bold hover:underline"
                    >
                      Seguir comprando
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.product.sku} className="flex gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.product.img && !item.product.img.includes('no-product-image') ? (
                            <img src={item.product.img} alt={item.product.title} className="object-contain w-full h-full" referrerPolicy="no-referrer" />
                          ) : (
                            <Package size={24} className="text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">{item.product.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{item.product.price}</p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                              <button 
                                onClick={() => updateQuantity(item.product.sku, -1)}
                                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-sm rounded transition-all"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.product.sku, 1)}
                                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-sm rounded transition-all"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.product.sku)}
                              className="text-xs text-red-500 hover:text-red-700 font-medium"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && checkoutStep === 'cart' && (
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600 font-medium">Total estimado</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {cartTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                    </span>
                  </div>
                  <button 
                    onClick={() => setCheckoutStep('form')}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm mb-2"
                  >
                    Proceder al pago
                  </button>
                  <button 
                    onClick={checkoutWhatsApp}
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    Completar pedido por WhatsApp
                  </button>
                </div>
              )}

              {checkoutStep === 'form' && (
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                  <button 
                    onClick={() => setCheckoutStep('cart')}
                    className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors"
                  >
                    Volver
                  </button>
                  <button 
                    type="submit"
                    form="checkout-form"
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm"
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
