import { motion } from 'motion/react';
import { ChevronRight, Wrench, Zap, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
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
              onClick={() => {
                try {
                  if (typeof (window as any).gtag === 'function') (window as any).gtag('event', 'ViewCatalog');
                  if (typeof (window as any).fbq === 'function') (window as any).fbq('trackCustom', 'ViewCatalog');
                } catch (e) {}
              }}
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
          animate={{ opacity: 1, y: 0 }}
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
  );
}
