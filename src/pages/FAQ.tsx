import { motion } from 'motion/react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: "¿Tienen local a la calle?",
    answer: "¡Sí! Estamos ubicados en Manzana de las luces 475, Bahía Blanca, Buenos Aires. Vení a visitarnos, conocer nuestro stock y recibir asesoramiento personalizado de nuestro equipo."
  },
  {
    question: "¿Qué tipo de repuestos trabajan?",
    answer: "Trabajamos una amplísima variedad de repuestos. Desde componentes estándar para el mantenimiento diario de tu moto, hasta piezas de competición (high-performance) para sacarle el máximo rendimiento. Y recordá: si no lo tenemos en stock, ¡te lo traemos!"
  },
  {
    question: "¿Hacen envíos a todo el país?",
    answer: "Sí, realizamos envíos a toda Argentina. Además, si tu compra supera los $50.000, ¡el envío es totalmente GRATIS!"
  },
  {
    question: "¿Cuáles son los métodos de pago?",
    answer: "Aceptamos múltiples formas de pago: efectivo en nuestro local, transferencias bancarias, tarjetas de débito y crédito. Consultá por promociones vigentes al momento de tu compra."
  },
  {
    question: "¿Puedo devolver un producto eléctrico?",
    answer: "No. Como indicamos en nuestras políticas, los productos eléctricos y electrónicos no tienen cambio ni devolución, ya que son testeados de fábrica para asegurar su funcionamiento antes de la venta."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="pt-32 pb-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="w-16 h-16 bg-[#FF4500]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <HelpCircle className="w-8 h-8 text-[#FF4500]" />
        </div>
        <h1 className="font-display font-black italic text-4xl sm:text-5xl uppercase mb-4">
          Preguntas <span className="text-[#FF4500]">Frecuentes</span>
        </h1>
        <p className="text-gray-400">Resolvemos tus dudas a la velocidad de la pista.</p>
      </motion.div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[#111] border border-[#333] rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
            >
              <span className="font-bold text-lg pr-8">{faq.question}</span>
              <ChevronDown 
                className={`w-5 h-5 text-[#FF4500] shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} 
              />
            </button>
            
            <div 
              className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <p className="text-gray-400 border-t border-[#333] pt-4">
                {faq.answer}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
