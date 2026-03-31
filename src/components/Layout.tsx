import { Outlet, Link } from 'react-router-dom';
import { MapPin, Phone, Instagram, Facebook } from 'lucide-react';
import Map from './Map';

export default function Layout() {
  const trackEvent = (eventName: string) => {
    try {
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', eventName);
      }
      if (typeof (window as any).fbq === 'function') {
        (window as any).fbq('trackCustom', eventName);
      }
    } catch (e) {
      console.error('Tracking error', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#FF4500] selection:text-white flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF4500] to-[#D20000] rounded-lg flex items-center justify-center skew-x-12 group-hover:neon-shadow transition-all">
              <span className="font-display font-black italic text-xl unskew-x-12">F</span>
            </div>
            <span className="font-display font-black italic text-2xl tracking-tighter group-hover:text-[#FF4500] transition-colors">
              FoxMoto<span className="text-[#FF4500] group-hover:text-white transition-colors">Repuestos</span>
            </span>
          </Link>
          <div className="hidden md:flex gap-8 font-bold tracking-wide text-sm">
            <Link to="/" className="hover:text-[#FF4500] transition-colors uppercase neon-text-shadow">Inicio</Link>
            <Link to="/catalogo" onClick={() => trackEvent('ViewCatalog')} className="hover:text-[#FF4500] transition-colors uppercase neon-text-shadow">Catálogo</Link>
            <a href="#contacto" className="hover:text-[#FF4500] transition-colors uppercase neon-text-shadow">Contacto</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer / Contact */}
      <footer id="contacto" className="bg-[#050505] border-t border-[#222] pt-20 pb-10 relative overflow-hidden mt-auto">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#D20000]/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#FF4500] to-[#D20000] rounded-lg flex items-center justify-center skew-x-12">
                  <span className="font-display font-black italic text-xl unskew-x-12">F</span>
                </div>
                <span className="font-display font-black italic text-3xl tracking-tighter">
                  FoxMoto<span className="text-[#FF4500]">Repuestos</span>
                </span>
              </div>
              <p className="text-gray-400 max-w-sm mb-8">
                Tu casa de repuestos de confianza. Amplia variedad en estándar y competición. Si no lo tenemos, ¡te lo conseguimos!
              </p>
              <div className="flex gap-4">
                <a href="https://instagram.com/foxmotorep" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#111] border border-[#333] flex items-center justify-center hover:bg-[#FF4500] hover:border-[#FF4500] hover:scale-110 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(255,69,0,0.8)] transition-all duration-300 group">
                  <Instagram className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors group-hover:animate-pulse" />
                </a>
                <a href="https://facebook.com/foxmotorep" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#111] border border-[#333] flex items-center justify-center hover:bg-[#FF4500] hover:border-[#FF4500] hover:scale-110 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(255,69,0,0.8)] transition-all duration-300 group">
                  <Facebook className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors group-hover:animate-pulse" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-display font-bold italic text-lg uppercase mb-6">Contacto</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-gray-400 hover:text-white transition-colors group">
                  <MapPin className="w-5 h-5 text-[#FF4500] shrink-0 mt-0.5 group-hover:scale-110 group-hover:neon-text-shadow transition-all" />
                  <span>Manzana de las luces 475, Bahía Blanca, Buenos Aires, Argentina</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                  <Phone className="w-5 h-5 text-[#FF4500] shrink-0 group-hover:scale-110 group-hover:neon-text-shadow transition-all" />
                  <span>+54 9 291 522-1351</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold italic text-lg uppercase mb-6">Enlaces Rápidos</h4>
              <ul className="space-y-3 font-medium">
                <li><Link to="/catalogo" onClick={() => trackEvent('ViewCatalog')} className="text-gray-400 hover:text-[#FF4500] transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] group-hover:scale-150 transition-transform"></span> Catálogo Completo</Link></li>
                <li><Link to="/envios-devoluciones" className="text-gray-400 hover:text-[#FF4500] transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] group-hover:scale-150 transition-transform"></span> Envíos y Devoluciones</Link></li>
                <li><Link to="/faq" className="text-gray-400 hover:text-[#FF4500] transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] group-hover:scale-150 transition-transform"></span> Preguntas Frecuentes</Link></li>
              </ul>
            </div>

          </div>

          {/* Map Section */}
          <div className="mb-12">
            <h4 className="font-display font-bold italic text-lg uppercase mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#FF4500]" /> Encontranos
            </h4>
            <Map />
          </div>

          <div className="border-t border-[#222] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} FoxMotoRepuestos. Todos los derechos reservados.
            </p>
            <div className="flex gap-4 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Términos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a 
        href="https://wa.me/5492915221351" 
        target="_blank" 
        rel="noopener noreferrer"
        onClick={() => trackEvent('ClickWhatsApp')}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0.5)] hover:scale-110 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(37,211,102,0.8)] transition-all duration-300 group"
        aria-label="Contactar por WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="group-hover:animate-pulse"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </a>
    </div>
  );
}
