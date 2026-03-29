import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { MapPin, Loader2 } from 'lucide-react';
import { useState } from 'react';

// Create a custom icon using Lucide React
const customIcon = new L.DivIcon({
  html: renderToString(<MapPin className="w-8 h-8 text-[#FF4500] fill-[#111]" />),
  className: 'bg-transparent border-none',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function Map() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Coordinates for Manzana de las luces 475, Bahía Blanca
  const position: [number, number] = [-38.6976991, -62.3063405]; 

  return (
    <div className="h-80 w-full rounded-2xl overflow-hidden border border-[#333] group hover:border-[#FF4500]/50 transition-colors duration-500 relative z-10 neon-shadow">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0A] z-20 loading">
          <Loader2 className="w-12 h-12 text-[#FF4500] animate-spin mb-4" />
          <div className="flex items-center gap-2">
            <span className="font-display font-bold italic text-lg tracking-wider text-white">CARGANDO MAPA</span>
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </span>
          </div>
        </div>
      )}
      <MapContainer 
        center={position} 
        zoom={17} 
        scrollWheelZoom={false} 
        className="h-full w-full z-0"
        style={{ background: '#0A0A0A' }}
        whenReady={() => {
          // Add a small delay to ensure tiles start loading before hiding the spinner
          setTimeout(() => setIsLoading(false), 800);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          eventHandlers={{
            load: () => setIsLoading(false)
          }}
        />
        <Marker position={position} icon={customIcon}>
          <Popup className="custom-popup">
            <div className="text-center p-1">
              <strong className="text-[#FF4500] font-display italic text-lg block mb-1">FoxMotoRepuestos</strong>
              <span className="text-gray-800 font-medium">Manzana de las luces 475<br/>Bahía Blanca</span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
