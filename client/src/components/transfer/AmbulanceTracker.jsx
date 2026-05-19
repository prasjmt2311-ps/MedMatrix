import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, Clock, Phone, Navigation } from 'lucide-react';

export default function AmbulanceTracker({ transfer, socket }) {
  const [location, setLocation] = useState({
    lat: transfer?.ambulance?.currentLat || 0,
    lng: transfer?.ambulance?.currentLng || 0,
    eta: transfer?.ambulance?.eta || '',
  });
  const [progress, setProgress] = useState(30);

  useEffect(() => {
    if (!socket) return;
    socket.on('ambulance-location', (data) => {
      if (data.transferId === transfer?._id?.toString()) {
        setLocation({ lat: data.lat, lng: data.lng, eta: data.eta });
      }
    });
    return () => socket.off('ambulance-location');
  }, [socket, transfer]);

  // Simulate progress for demo
  useEffect(() => {
    if (transfer?.status !== 'in-transit') return;
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 2, 95));
    }, 3000);
    return () => clearInterval(interval);
  }, [transfer]);

  if (!transfer?.ambulance?.isAssigned) return null;

  const amb = transfer.ambulance;

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
          <Truck size={18} className="text-orange-400" />
        </div>
        <div>
          <div className="text-white font-semibold text-sm">Ambulance Dispatched</div>
          <div className="text-slate-400 text-xs">{amb.vehicleNumber} • {amb.driverName}</div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-xs text-orange-400">Live</span>
        </div>
      </div>

      {/* Map placeholder */}
      <div className="relative bg-slate-900/80 rounded-xl overflow-hidden" style={{ height: '160px' }}>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,212,170,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,0.5) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Animated ambulance dot */}
        <motion.div
          animate={{
            left: ['20%', '45%', '65%'],
            top: ['60%', '40%', '35%'],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute w-8 h-8 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center shadow-lg"
          style={{ position: 'absolute' }}
        >
          <Truck size={14} className="text-white" />
        </motion.div>

        {/* Destination pin */}
        <div className="absolute right-8 top-8">
          <div className="w-8 h-8 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center shadow-lg">
            <MapPin size={14} className="text-white" />
          </div>
          <div className="text-xs text-teal-400 mt-1 text-center">Dest.</div>
        </div>

        {/* Route line */}
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          <path d="M 80 100 Q 180 60 240 55" stroke="rgba(251,146,60,0.4)" strokeWidth="2" fill="none" strokeDasharray="5,5" />
        </svg>

        <div className="absolute bottom-2 left-2 text-xs text-slate-500">
          {location.lat !== 0 ? 'GPS Active' : 'Map preview'}
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-slate-400">Transfer Progress</span>
          <span className="text-xs text-orange-400 font-semibold">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: progress + '%' }}
            transition={{ duration: 0.5 }}
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-slate-600">
          <span>Dispatched</span>
          <span>In Transit</span>
          <span>Arrived</span>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/3 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Clock size={11} /> ETA
          </div>
          <div className="text-white font-bold text-sm">{amb.eta || location.eta || '~25 min'}</div>
        </div>
        <div className="bg-white/3 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Phone size={11} /> Driver
          </div>
          <a href={'tel:' + amb.phone} className="text-teal-400 font-bold text-sm hover:underline">
            {amb.phone || 'N/A'}
          </a>
        </div>
      </div>

      {/* Open in Maps */}
      {location.lat !== 0 && (
        <button
          onClick={() => window.open('https://www.google.com/maps/dir/?api=1&destination=' + location.lat + ',' + location.lng, '_blank')}
          className="w-full py-2.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 text-sm flex items-center justify-center gap-2 hover:bg-orange-500/25 transition-all"
        >
          <Navigation size={14} /> Open Live Map
        </button>
      )}
    </div>
  );
}