import React, { useState } from 'react';
import { ShoppingCart, Package, Loader2, ChevronLeft, Minus, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Checkout({ 
  cart, 
  setCart, 
  setProducts, 
  getStockNumber 
}: any) {
  const navigate = useNavigate();
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'processing' | 'success'>('form');
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

  const parsePrice = (priceStr: string) => {
    const cleaned = priceStr.replace(/[^0-9,-]+/g, "").replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  const cartTotal = cart.reduce((sum: number, item: any) => sum + parsePrice(item.product.price) * item.quantity, 0);

  const updateQuantity = (sku: string, delta: number) => {
    setCart((prev: any) => prev.map((item: any) => {
      if (item.product.sku === sku) {
        const stockAvailable = getStockNumber(item.product.stock);
        const newQ = item.quantity + delta;
        
        if (newQ > stockAvailable) {
          toast.error(`Solo hay ${stockAvailable} unidades disponibles`);
          return item;
        }
        
        return { ...item, quantity: Math.max(1, newQ) };
      }
      return item;
    }));
  };

  const removeFromCart = (sku: string) => {
    setCart((prev: any) => prev.filter((item: any) => item.product.sku !== sku));
    toast.info('Producto eliminado del carrito');
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    // Basic validation
    if (!customerForm.email.includes('@')) {
      toast.error('Por favor ingresa un email válido');
      return;
    }
    if (!/^[0-9]+$/.test(customerForm.phone)) {
      toast.error('El teléfono solo debe contener números');
      return;
    }
    if (!/^[0-9]+$/.test(customerForm.idNumber)) {
      toast.error('El DNI/CUIT solo debe contener números');
      return;
    }

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
      
      const text = cart.map((item: any) => `${item.quantity}x ${item.product.title} (${item.product.sku}) - ${item.product.price}`).join('\n');
      const total = cart.reduce((sum: number, item: any) => {
        const cleaned = item.product.price.replace(/[^0-9,-]+/g, "").replace(/\./g, "").replace(",", ".");
        return sum + (parseFloat(cleaned) || 0) * item.quantity;
      }, 0);
      const totalStr = total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
      
      const message = `hola fox te envio los datos de mi pedido\n\n*Carrito:*\n${text}\n\n*Monto Total: ${totalStr}*\n\n*Datos de contacto:*\nNombre: ${customerForm.name} ${customerForm.lastname}\nDNI/CUIT: ${customerForm.idNumber}\nEmail: ${customerForm.email}\nTeléfono: ${customerForm.phone}\nDirección: ${customerForm.street} ${customerForm.streetNumber}\nCódigo Postal: ${customerForm.zipCode}`;
      
      window.open(`https://wa.me/5492915221351?text=${encodeURIComponent(message)}`, '_blank');

      // Track Purchase Event
      try {
        if (typeof (window as any).gtag === 'function') {
          (window as any).gtag('event', 'purchase', { value: total, currency: 'ARS' });
        }
        if (typeof (window as any).fbq === 'function') {
          (window as any).fbq('track', 'Purchase', { value: total, currency: 'ARS' });
        }
      } catch (e) {
        console.error('Tracking error', e);
      }

      // Decrement stock locally
      setProducts((prevProducts: any) => {
        const updatedProducts = prevProducts.map((p: any) => {
          const cartItem = cart.find((item: any) => item.product.sku === p.sku);
          if (cartItem) {
            if (p.stock.toLowerCase().includes('ilimitado') || p.stock.toLowerCase().includes('ilimitada')) {
              return p;
            }
            const currentStock = parseInt(p.stock.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(currentStock)) {
              return { ...p, stock: `Stock: ${Math.max(0, currentStock - cartItem.quantity)}` };
            }
          }
          return p;
        });
        localStorage.setItem('foxmoto_products', JSON.stringify(updatedProducts));
        return updatedProducts;
      });

      setCheckoutStep('success');
      setCart([]);
    } catch (error) {
      console.error(error);
      toast.error('Hubo un error al procesar tu pedido. Por favor, intenta de nuevo o usa WhatsApp.');
      setCheckoutStep('form');
    }
  };

  if (checkoutStep === 'success') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 pt-20">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#111] p-8 rounded-2xl shadow-sm border border-[#333] max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
            <Package size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">¡Pedido Confirmado!</h2>
          <p className="text-gray-400 mb-8">Tu pedido ha sido procesado exitosamente en FoxMoto. Te hemos redirigido a WhatsApp para finalizar la coordinación.</p>
          <button 
            onClick={() => navigate('/catalogo')}
            className="w-full bg-gradient-to-r from-[#FF4500] to-[#D20000] hover:scale-[1.02] text-white font-bold py-3 px-6 rounded-xl transition-transform"
          >
            Volver a la tienda
          </button>
        </motion.div>
      </div>
    );
  }

  if (checkoutStep === 'processing') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 pt-20">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#111] p-8 rounded-2xl shadow-sm border border-[#333] max-w-md w-full text-center"
        >
          <Loader2 className="animate-spin text-[#FF4500] mx-auto mb-6" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">Procesando tu pedido...</h2>
          <p className="text-gray-400 text-sm">Estamos automatizando tu compra en FoxMoto. Esto puede demorar unos segundos, por favor no cierres esta ventana.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans pb-12 pt-20">
      <header className="bg-[#111] shadow-sm sticky top-20 z-10 border-b border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <button 
            onClick={() => navigate('/catalogo')}
            className="flex items-center gap-2 text-gray-400 hover:text-[#FF4500] transition-colors font-medium"
          >
            <ChevronLeft size={20} />
            Volver a la tienda
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-display font-black italic uppercase text-white mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-7">
            <div className="bg-[#111] rounded-2xl shadow-sm border border-[#333] p-6 sm:p-8">
              <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white border-b border-[#333] pb-3 mb-4">Datos de Contacto</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                      <input required type="email" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent" placeholder="ejemplo@correo.com" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Teléfono</label>
                      <input required type="tel" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent" placeholder="Código de área + número" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Nombre</label>
                      <input required type="text" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Apellido</label>
                      <input required type="text" value={customerForm.lastname} onChange={e => setCustomerForm({...customerForm, lastname: e.target.value})} className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">DNI / CUIT</label>
                      <input required type="text" value={customerForm.idNumber} onChange={e => setCustomerForm({...customerForm, idNumber: e.target.value})} className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white border-b border-[#333] pb-3 mb-4 mt-8">Datos de Envío</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Calle</label>
                      <input required type="text" value={customerForm.street} onChange={e => setCustomerForm({...customerForm, street: e.target.value})} className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Número</label>
                      <input required type="text" value={customerForm.streetNumber} onChange={e => setCustomerForm({...customerForm, streetNumber: e.target.value})} className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Código Postal</label>
                      <input required type="text" value={customerForm.zipCode} onChange={e => setCustomerForm({...customerForm, zipCode: e.target.value})} className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent" />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary Section */}
          <div className="lg:col-span-5">
            <div className="bg-[#111] rounded-2xl shadow-sm border border-[#333] p-6 sm:p-8 sticky top-32">
              <h3 className="text-lg font-bold text-white border-b border-[#333] pb-3 mb-4">Resumen del Pedido</h3>
              
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto text-gray-600 mb-3" size={40} />
                  <p className="text-gray-400">Tu carrito está vacío</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mb-6">
                    {cart.map((item: any) => (
                      <div key={item.product.sku} className="flex gap-4">
                        <div className="w-16 h-16 bg-[#0A0A0A] rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-[#333]">
                          {item.product.img && !item.product.img.includes('no-product-image') ? (
                            <img src={item.product.img} alt={item.product.title} className="object-contain w-full h-full" referrerPolicy="no-referrer" />
                          ) : (
                            <Package size={24} className="text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-white line-clamp-2 leading-tight">{item.product.title}</h4>
                            <p className="text-xs text-gray-400 mt-1">{item.product.price}</p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 bg-[#0A0A0A] rounded-lg p-1 border border-[#333]">
                              <button 
                                type="button"
                                onClick={() => updateQuantity(item.product.sku, -1)}
                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#222] rounded transition-all"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-sm font-bold w-4 text-center text-white">{item.quantity}</span>
                              <button 
                                type="button"
                                onClick={() => updateQuantity(item.product.sku, 1)}
                                disabled={item.quantity >= getStockNumber(item.product.stock)}
                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#222] rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <button 
                              type="button"
                              onClick={() => removeFromCart(item.product.sku)}
                              className="text-xs text-red-500 hover:text-red-400 font-medium"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#333] pt-4">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-lg font-medium text-gray-400">Total</span>
                      <span className="text-2xl font-bold text-[#FF4500]">
                        {cartTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                      </span>
                    </div>
                    
                    <button 
                      type="submit"
                      form="checkout-form"
                      disabled={cart.length === 0}
                      className="w-full bg-gradient-to-r from-[#FF4500] to-[#D20000] hover:scale-[1.02] text-white font-bold py-3.5 px-4 rounded-xl transition-transform shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirmar Pedido
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
