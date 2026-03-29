import { motion } from 'motion/react';
import { Truck, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function ShippingReturns() {
  return (
    <div className="pt-32 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="font-display font-black italic text-4xl sm:text-5xl uppercase mb-4">
          Envíos y <span className="text-[#FF4500]">Devoluciones</span>
        </h1>
        <p className="text-gray-400">Todo lo que necesitas saber sobre nuestras políticas de entrega y cambios.</p>
      </motion.div>

      <div className="space-y-12">
        {/* Envíos */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111] border border-[#333] p-8 rounded-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF4500] to-[#D20000]"></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[#FF4500]/10 rounded-full flex items-center justify-center">
              <Truck className="w-6 h-6 text-[#FF4500]" />
            </div>
            <h2 className="font-display font-bold italic text-2xl uppercase">Política de Envíos</h2>
          </div>
          <div className="space-y-4 text-gray-300">
            <p>
              En Fox Motorepuestos aceleramos a fondo para que tu pedido llegue lo antes posible. Realizamos envíos a todo el país desde nuestra sucursal en <strong>Bahía Blanca</strong>.
            </p>
            <div className="bg-[#FF4500]/10 border border-[#FF4500]/30 p-4 rounded-lg flex items-start gap-3">
              <ZapIcon className="w-6 h-6 text-[#FF4500] shrink-0" />
              <p className="font-bold text-white">
                ¡ENVÍO GRATIS a partir de $50.000!
              </p>
            </div>
            <p className="text-sm text-gray-400">
              * El envío gratuito aplica para compras que superen los $50.000 ARS. Para compras inferiores, el costo del envío se calculará al momento del checkout dependiendo de tu ubicación.
            </p>
          </div>
        </motion.section>

        {/* Devoluciones */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111] border border-[#333] p-8 rounded-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D20000] to-[#FF4500]"></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[#D20000]/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[#D20000]" />
            </div>
            <h2 className="font-display font-bold italic text-2xl uppercase">Cambios y Devoluciones</h2>
          </div>
          <div className="space-y-4 text-gray-300">
            <p>
              Queremos que estés 100% conforme con tu compra. Si necesitas realizar un cambio o devolución, tenés un plazo máximo de <strong>48 horas</strong> desde el momento en que recibís el producto.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-400">
              <li>El producto debe estar en su empaque original, sin uso y en perfectas condiciones.</li>
              <li>Los costos de envío por devoluciones (salvo error nuestro) corren por cuenta del comprador.</li>
            </ul>
            
            <div className="mt-6 bg-red-950/30 border border-red-900/50 p-4 rounded-lg flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <h3 className="font-bold text-red-400 mb-1">ATENCIÓN: Productos Eléctricos y Electrónicos</h3>
                <p className="text-sm text-red-200/80">
                  Los productos electrónicos y eléctricos <strong>NO TIENEN CAMBIO NI DEVOLUCIÓN</strong> bajo ninguna circunstancia. Todos estos componentes son testeados rigurosamente de fábrica antes de ser despachados para garantizar su correcto funcionamiento.
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function ZapIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}
