import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, MapPin, X, AlertTriangle, CheckCircle,
  Loader, Navigation, Star, Clock, Globe,
  ChevronRight, Shield, Flame, Truck,
  ExternalLink, Search, Wifi, WifiOff, RefreshCw,
  Building2, Siren, Heart
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';
import api from '../../services/api';
import toast from 'react-hot-toast';

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';

const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111827' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#374151' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c1220' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'poi.medical', elementType: 'labels.icon', stylers: [{ visibility: 'on' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
];

/* ─── Emergency Quick Actions ─── */
const EMERGENCY_CONTACTS = [
  { label: 'Police', number: '100', icon: Shield, color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
  { label: 'Ambulance', number: '108', icon: Truck, color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  { label: 'Fire', number: '101', icon: Flame, color: '#fb923c', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)' },
  { label: 'Helpline', number: '112', icon: Siren, color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)', border: 'rgba(45,212,191,0.25)' },
];

/* ─── Skeleton Loader ─── */
function SkeletonCard() {
  return (
    <div className="rounded-xl p-4 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="h-3.5 w-36 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="h-2.5 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div className="h-10 w-16 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-8 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="flex-1 h-8 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>
    </div>
  );
}

/* ─── Nearby Hospital Card ─── */
function HospitalCard({ hospital, index, userLocation }) {
  const directionsUrl = 'https://www.google.com/maps/dir/?api=1' +
    (userLocation ? '&origin=' + userLocation.lat + ',' + userLocation.lng : '') +
    '&destination=' + hospital.location.lat + ',' + hospital.location.lng +
    '&travelmode=driving';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="group"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px',
        padding: '14px',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-white font-semibold text-sm leading-snug truncate">{hospital.name}</h4>
            {hospital.emergency && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                ER
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={10} className="text-slate-500 shrink-0" />
            <span className="text-slate-500 text-xs truncate">{hospital.address}</span>
          </div>
        </div>

        {/* Distance Badge */}
        <div className="shrink-0 text-center rounded-lg px-2.5 py-1.5"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div className="text-red-400 font-bold text-xs">{hospital.distanceText}</div>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-2.5 flex-wrap">
        {hospital.isOpen !== null && (
          <div className={'flex items-center gap-1 text-[11px] font-medium ' +
            (hospital.isOpen ? 'text-emerald-400' : 'text-red-400')}>
            <Clock size={9} />
            {hospital.isOpen ? 'Open' : 'Closed'}
          </div>
        )}
        {hospital.phone && (
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Phone size={9} />
            <span>{hospital.phone}</span>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-1.5">
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
          <Navigation size={10} /> Directions
        </a>
        {hospital.phone ? (
          <a href={'tel:' + hospital.phone.replace(/\s/g, '')}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
            <Phone size={10} /> Call
          </a>
        ) : (
          <a href={hospital.googleMapsUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.15)', color: '#94a3b8' }}>
            <MapPin size={10} /> View
          </a>
        )}
        {hospital.website && (
          <a href={hospital.website} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa' }}>
            <Globe size={10} />
          </a>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Registered Hospital Card ─── */
function RegisteredHospitalCard({ hospital, alertSent, index }) {
  const hLat = hospital.location?.coordinates?.[1];
  const hLng = hospital.location?.coordinates?.[0];
  const directionsUrl = hLat && hLng
    ? 'https://www.google.com/maps/dir/?api=1&destination=' + hLat + ',' + hLng
    : 'https://www.google.com/maps/search/' + encodeURIComponent(hospital.name + ' ' + hospital.city);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="shrink-0 w-64"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px',
        padding: '14px',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Building2 size={12} className="text-violet-400 shrink-0" />
            <h4 className="text-white font-semibold text-xs truncate">{hospital.name}</h4>
          </div>
          <div className="text-slate-500 text-[10px] mt-0.5">{hospital.city}{hospital.state ? ', ' + hospital.state : ''}</div>
        </div>
        {alertSent && (
          <span className="shrink-0 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
            <CheckCircle size={9} /> Alerted
          </span>
        )}
      </div>

      {/* Resources */}
      {hospital.resources && (
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          {hospital.resources.availableBeds > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(45,212,191,0.1)', color: '#2dd4bf' }}>
              🛏 {hospital.resources.availableBeds} beds
            </span>
          )}
          {hospital.resources.availableIcuBeds > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>
              🧠 {hospital.resources.availableIcuBeds} ICU
            </span>
          )}
          {hospital.resources.availableAmbulances > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(251,146,60,0.1)', color: '#fb923c' }}>
              🚑 {hospital.resources.availableAmbulances}
            </span>
          )}
        </div>
      )}

      {hospital.distanceText && hospital.distanceText !== 'Unknown' && (
        <div className="text-slate-500 text-[10px] mb-2.5 flex items-center gap-1">
          <Navigation size={8} /> {hospital.distanceText} away
        </div>
      )}

      <div className="flex gap-1.5">
        {hospital.phone && (
          <a href={'tel:' + hospital.phone} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.15)', color: '#34d399' }}>
            <Phone size={9} /> Call
          </a>
        )}
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)', color: '#a78bfa' }}>
          <Navigation size={9} /> Directions
        </a>
      </div>
    </motion.div>
  );
}

/* ─── Emergency Map ─── */
function EmergencyMap({ userLocation, hospitals, registeredHospitals }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_KEY,
    libraries: ['places'],
  });

  const mapRef = useRef(null);

  const onLoad = useCallback(map => {
    mapRef.current = map;
    if (hospitals.length > 0 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(userLocation);
      hospitals.forEach(h => {
        if (h.location?.lat) bounds.extend({ lat: h.location.lat, lng: h.location.lng });
      });
      map.fitBounds(bounds, 60);
    }
  }, [hospitals, userLocation]);

  if (!GOOGLE_KEY || !isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-center px-4">
          <MapPin size={28} className="text-red-400/60 mx-auto mb-2" />
          <div className="text-slate-400 text-xs">
            {!GOOGLE_KEY ? 'Map requires Google Maps API key' : 'Loading map...'}
          </div>
          {userLocation && (
            <div className="text-slate-600 text-[10px] mt-2">
              📍 {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Combine all hospital locations for markers
  const allMarkers = [
    ...hospitals.map(h => ({ lat: h.location.lat, lng: h.location.lng, type: 'nearby' })),
    ...(registeredHospitals || [])
      .filter(h => h.location?.coordinates?.[1] && h.location?.coordinates?.[0])
      .map(h => ({ lat: h.location.coordinates[1], lng: h.location.coordinates[0], type: 'registered' })),
  ];

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={userLocation}
        zoom={13}
        onLoad={onLoad}
        options={{
          styles: darkMapStyles,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }}
      >
        {/* User location — pulsing red */}
        <Marker
          position={userLocation}
          icon={{
            path: window.google?.maps?.SymbolPath?.CIRCLE,
            scale: 10,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          }}
        />

        {/* 7km radius circle */}
        <Circle
          center={userLocation}
          radius={7000}
          options={{
            fillColor: '#ef4444',
            fillOpacity: 0.04,
            strokeColor: '#ef4444',
            strokeOpacity: 0.25,
            strokeWeight: 1.5,
            strokeDashArray: '4 4',
          }}
        />

        {/* Hospital markers */}
        {allMarkers.map((m, i) => (
          <Marker
            key={i}
            position={{ lat: m.lat, lng: m.lng }}
            icon={{
              path: window.google?.maps?.SymbolPath?.CIRCLE,
              scale: 7,
              fillColor: m.type === 'registered' ? '#a78bfa' : '#f87171',
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
}

/* ─── Main SOS Modal Content ─── */
function SOSModal({ onClose }) {
  const [stage, setStage] = useState('locating'); // locating | fetching | ready | error
  const [userLocation, setUserLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [registeredHospitals, setRegisteredHospitals] = useState([]);
  const [nearbyError, setNearbyError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [sosSent, setSosSent] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [loadingRegistered, setLoadingRegistered] = useState(true);

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    setStage('locating');
    setLocationError('');
    setNearbyError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported.');
      setStage('error');
      fetchRegisteredHospitals(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        fetchNearbyHospitals(loc);
        fetchRegisteredHospitals(loc);
      },
      (err) => {
        let msg = 'Location access denied. ';
        if (err.code === 1) msg += 'Please allow location in browser settings.';
        else if (err.code === 2) msg += 'Position unavailable.';
        else if (err.code === 3) msg += 'Location timed out.';
        setLocationError(msg);
        setStage('error');
        fetchRegisteredHospitals(null);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const fetchNearbyHospitals = async (loc) => {
    setStage('fetching');
    setNearbyError('');
    try {
      const { data } = await api.get('/sos/nearby-hospitals', {
        params: { lat: loc.lat, lng: loc.lng, radius: 7000 },
      });
      setHospitals(data.hospitals || []);
      setStage('ready');
    } catch (err) {
      console.error('Nearby hospitals error:', err);
      setNearbyError('Could not fetch nearby hospitals. Showing registered hospitals instead.');
      setStage('ready'); // Don't block — still show registered hospitals
    }
  };

  const fetchRegisteredHospitals = async (loc) => {
    setLoadingRegistered(true);
    try {
      const params = loc ? { lat: loc.lat, lng: loc.lng } : {};
      const { data } = await api.get('/sos/registered-hospitals', { params });
      setRegisteredHospitals(data.hospitals || []);
    } catch (err) {
      console.error('Registered hospitals error:', err);
    } finally {
      setLoadingRegistered(false);
    }
  };

  const handleSendSOS = async () => {
    if (!userLocation || sosSent) return;
    setSendingAlert(true);
    try {
      await api.post('/sos/send', {
        lat: userLocation.lat,
        lng: userLocation.lng,
        address: 'Live GPS location',
        message: 'Emergency! Need immediate medical assistance.',
      });
      setSosSent(true);
      toast.success('🚨 SOS Alert sent to all hospitals!');
    } catch {
      toast.error('SOS alert failed. Call 108 directly.');
    } finally {
      setSendingAlert(false);
    }
  };

  const retryNearby = () => {
    if (userLocation) {
      fetchNearbyHospitals(userLocation);
    } else {
      detectLocation();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'linear-gradient(145deg, #0a0c14 0%, #0f1118 40%, #12141d 100%)' }}
    >
      {/* Subtle emergency glow — NOT heavy red */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(ellipse, rgba(239,68,68,0.15) 0%, transparent 70%)' }}
        />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }}
        />
      </div>

      {/* ── HEADER ── */}
      <div className="relative flex items-center justify-between px-5 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <AlertTriangle size={18} className="text-red-400" />
          </motion.div>
          <div>
            <h1 className="text-white font-black text-base tracking-wide" style={{ fontFamily: 'Sora, sans-serif' }}>
              EMERGENCY SOS
            </h1>
            <div className="flex items-center gap-1.5">
              <motion.div
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-red-500"
              />
              <span className="text-slate-500 text-[11px]">
                {stage === 'locating' && 'Detecting location...'}
                {stage === 'fetching' && 'Finding nearby hospitals...'}
                {stage === 'ready' && (hospitals.length > 0 ? hospitals.length + ' nearby · ' : '') + registeredHospitals.length + ' registered'}
                {stage === 'error' && 'Location error — manual contacts available'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onClose}
          className="p-2 rounded-xl transition-all hover:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <X size={16} className="text-slate-400" />
        </button>
      </div>

      {/* ── Emergency Quick Contacts — always visible ── */}
      <div className="relative px-5 py-2.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="grid grid-cols-4 gap-2">
          {EMERGENCY_CONTACTS.map((c, i) => (
            <a key={i} href={'tel:' + c.number}
              className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-center transition-all hover:scale-[1.03]"
              style={{ background: c.bg, border: '1px solid ' + c.border }}>
              <c.icon size={15} style={{ color: c.color }} />
              <div className="text-left">
                <div className="font-bold text-xs" style={{ color: c.color }}>{c.number}</div>
                <div className="text-slate-500 text-[10px]">{c.label}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="relative flex-1 overflow-hidden flex flex-col">

        {/* Loading: Locating */}
        {stage === 'locating' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.3)' }}>
                <MapPin size={28} className="text-red-400" />
              </motion.div>
              <h3 className="text-white font-bold text-lg mb-1">Detecting Location</h3>
              <p className="text-slate-500 text-sm max-w-xs">Allow location access to find nearest hospitals.</p>
            </div>
          </div>
        )}

        {/* Loading: Fetching hospitals */}
        {stage === 'fetching' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-14 h-14 rounded-full mx-auto mb-4"
                style={{ border: '2px solid rgba(239,68,68,0.2)', borderTopColor: '#ef4444' }}
              />
              <h3 className="text-white font-bold text-lg mb-1">Finding Hospitals</h3>
              <p className="text-slate-500 text-sm">Searching within 7 km radius...</p>
            </div>
          </div>
        )}

        {/* Location Error */}
        {stage === 'error' && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div className="rounded-2xl p-5 text-center"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
              <WifiOff size={24} className="text-red-400/70 mx-auto mb-2" />
              <h3 className="text-white font-semibold text-sm mb-1">Location Error</h3>
              <p className="text-slate-400 text-xs mb-3">{locationError}</p>
              <button onClick={detectLocation}
                className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 mx-auto transition-all"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <RefreshCw size={12} /> Retry Location
              </button>
            </div>

            {/* Still show registered hospitals even on error */}
            {registeredHospitals.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 size={14} className="text-violet-400" />
                  <h3 className="text-white font-semibold text-sm">UnityCure Hospitals</h3>
                  <span className="text-slate-600 text-xs">({registeredHospitals.length})</span>
                </div>
                <div className="space-y-2">
                  {registeredHospitals.map((h, i) => (
                    <RegisteredHospitalCard key={h.id} hospital={h} alertSent={false} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── READY STATE — Two Column Layout ── */}
        {stage === 'ready' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Two-column grid: Left=hospitals, Right=map */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-5">

              {/* LEFT PANEL — scrollable */}
              <div className="lg:col-span-2 overflow-y-auto px-5 py-4 space-y-4" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>

                {/* SOS Alert Button */}
                {userLocation && (
                  !sosSent ? (
                    <motion.button
                      onClick={handleSendSOS}
                      disabled={sendingAlert}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3.5 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2.5 disabled:opacity-70 transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                        boxShadow: '0 0 30px rgba(220,38,38,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                      }}
                    >
                      {sendingAlert ? (
                        <>
                          <Loader size={18} className="animate-spin" />
                          Sending Alert...
                        </>
                      ) : (
                        <>
                          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                            <Siren size={18} />
                          </motion.div>
                          SEND SOS TO ALL HOSPITALS
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <div className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2.5"
                      style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
                      <CheckCircle size={18} className="text-white" />
                      <span className="text-white font-black text-sm">SOS Alert Sent!</span>
                    </div>
                  )
                )}

                {/* Location info */}
                {userLocation && (
                  <div className="flex items-center justify-between text-[10px] text-slate-600 px-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      GPS: {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                    </div>
                    <button onClick={retryNearby} className="text-red-400/70 hover:text-red-400 flex items-center gap-1 transition-colors">
                      <RefreshCw size={9} /> Refresh
                    </button>
                  </div>
                )}

                {/* Nearby error banner */}
                {nearbyError && (
                  <div className="rounded-xl p-3 flex items-start gap-2"
                    style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.12)' }}>
                    <AlertTriangle size={14} className="text-amber-400/70 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-300/70 text-xs">{nearbyError}</p>
                      <button onClick={retryNearby} className="text-amber-400 text-[11px] font-semibold mt-1 hover:underline flex items-center gap-1">
                        <RefreshCw size={10} /> Retry
                      </button>
                    </div>
                  </div>
                )}

                {/* Nearby Hospitals */}
                {hospitals.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin size={12} className="text-red-400" />
                        Nearby ({hospitals.length})
                      </h3>
                      <span className="text-slate-600 text-[10px]">Within 7 km</span>
                    </div>
                    {hospitals.map((hospital, i) => (
                      <HospitalCard
                        key={hospital.placeId || i}
                        hospital={hospital}
                        index={i}
                        userLocation={userLocation}
                      />
                    ))}
                  </div>
                ) : !nearbyError && stage === 'ready' ? (
                  <div className="rounded-xl p-4 text-center"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <MapPin size={18} className="text-slate-600 mx-auto mb-1.5" />
                    <div className="text-slate-500 text-xs">No nearby hospitals found in 7 km</div>
                    <div className="text-slate-600 text-[10px] mt-0.5">Use emergency contacts above</div>
                  </div>
                ) : null}
              </div>

              {/* RIGHT PANEL — Map */}
              <div className="lg:col-span-3 hidden lg:block p-4">
                {userLocation ? (
                  <EmergencyMap
                    userLocation={userLocation}
                    hospitals={hospitals}
                    registeredHospitals={registeredHospitals}
                  />
                ) : (
                  <div className="w-full h-full rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-center">
                      <MapPin size={28} className="text-slate-600 mx-auto mb-2" />
                      <div className="text-slate-500 text-sm">Waiting for location...</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── BOTTOM — Registered Hospitals ── */}
            <div className="shrink-0 px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Heart size={13} className="text-violet-400" />
                  <h3 className="text-white font-bold text-xs uppercase tracking-wider">
                    UnityCure Network
                  </h3>
                  {registeredHospitals.length > 0 && (
                    <span className="text-slate-600 text-[10px]">({registeredHospitals.length})</span>
                  )}
                </div>
                {sosSent && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold"
                    style={{ color: '#34d399' }}>
                    <CheckCircle size={10} /> All hospitals alerted
                  </span>
                )}
              </div>

              {loadingRegistered ? (
                <div className="flex gap-3 overflow-hidden">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="shrink-0 w-64 h-28 rounded-xl animate-pulse"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }} />
                  ))}
                </div>
              ) : registeredHospitals.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
                  {registeredHospitals.map((h, i) => (
                    <RegisteredHospitalCard
                      key={h.id}
                      hospital={h}
                      alertSent={sosSent}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <div className="text-slate-600 text-xs">No registered hospitals found yet.</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main Export — Trigger buttons unchanged ─── */
export default function SOSButton({ variant = 'floating' }) {
  const [open, setOpen] = useState(false);

  // Inline variant (landing page)
  if (variant === 'inline') {
    return (
      <>
        <motion.button
          onClick={() => setOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="sos-btn px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-lg transition-all flex items-center gap-2"
        >
          <Phone size={20} className="animate-pulse" /> SOS Emergency
        </motion.button>

        <AnimatePresence>
          {open && <SOSModal onClose={() => setOpen(false)} />}
        </AnimatePresence>
      </>
    );
  }

  // Floating variant (dashboards)
  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-24 left-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-600 text-white font-bold shadow-2xl"
        style={{ animation: 'sos-pulse 1.8s infinite' }}
      >
        <Phone size={18} />
        SOS
      </motion.button>

      <AnimatePresence>
        {open && <SOSModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}