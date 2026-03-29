import React, { useEffect, useState, useMemo } from 'react';
import { ShoppingCart, Search, Package, Loader2, AlertCircle, RefreshCw, X, Plus, Minus, ChevronLeft, ChevronRight, Trash2, Filter, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';

const KNOWN_CATEGORIES = [
  'CASCO', 'ACEITE', 'BATERIA', 'CUBIERTA', 'NEUMATICO', 'FILTRO', 
  'TRANSMISION', 'PASTILLA', 'BUJIA', 'ESPEJO', 'OPTICA', 'FARO', 
  'MANUBRIO', 'CABLE', 'EMBRAGUE', 'ESCAPE', 'AMORTIGUADOR', 'CADENA', 
  'CORONA', 'PIÑON', 'GUANTE', 'CAMPERA', 'KIT', 'FRENO', 'DISCO', 'LLANTA',
  'RETEN', 'JUNTA', 'BOMBA', 'CARBURADOR', 'CDI', 'REGULADOR', 'ESTATOR',
  'BOBINA', 'RELE', 'DESTELLADOR', 'LAMPARA', 'LED', 'GIRO', 'TABLERO',
  'TRIPA', 'PEDAL', 'PALANCA', 'PUÑO', 'ASIENTO', 'FUNDA', 'PORTAEQUIPAJE',
  'BAUL', 'PARABRISAS', 'DEFENSA', 'ALARMA', 'LINGA', 'CANDADO', 'SOPORTE',
  'RODAMIENTO', 'RULEMAN', 'BUJE', 'EJE', 'RAYO', 'CAMARA', 'LUBRICANTE', 
  'GRASA', 'LIQUIDO', 'REFRIGERANTE', 'LIMPIADOR', 'DESENGRASANTE'
];

const KNOWN_BRANDS = [
  'HONDA', 'YAMAHA', 'SUZUKI', 'KAWASAKI', 'MOTOMEL', 'ZANELLA', 'CORVEN', 
  'BAJAJ', 'GILERA', 'KTM', 'FOX', 'LS2', 'CASTROL', 'MOTUL', 'IPONE', 
  'PIRELLI', 'MICHELIN', 'METZELER', 'NGK', 'YUASA', 'BOSCH', 'W-STANDARD', 'FAR',
  'GUERRERO', 'MONDIAL', 'KEEWAY', 'BENELLI', 'VOGE', 'ROYAL ENFIELD', 'HUSQVARNA',
  'HERO', 'TVS', 'SYM', 'KYMCO', 'MAC', 'HAWK', 'NZI', 'SHIRO', 'MT',
  'AGV', 'SHARK', 'SHOEI', 'ARAI', 'BELL', 'HJC', 'NOLAN', 'KYT', 'SMK', 'ZEUS', 
  'PRO TORK', 'GIVI', 'KAPPA', 'SHAD', 'ALPINESTARS', 'DAINESE', 'REVIT'
];

const getProductCategory = (title: string) => {
  const upperTitle = title.toUpperCase();
  for (const cat of KNOWN_CATEGORIES) {
    if (upperTitle.includes(cat)) return cat;
  }
  return 'OTROS';
};

const getProductBrand = (title: string) => {
  const upperTitle = title.toUpperCase();
  for (const brand of KNOWN_BRANDS) {
    if (upperTitle.includes(brand)) return brand;
  }
  return 'OTRAS MARCAS';
};

const getRelatedProducts = (product: any, allProducts: any[]) => {
  if (!product) return [];
  const cat = getProductCategory(product.title);
  const brand = getProductBrand(product.title);
  
  let relatedCats: string[] = [];
  if (cat === 'CUBIERTA' || cat === 'NEUMATICO') relatedCats = ['CAMARA', 'LUBRICANTE', 'PARCHE'];
  else if (cat === 'CADENA' || cat === 'TRANSMISION' || cat === 'CORONA' || cat === 'PIÑON') relatedCats = ['LUBRICANTE', 'GRASA', 'ACEITE'];
  else if (cat === 'CASCO') relatedCats = ['GUANTE', 'CAMPERA', 'LINGA'];
  else if (cat === 'ACEITE') relatedCats = ['FILTRO', 'LUBRICANTE'];
  else if (cat === 'BATERIA') relatedCats = ['BUJIA', 'LAMPARA'];
  else if (cat === 'PASTILLA' || cat === 'FRENO' || cat === 'DISCO') relatedCats = ['LIQUIDO'];
  else relatedCats = [cat]; // Same category fallback

  let related = allProducts.filter(p => {
    if (p.sku === product.sku) return false;
    const pCat = getProductCategory(p.title);
    return relatedCats.includes(pCat);
  });

  // If not enough, add same brand
  if (related.length < 4) {
    const sameBrand = allProducts.filter(p => 
      p.sku !== product.sku && 
      getProductBrand(p.title) === brand && 
      !related.find(r => r.sku === p.sku)
    );
    related = [...related, ...sameBrand];
  }

  // If still not enough, add random products
  if (related.length < 4) {
    const random = allProducts.filter(p => 
      p.sku !== product.sku && 
      !related.find(r => r.sku === p.sku)
    );
    related = [...related, ...random];
  }

  // Shuffle and take 4
  return related.sort(() => 0.5 - Math.random()).slice(0, 4);
};

export default function Catalog({ 
  products, 
  setProducts, 
  cart, 
  setCart, 
  getStockNumber, 
  progress, 
  loading, 
  error 
}: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [selectedBrand, setSelectedBrand] = useState('TODAS');
  const [sortBy, setSortBy] = useState('relevant'); // relevant, price-asc, price-desc, name-asc, name-desc
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedBrand, sortBy]);

  const parsePrice = (priceStr: string) => {
    const cleaned = priceStr.replace(/[^0-9,-]+/g, "").replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  const { availableCategories, availableBrands, filteredProducts } = useMemo(() => {
    // Extract categories and brands from current products
    const cats = new Set<string>();
    const brnds = new Set<string>();
    
    products.forEach((p: any) => {
      cats.add(getProductCategory(p.title));
      brnds.add(getProductBrand(p.title));
    });

    let filtered = products.filter((p: any) => {
      const matchesCategory = selectedCategory === 'TODAS' || getProductCategory(p.title) === selectedCategory;
      const matchesBrand = selectedBrand === 'TODAS' || getProductBrand(p.title) === selectedBrand;
      return matchesCategory && matchesBrand;
    });

    if (searchTerm.trim() !== '') {
      const fuse = new Fuse(filtered, {
        keys: ['title', 'sku'],
        threshold: 0.4, // 0.0 is exact match, 1.0 is match anything
        ignoreLocation: true,
      });
      filtered = fuse.search(searchTerm).map(result => result.item);
    }

    // Sort
    if (sortBy === 'price-asc') {
      filtered.sort((a: any, b: any) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sortBy === 'price-desc') {
      filtered.sort((a: any, b: any) => parsePrice(b.price) - parsePrice(a.price));
    } else if (sortBy === 'name-asc') {
      filtered.sort((a: any, b: any) => a.title.localeCompare(b.title));
    } else if (sortBy === 'name-desc') {
      filtered.sort((a: any, b: any) => b.title.localeCompare(a.title));
    }

    return {
      availableCategories: Array.from(cats).sort(),
      availableBrands: Array.from(brnds).sort(),
      filteredProducts: filtered
    };
  }, [products, searchTerm, selectedCategory, selectedBrand, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const addToCart = (product: any) => {
    const stockAvailable = getStockNumber(product.stock);
    if (stockAvailable <= 0) {
      toast.error('Este producto está agotado');
      return;
    }

    setCart((prev: any) => {
      const existing = prev.find((item: any) => item.product.sku === product.sku);
      if (existing) {
        if (existing.quantity >= stockAvailable) {
          toast.error(`Solo hay ${stockAvailable} unidades disponibles`);
          return prev;
        }
        toast.success('Agregaste otra unidad al carrito');
        return prev.map((item: any) => 
          item.product.sku === product.sku 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      toast.success('Producto agregado al carrito');
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (sku: string) => {
    setCart((prev: any) => prev.filter((item: any) => item.product.sku !== sku));
    toast.info('Producto eliminado del carrito');
  };

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

  const cartTotal = cart.reduce((sum: number, item: any) => sum + parsePrice(item.product.price) * item.quantity, 0);
  const cartCount = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans pb-12 pt-20">
      {/* Header */}
      <header className="bg-[#111] shadow-sm sticky top-20 z-10 border-b border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#FF4500] text-white p-2 rounded-lg skew-x-[-12deg]">
              <Package size={24} className="unskew-x-12" />
            </div>
            <h1 className="text-xl font-display font-black italic tracking-tight text-white uppercase">Inventario Oficial</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:flex items-center gap-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF4500] transition-colors z-10" size={18} />
                <div className="absolute inset-0 bg-[#111] skew-x-[-12deg] border border-[#333] group-focus-within:border-[#FF4500] group-focus-within:neon-shadow transition-all"></div>
                <input
                  type="text"
                  placeholder="Buscar repuestos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="relative pl-10 pr-4 py-2 bg-transparent text-sm focus:outline-none text-white w-64 transition-all z-10"
                />
              </div>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`p-2 border border-[#333] rounded-lg transition-colors flex items-center justify-center ${isFilterOpen ? 'bg-[#FF4500]/10 text-[#FF4500] border-[#FF4500]/30' : 'bg-[#111] text-gray-400 hover:bg-[#222]'}`}
                title="Filtros y Orden"
              >
                <Filter size={20} />
              </button>
            </div>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-400 hover:bg-[#222] rounded-full transition-colors"
            >
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-[#FF4500] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#111]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        {/* Mobile Search */}
        <div className="sm:hidden px-4 pb-4 flex gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF4500] transition-colors z-10" size={18} />
            <div className="absolute inset-0 bg-[#111] skew-x-[-12deg] border border-[#333] group-focus-within:border-[#FF4500] group-focus-within:neon-shadow transition-all"></div>
            <input
              type="text"
              placeholder="Buscar repuestos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="relative pl-10 pr-4 py-2 bg-transparent text-sm focus:outline-none text-white w-full z-10"
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-2 border border-[#333] rounded-lg transition-colors flex items-center justify-center ${isFilterOpen ? 'bg-[#FF4500]/10 text-[#FF4500] border-[#FF4500]/30' : 'bg-[#111] text-gray-400 hover:bg-[#222]'}`}
          >
            <Filter size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filters and Sorting Bar */}
        <div className={`mb-8 bg-[#111] p-4 rounded-xl border border-[#333] shadow-sm ${isFilterOpen ? 'block' : 'hidden'}`}>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/3">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Categoría</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-[#333] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF4500] focus:border-transparent bg-[#0A0A0A] text-white"
              >
                <option value="TODAS">Todas las categorías</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-1/3">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Marca</label>
              <select 
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full border border-[#333] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF4500] focus:border-transparent bg-[#0A0A0A] text-white"
              >
                <option value="TODAS">Todas las marcas</option>
                {availableBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-1/3">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <ArrowUpDown size={14} /> Ordenar por
              </label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-[#333] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF4500] focus:border-transparent bg-[#0A0A0A] text-white"
              >
                <option value="relevant">Relevancia</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
                <option value="name-asc">Nombre (A-Z)</option>
                <option value="name-desc">Nombre (Z-A)</option>
              </select>
            </div>
          </div>
          
          {(selectedCategory !== 'TODAS' || selectedBrand !== 'TODAS' || sortBy !== 'relevant' || searchTerm !== '') && (
            <div className="mt-4 pt-4 border-t border-[#333] flex justify-end">
              <button 
                onClick={() => {
                  setSelectedCategory('TODAS');
                  setSelectedBrand('TODAS');
                  setSortBy('relevant');
                  setSearchTerm('');
                }}
                className="text-sm text-gray-400 hover:text-[#FF4500] font-medium transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Sync Status Banner */}
        {progress.status === 'syncing' && (
          <div className="mb-6 bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 flex items-center gap-3 text-blue-400 shadow-sm">
            <RefreshCw className="animate-spin" size={20} />
            <div className="flex-1">
              <p className="font-medium text-sm">Actualizando catálogo en segundo plano...</p>
              <div className="w-full bg-[#111] rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${Math.min(100, (progress.current_page / Math.max(1, progress.total_products / 15)) * 100)}%` }}
                ></div>
              </div>
            </div>
            <span className="text-xs font-bold bg-blue-900/40 px-2 py-1 rounded-full">
              {progress.total_products} items
            </span>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#FF4500] mb-4" size={48} />
            <p className="text-gray-400 font-medium">Cargando catálogo de FoxMoto...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800/50 rounded-2xl p-8 text-center max-w-lg mx-auto mt-10 shadow-sm">
            <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
            <h3 className="text-lg font-bold text-red-400 mb-2">Error al cargar productos</h3>
            <p className="text-red-300 text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-900/40 text-red-400 rounded-lg hover:bg-red-800/50 font-medium transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-lg font-medium text-white">No se encontraron productos</h3>
            <p className="text-gray-400 mt-1">Intenta con otra búsqueda.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentProducts.map((product: any) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  key={product.sku}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-[#111] rounded-2xl shadow-sm border border-[#333] overflow-hidden hover:border-[#FF4500]/50 hover:neon-shadow transition-all group flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-square bg-[#0A0A0A] p-4 flex items-center justify-center overflow-hidden">
                    {product.img && !product.img.includes('no-product-image') ? (
                      <img 
                        src={product.img} 
                        alt={product.title} 
                        loading="lazy"
                        className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-gray-600 flex flex-col items-center">
                        <Package size={48} />
                        <span className="text-xs mt-2 font-medium">Sin imagen</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-[#111]/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-mono font-bold text-gray-400 border border-[#333]">
                      SKU: {product.sku}
                    </div>
                  </div>
                  
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-medium text-white text-sm line-clamp-2 mb-2 flex-1" title={product.title}>
                      {product.title}
                    </h3>
                    
                    <div className="flex items-end justify-between mt-auto pt-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Precio</p>
                        <p className="text-lg font-bold text-white">{product.price}</p>
                      </div>
                      {getStockNumber(product.stock) > 0 ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="bg-gradient-to-r from-[#FF4500] to-[#D20000] hover:scale-105 text-white p-2 rounded-lg transition-transform shadow-sm flex items-center gap-2"
                        >
                          <ShoppingCart size={18} />
                          <span className="sr-only sm:not-sr-only sm:text-sm font-medium pr-1">Agregar</span>
                        </button>
                      ) : (
                        <div className="bg-[#222] text-gray-400 px-3 py-2 rounded-lg text-sm font-medium">
                          Agotado
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-[#333] flex items-center justify-between text-xs">
                      <span className={`${getStockNumber(product.stock) > 0 ? 'text-green-500' : 'text-red-500'} font-medium flex items-center gap-1`}>
                        <span className={`w-2 h-2 rounded-full ${getStockNumber(product.stock) > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {getStockNumber(product.stock) === Infinity ? 'Stock Ilimitado' : product.stock}
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
                  className="p-2 rounded-lg border border-[#333] bg-[#111] text-gray-400 hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="text-sm font-medium text-gray-400">
                  Página <span className="text-[#FF4500] font-bold">{currentPage}</span> de {totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-[#333] bg-[#111] text-gray-400 hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-96 bg-[#111] shadow-2xl z-50 flex flex-col border-l border-[#333]"
            >
              <div className="p-4 border-b border-[#333] flex items-center justify-between bg-[#111]">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-[#FF4500]" size={24} />
                  <h2 className="text-lg font-bold text-white">Tu Pedido</h2>
                  <span className="bg-[#222] text-gray-400 text-xs font-bold px-2 py-1 rounded-full">
                    {cartCount} items
                  </span>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[#222] rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-[#0A0A0A]">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                    <ShoppingCart size={64} className="opacity-20" />
                    <p className="text-sm font-medium">Tu carrito está vacío</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="text-[#FF4500] text-sm font-bold hover:underline"
                    >
                      Seguir comprando
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-end mb-4">
                      <button 
                        onClick={() => {
                          setCart([]);
                          toast.success('Carrito vaciado');
                        }}
                        className="text-sm text-red-500 hover:text-red-400 font-medium flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={16} />
                        Vaciar carrito
                      </button>
                    </div>
                    <div className="space-y-4">
                      {cart.map((item: any) => (
                        <div key={item.product.sku} className="flex gap-4 bg-[#111] p-3 rounded-xl border border-[#333] shadow-sm">
                        <div className="w-16 h-16 bg-[#0A0A0A] rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
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
                            <div className="flex items-center gap-3 bg-[#0A0A0A] rounded-lg p-1 border border-[#333]">
                              <button 
                                onClick={() => updateQuantity(item.product.sku, -1)}
                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#222] rounded transition-all"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-sm font-bold w-4 text-center text-white">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.product.sku, 1)}
                                disabled={item.quantity >= getStockNumber(item.product.stock)}
                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#222] rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.product.sku)}
                              className="text-xs text-red-500 hover:text-red-400 font-medium"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  </>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t border-[#333] bg-[#111]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 font-medium">Total estimado</span>
                    <span className="text-2xl font-bold text-white">
                      {cartTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('/checkout');
                    }}
                    className="w-full bg-gradient-to-r from-[#FF4500] to-[#D20000] hover:scale-[1.02] text-white font-bold py-3 px-4 rounded-xl transition-transform shadow-sm flex items-center justify-center gap-2"
                  >
                    Completar mis datos
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product Overview Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-3xl bg-[#111] border border-[#333] rounded-2xl shadow-2xl z-[70] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-4 border-b border-[#333] bg-[#0A0A0A]">
                <h2 className="text-xl font-display font-bold italic text-white uppercase tracking-wider">Detalle del Producto</h2>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 text-gray-400 hover:text-[#FF4500] hover:bg-[#222] rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/2 bg-[#0A0A0A] rounded-xl p-6 flex items-center justify-center border border-[#222] relative group">
                  {selectedProduct.img && !selectedProduct.img.includes('no-product-image') ? (
                    <img 
                      src={selectedProduct.img} 
                      alt={selectedProduct.title} 
                      className="object-contain w-full h-64 md:h-80 group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-gray-600 flex flex-col items-center py-12">
                      <Package size={64} />
                      <span className="text-sm mt-4 font-medium">Sin imagen</span>
                    </div>
                  )}
                </div>
                
                <div className="w-full md:w-1/2 flex flex-col">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="bg-[#FF4500]/10 text-[#FF4500] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit border border-[#FF4500]/30">
                      {getProductCategory(selectedProduct.title)}
                    </div>
                    <div className="bg-[#222] text-gray-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit border border-[#333]">
                      {getProductBrand(selectedProduct.title)}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                    {selectedProduct.title}
                  </h3>
                  
                  <div className="text-sm font-mono text-gray-400 mb-8 bg-[#0A0A0A] px-3 py-2 rounded-lg border border-[#222] inline-block w-fit">
                    SKU: {selectedProduct.sku}
                  </div>
                  
                  <div className="mt-auto bg-[#0A0A0A] p-6 rounded-xl border border-[#222]">
                    <p className="text-sm text-gray-400 mb-1">Precio Final</p>
                    <p className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">{selectedProduct.price}</p>
                    
                    <div className="flex items-center justify-between mb-6">
                      <span className={`${getStockNumber(selectedProduct.stock) > 0 ? 'text-green-500' : 'text-red-500'} font-medium flex items-center gap-2`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${getStockNumber(selectedProduct.stock) > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {getStockNumber(selectedProduct.stock) === Infinity ? 'Stock Ilimitado' : `${selectedProduct.stock} disponibles`}
                      </span>
                    </div>
                    
                    {getStockNumber(selectedProduct.stock) > 0 ? (
                      <button 
                        onClick={() => {
                          addToCart(selectedProduct);
                          setSelectedProduct(null);
                        }}
                        className="w-full bg-gradient-to-r from-[#FF4500] to-[#D20000] hover:scale-[1.02] text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 neon-shadow"
                      >
                        <ShoppingCart size={20} />
                        Agregar al Carrito
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="w-full bg-[#222] text-gray-500 font-bold py-4 px-6 rounded-xl cursor-not-allowed flex items-center justify-center gap-3"
                      >
                        <AlertCircle size={20} />
                        Producto Agotado
                      </button>
                    )}
                  </div>
                  
                  {/* Related Products Section */}
                  {selectedProduct && getRelatedProducts(selectedProduct, products).length > 0 && (
                    <div className="mt-8 pt-6 border-t border-[#222]">
                      <h4 className="text-lg font-bold text-white mb-4">Quizás también te interese</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {getRelatedProducts(selectedProduct, products).map((rp: any) => (
                          <div 
                            key={rp.sku}
                            onClick={() => {
                              setSelectedProduct(rp);
                            }}
                            className="bg-[#0A0A0A] rounded-xl p-3 border border-[#222] shadow-sm hover:border-[#FF4500]/50 transition-colors cursor-pointer flex flex-col"
                          >
                            <div className="aspect-square bg-[#111] rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                              {rp.img && !rp.img.includes('no-product-image') ? (
                                <img src={rp.img} alt={rp.title} className="object-contain w-full h-full p-2" referrerPolicy="no-referrer" />
                              ) : (
                                <Package size={24} className="text-gray-600" />
                              )}
                            </div>
                            <p className="text-xs font-medium text-white line-clamp-2 mb-1 flex-1" title={rp.title}>{rp.title}</p>
                            <p className="text-sm font-bold text-[#FF4500] mt-auto">{rp.price}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
