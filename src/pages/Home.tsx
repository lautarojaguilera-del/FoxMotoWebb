import { motion } from 'motion/react';
import { ChevronRight, Wrench, Zap, Truck, Star, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export default function Home({ products = [] }: { products?: any[] }) {
  const bestSellers = [...products]
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    .slice(0, 4);

  const newArrivals = [...products]
    .sort((a, b) => {
      const dateA = a.last_updated?.toDate?.()?.getTime() || 0;
      const dateB = b.last_updated?.toDate?.()?.getTime() || 0;
      return dateB - dateA;
    })
    .slice(0, 4);

  return (
    <div className="bg-[#0A0A0A]">
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-screen flex flex-col justify-center">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-carbon opacity-40"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FF4500]/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-display font-black italic text-5xl sm:text-7xl lg:text-8xl leading-[0.85] tracking-tighter mb-6 uppercase">
                El repuesto <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4500] to-[#D20000]">
                  exacto
                </span> <br />
                para tu moto
              </h1>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-400 mb-10 max-w-xl font-medium"
            >
              Repuestos estándar y de competición en Bahía Blanca. En solo 8 meses crecimos para ofrecerte la mayor variedad. Y si no lo tenemos, ¡te lo traemos!
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link 
                to="/catalogo"
                className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white uppercase tracking-widest bg-gradient-to-r from-[#FF4500] to-[#D20000] skew-x-12 overflow-hidden neon-shadow transition-all"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <span className="unskew-x-12 flex items-center gap-2 relative z-10">
                  Ver Catálogo
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </motion.div>
          </div>

          {/* Features Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24"
          >
            {[
              { icon: Zap, title: "Estándar y Competición", desc: "Amplia variedad para el uso diario o para la pista." },
              { icon: Truck, title: "Si no está, lo traemos", desc: "Conseguimos lo que tu moto necesita en tiempo récord." },
              { icon: Wrench, title: "Crecimiento Acelerado", desc: "Hace 8 meses abrimos y ya somos tu parada obligada." }
            ].map((feature, idx) => (
              <div key={idx} className="bg-[#111] border border-[#333] p-6 skew-x-12 hover:border-[#FF4500]/50 transition-colors group hover:-translate-y-2 duration-300">
                <div className="unskew-x-12">
                  <feature.icon className="w-8 h-8 text-[#FF4500] mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-display font-bold italic text-xl mb-2 uppercase">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#333] to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Best Sellers */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-[#FF4500]/10 p-2 rounded-lg">
                    <Star className="w-6 h-6 text-[#FF4500]" />
                  </div>
                  <h2 className="text-2xl font-display font-black italic uppercase tracking-tight">Los más vendidos</h2>
                </div>
                <Link to="/catalogo" className="text-sm text-gray-400 hover:text-[#FF4500] flex items-center gap-1 transition-colors group">
                  Ver todos <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bestSellers.map((product, idx) => (
                  <ProductCard key={product.sku} product={product} delay={idx * 0.1} />
                ))}
              </div>
            </div>

            {/* New Arrivals */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-display font-black italic uppercase tracking-tight">Nuevos ingresos</h2>
                </div>
                <Link to="/catalogo" className="text-sm text-gray-400 hover:text-blue-500 flex items-center gap-1 transition-colors group">
                  Ver todos <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {newArrivals.map((product, idx) => (
                  <ProductCard key={product.sku} product={product} delay={idx * 0.1} isNew />
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}

function ProductCard({ product, delay, isNew }: { product: any, delay: number, isNew?: boolean, key?: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <Link 
        to={`/catalogo/${slugify(product.title)}`}
        className="group block bg-[#111] border border-[#333] rounded-xl overflow-hidden hover:border-[#FF4500]/50 transition-all hover:-translate-y-1"
      >
        <div className="aspect-square relative bg-[#0A0A0A] p-4 flex items-center justify-center">
          {product.img ? (
            <img 
              src={product.img} 
              alt={product.title} 
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-gray-600">Sin imagen</div>
          )}
          {isNew && (
            <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-sm italic uppercase tracking-tighter">
              Nuevo
            </div>
          )}
          {!isNew && (product.salesCount || 0) > 0 && (
            <div className="absolute top-2 left-2 bg-[#FF4500] text-white text-[10px] font-black px-2 py-0.5 rounded-sm italic uppercase tracking-tighter">
              Top
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-sm font-bold text-white line-clamp-1 mb-1 group-hover:text-[#FF4500] transition-colors">
            {product.title}
          </h3>
          <p className="text-lg font-black text-white">{product.price}</p>
        </div>
      </Link>
    </motion.div>
  );
}
