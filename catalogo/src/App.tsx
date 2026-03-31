/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ShoppingCart, Search, Package, Loader2, AlertCircle, RefreshCw, X, Plus, Minus, ChevronLeft, ChevronRight, MessageCircle, Filter, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Handle accents
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

function ProductDetailView({ products, cartTotal, addToCart, setIsCartOpen }: { 
  products: Product[], 
  cartTotal: number, 
  addToCart: (p: Product) => void,
  setIsCartOpen: (o: boolean) => void
}) {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const product = products.find(p => slugify(p.title) === slug);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
        <button onClick={() => navigate('/catalogo')} className="text-[#ff4d00] font-bold hover:underline">Volver al catálogo</button>
      </div>
    );
  }

  const getCategory = (title: string) => {
    const categories = [
      { name: 'MOTOR', keywords: ['MOTOR', 'PISTON', 'VALVULA', 'CILINDRO', 'BIELA', 'JUNTA', 'CARBURADOR', 'FILTRO AIRE', 'FILTRO ACEITE'] },
      { name: 'TRANSMISIÓN', keywords: ['CADENA', 'CORONA', 'PIÑON', 'TRANSMISION', 'EMBRAGUE', 'VARIADOR'] },
      { name: 'FRENOS', keywords: ['FRENO', 'PASTILLA', 'ZAPATA', 'DISCO', 'CABLE FRENO'] },
      { name: 'SUSPENSIÓN', keywords: ['AMORTIGUADOR', 'BARRAL', 'RETEN', 'HORQUILLA'] },
      { name: 'ELÉCTRICO', keywords: ['BATERIA', 'BUJIA', 'BOBINA', 'CDI', 'REGULADOR', 'ESTATOR', 'LAMPARA', 'GIRO', 'FARO'] },
      { name: 'CHASIS', keywords: ['ESPEJO', 'MANUBRIO', 'PUÑO', 'ASIENTO', 'TANQUE', 'GUARDABARRO', 'PLASTICO', 'CABALLETE'] },
      { name: 'CUBIERTAS', keywords: ['CUBIERTA', 'CAMARA', 'LLANTA', 'RAYO'] },
      { name: 'ACCESORIOS', keywords: ['CASCO', 'GUANTE', 'ACEITE', 'LUBRICANTE', 'CADENA SEGURIDAD', 'BAUL', 'PARABRISA'] }
    ];
    const titleUpper = title.toUpperCase();
    for (const cat of categories) {
      if (cat.keywords.some(k => titleUpper.includes(k))) return cat.name;
    }
    return 'OTROS';
  };

  const productCategory = getCategory(product.title);
  const relatedProducts = products
    .filter(p => p.sku !== product.sku && getCategory(p.title) === productCategory)
    .slice(0, 4);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `Mira este repuesto en FoxMoto: ${product.title}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(circle_at_50%_50%,_#1a1a1a_0%,_#0a0a0a_100%)] text-white flex flex-col">
      {/* Detail Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-white/10 px-4 h-16 flex items-center justify-between sticky top-0 z-40">
        <button 
          onClick={() => navigate('/catalogo')}
          className="flex items-center gap-2 text-white/70 hover:text-[#ff4d00] transition-colors font-medium"
        >
          <ChevronLeft size={20} />
          <span>Volver al Catálogo</span>
        </button>
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30">
          <Link to="/" className="hover:text-white">Inicio</Link>
          <span>/</span>
          <Link to="/catalogo" className="hover:text-white">Catálogo</Link>
          <span>/</span>
          <span className="text-[#ff4d00]">{productCategory}</span>
        </div>
        <button 
          onClick={handleShare}
          className="p-2 text-white/70 hover:text-[#ff4d00] transition-colors"
          title="Compartir"
        >
          <Share2 size={20} />
        </button>
      </header>

      {/* Detail Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="bg-[#121212] rounded-3xl shadow-2xl border border-white/5 overflow-hidden flex flex-col md:flex-row">
            {/* Image Section */}
            <div className="md:w-1/2 p-8 flex flex-col gap-4 bg-white m-4 rounded-2xl">
              <div className="aspect-square flex items-center justify-center p-8">
                {product.img && !product.img.includes('no-product-image') ? (
                  <img src={product.img} alt={product.title} className="object-contain max-h-full max-w-full" referrerPolicy="no-referrer" />
                ) : (
                  <Package size={120} className="text-gray-100" />
                )}
              </div>
            </div>

            {/* Info Section */}
            <div className="md:w-1/2 p-8 sm:p-12 flex flex-col">
              <span className="text-xs font-black text-white/30 uppercase tracking-widest mb-2 bg-white/5 px-3 py-1 rounded-full border border-white/5 inline-block w-fit">SKU: {product.sku}</span>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-8 uppercase italic tracking-tighter">
                {product.title}
              </h1>
              
              <div className="mb-12">
                <p className="text-5xl font-black text-[#ff4d00] tracking-tighter italic">
                  {product.price}
                </p>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-2">Precio contado / transferencia</p>
              </div>

              <div className="mt-auto space-y-6">
                <div className="flex items-center gap-2 text-white/60 font-bold uppercase tracking-widest text-xs">
                  <span>Stock:</span>
                  <span className="text-[#ff4d00]">{product.stock.toLowerCase().includes('ilimitado') ? 'Ilimitado' : product.stock}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => {
                      addToCart(product);
                    }}
                    className="flex-1 bg-[#ff4d00] hover:bg-[#ff6a00] text-white font-black uppercase tracking-widest text-xs py-5 px-8 rounded-2xl transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-3"
                  >
                    <ShoppingCart size={20} />
                    <span>Agregar al carrito</span>
                  </button>
                  <button 
                    onClick={() => {
                      const text = `¡Hola FoxMoto! Me interesa el producto: ${product.title} (SKU: ${product.sku})`;
                      window.open(`https://wa.me/5492915221351?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="flex-1 border-2 border-white/10 hover:border-white/20 text-white font-black uppercase tracking-widest text-xs py-5 px-8 rounded-2xl transition-all flex items-center justify-center gap-3 bg-white/5"
                  >
                    <MessageCircle size={20} />
                    <span>Consultar WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter italic border-l-4 border-[#ff4d00] pl-4">También te puede interesar</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map(p => (
                  <Link 
                    key={p.sku} 
                    to={`/catalogo/${slugify(p.title)}`}
                    className="bg-[#121212] rounded-2xl p-4 border border-white/5 hover:border-[#ff4d00]/30 transition-all group"
                  >
                    <div className="aspect-square bg-white rounded-xl mb-4 flex items-center justify-center p-4 overflow-hidden">
                      {p.img && !p.img.includes('no-product-image') ? (
                        <img src={p.img} alt={p.title} className="object-contain max-h-full max-w-full group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                      ) : (
                        <Package size={40} className="text-gray-200" />
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-2 mb-2 h-8">{p.title}</h4>
                    <p className="text-[#ff4d00] font-black tracking-tighter">{p.price}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center pt-8">
            <button 
              onClick={() => navigate('/catalogo')}
              className="text-white/40 hover:text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all"
            >
              <ChevronLeft size={14} />
              <span>Seguir comprando repuestos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

export default function App({ 
  cart = [], 
  setCart, 
  isCartOpen = false, 
  setIsCartOpen,
  addToCart,
  removeFromCart,
  updateQuantity,
  cartTotal = 0,
  cartCount = 0,
  checkoutStep = 'cart',
  setCheckoutStep,
  customerForm,
  setCustomerForm,
  checkoutWhatsApp,
  handleCheckoutSubmit
}: { 
  cart?: CartItem[], 
  setCart?: React.Dispatch<React.SetStateAction<CartItem[]>>, 
  isCartOpen?: boolean, 
  setIsCartOpen?: (o: boolean) => void,
  addToCart?: (p: Product) => void,
  removeFromCart?: (sku: string) => void,
  updateQuantity?: (sku: string, delta: number) => void,
  cartTotal?: number,
  cartCount?: number,
  checkoutStep?: 'cart' | 'form' | 'processing' | 'success',
  setCheckoutStep?: (step: 'cart' | 'form' | 'processing' | 'success') => void,
  customerForm?: any,
  setCustomerForm?: (form: any) => void,
  checkoutWhatsApp?: () => void,
  handleCheckoutSubmit?: (e: React.FormEvent) => void
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [progress, setProgress] = useState<SyncProgress>({ current_page: 0, total_products: 0, status: 'idle' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('TODAS');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'>('relevance');
  const navigate = useNavigate();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const parsePrice = (priceStr: string) => {
    // Convert "$20.280,00" to 20280.00
    const cleaned = priceStr.replace(/[^0-9,-]+/g, "").replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
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

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBrand = selectedBrand === 'TODAS' || getBrand(p.title) === selectedBrand;
      const matchesCategory = selectedCategory === 'TODAS' || getCategory(p.title) === selectedCategory;
      
      return matchesSearch && matchesBrand && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return parsePrice(a.price) - parsePrice(b.price);
      if (sortBy === 'price-desc') return parsePrice(b.price) - parsePrice(a.price);
      if (sortBy === 'name-asc') return a.title.localeCompare(b.title);
      if (sortBy === 'name-desc') return b.title.localeCompare(a.title);
      return 0; // relevance (default order from API)
    });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getBrand = (title: string) => {
    const brands = ['AMA', 'FAR', 'GILERA', 'HONDA', 'YAMAHA', 'MOTOMEL', 'ZANELLA', 'CORVEN', 'GUERRERO', 'BAJAJ', 'BENELLI', 'KELLER', 'KTM', 'SUZUKI', 'KAWASAKI', 'BMW', 'DUCATI', 'TRIUMPH', 'HARLEY', 'ROYAL ENFIELD', 'VULCAN', 'MONDIAL', 'BRAVA', 'APPPIA', 'CERRO', 'GHIGGERI', 'JAWA', 'KYMCO', 'SYM', 'VOGE', 'ZONTES'];
    const titleUpper = title.toUpperCase();
    for (const brand of brands) {
      if (titleUpper.includes(brand)) return brand;
    }
    return 'GENÉRICO';
  };

  const getCategory = (title: string) => {
    const categories = [
      { name: 'MOTOR', keywords: ['MOTOR', 'PISTON', 'VALVULA', 'CILINDRO', 'BIELA', 'JUNTA', 'CARBURADOR', 'FILTRO AIRE', 'FILTRO ACEITE'] },
      { name: 'TRANSMISIÓN', keywords: ['CADENA', 'CORONA', 'PIÑON', 'TRANSMISION', 'EMBRAGUE', 'VARIADOR'] },
      { name: 'FRENOS', keywords: ['FRENO', 'PASTILLA', 'ZAPATA', 'DISCO', 'CABLE FRENO'] },
      { name: 'SUSPENSIÓN', keywords: ['AMORTIGUADOR', 'BARRAL', 'RETEN', 'HORQUILLA'] },
      { name: 'ELÉCTRICO', keywords: ['BATERIA', 'BUJIA', 'BOBINA', 'CDI', 'REGULADOR', 'ESTATOR', 'LAMPARA', 'GIRO', 'FARO'] },
      { name: 'CHASIS', keywords: ['ESPEJO', 'MANUBRIO', 'PUÑO', 'ASIENTO', 'TANQUE', 'GUARDABARRO', 'PLASTICO', 'CABALLETE'] },
      { name: 'CUBIERTAS', keywords: ['CUBIERTA', 'CAMARA', 'LLANTA', 'RAYO'] },
      { name: 'ACCESORIOS', keywords: ['CASCO', 'GUANTE', 'ACEITE', 'LUBRICANTE', 'CADENA SEGURIDAD', 'BAUL', 'PARABRISA'] }
    ];
    
    const titleUpper = title.toUpperCase();
    for (const cat of categories) {
      if (cat.keywords.some(k => titleUpper.includes(k))) return cat.name;
    }
    return 'OTROS';
  };

  const brands = ['TODAS', ...new Set(products.map(p => getBrand(p.title)))].sort();
  const categories = ['TODAS', ...new Set(products.map(p => getCategory(p.title)))].sort();

  return (
    <>
      <Routes>
        <Route path="/" element={
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
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar repuestos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#ff4d00] w-full sm:w-64 transition-all"
                    />
                  </div>
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all border ${showFilters ? 'bg-[#ff4d00] border-[#ff4d00] text-white' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                  >
                    <Filter size={14} />
                    <span>Filtros</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-8"
                  >
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Marca</label>
                        <select 
                          value={selectedBrand}
                          onChange={(e) => setSelectedBrand(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ff4d00] transition-all"
                        >
                          {brands.map(b => <option key={b} value={b} className="bg-[#121212]">{b}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Categoría</label>
                        <select 
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ff4d00] transition-all"
                        >
                          {categories.map(c => <option key={c} value={c} className="bg-[#121212]">{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Ordenar por</label>
                        <select 
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ff4d00] transition-all"
                        >
                          <option value="relevance" className="bg-[#121212]">Relevancia</option>
                          <option value="price-asc" className="bg-[#121212]">Precio: Menor a Mayor</option>
                          <option value="price-desc" className="bg-[#121212]">Precio: Mayor a Menor</option>
                          <option value="name-asc" className="bg-[#121212]">Nombre: A-Z</option>
                          <option value="name-desc" className="bg-[#121212]">Nombre: Z-A</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                        onClick={() => navigate(`${slugify(product.title)}`)}
                        className="bg-[#121212] rounded-3xl shadow-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-300 group flex flex-col cursor-pointer"
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
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart?.(product);
                              }}
                              className="bg-[#ff4d00] hover:bg-[#ff6a2a] text-white py-3 px-2 rounded-xl transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 group/btn"
                            >
                              <ShoppingCart size={16} className="group-hover/btn:scale-110 transition-transform" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Comprar</span>
                            </button>
                            
                            <a 
                              href={`https://wa.me/5492915221351?text=Hola! Me interesa el producto: ${product.title} (SKU: ${product.sku})`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
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
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-white/10 bg-[#121212] text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      
                      {(() => {
                        const pages = [];
                        const maxVisible = 5;
                        let start = Math.max(1, currentPage - 2);
                        let end = Math.min(totalPages, start + maxVisible - 1);
                        
                        if (end - start < maxVisible - 1) {
                          start = Math.max(1, end - maxVisible + 1);
                        }

                        if (start > 1) {
                          pages.push(
                            <button key={1} onClick={() => setCurrentPage(1)} className="w-10 h-10 rounded-lg border border-white/10 bg-[#121212] text-white/40 hover:text-white transition-all text-xs font-black">1</button>
                          );
                          if (start > 2) pages.push(<span key="d1" className="text-white/20">...</span>);
                        }

                        for (let i = start; i <= end; i++) {
                          pages.push(
                            <button 
                              key={i} 
                              onClick={() => setCurrentPage(i)}
                              className={`w-10 h-10 rounded-lg border transition-all text-xs font-black ${currentPage === i ? 'border-[#ff4d00] bg-[#ff4d00]/10 text-[#ff4d00]' : 'border-white/10 bg-[#121212] text-white/40 hover:text-white'}`}
                            >
                              {i}
                            </button>
                          );
                        }

                        if (end < totalPages) {
                          if (end < totalPages - 1) pages.push(<span key="d2" className="text-white/20">...</span>);
                          pages.push(
                            <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className="w-10 h-10 rounded-lg border border-white/10 bg-[#121212] text-white/40 hover:text-white transition-all text-xs font-black">{totalPages}</button>
                          );
                        }
                        return pages;
                      })()}

                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-white/10 bg-[#121212] text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        } />
        <Route path=":slug" element={
          <ProductDetailView 
            products={products} 
            cartTotal={cartTotal} 
            addToCart={addToCart} 
            setIsCartOpen={setIsCartOpen} 
          />
        } />
      </Routes>

      <AnimatePresence>
        {/* Cart Sidebar removed - now handled globally in root App.tsx */}
      </AnimatePresence>
    </>
  );
}
