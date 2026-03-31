import React from 'react';
import { ShoppingCart, X, Package, Loader2, Minus, Plus, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  sku: string;
  title: string;
  price: string;
  stock: string;
  img: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  cartTotal: number;
  cartCount: number;
  updateQuantity: (sku: string, delta: number) => void;
  removeFromCart: (sku: string) => void;
  checkoutStep: 'cart' | 'form' | 'processing' | 'success';
  setCheckoutStep: (step: 'cart' | 'form' | 'processing' | 'success') => void;
  customerForm: any;
  setCustomerForm: (form: any) => void;
  checkoutWhatsApp: () => void;
  handleCheckoutSubmit: (e: React.FormEvent) => void;
}

export default function CartSidebar({
  isOpen,
  onClose,
  cart,
  cartTotal,
  cartCount,
  updateQuantity,
  removeFromCart,
  checkoutStep,
  setCheckoutStep,
  customerForm,
  setCustomerForm,
  checkoutWhatsApp,
  handleCheckoutSubmit
}: CartSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-[#0a0a0a] border-l border-white/10 z-[70] flex flex-col shadow-2xl"
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
                onClick={onClose}
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
                      onClose();
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
                    onClick={onClose}
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
  );
}
