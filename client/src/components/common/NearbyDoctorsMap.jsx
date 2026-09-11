import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../services/api';

// Fix Leaflet marker icons for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Haversine formula to compute distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

export default function NearbyDoctorsMap({ setActive }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const radiusCircleRef = useRef(null);

  const [userLocation, setUserLocation] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState(5000); // 5km default
  const [customRadiusInput, setCustomRadiusInput] = useState('');
  const [limitCount, setLimitCount] = useState(10); // Default top 10
  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter and sort to get nearest N facilities
  const displayedDoctors = useMemo(() => {
    const sorted = [...allDoctors].sort((a, b) => a.distance - b.distance);
    if (limitCount === 0) return sorted;
    return sorted.slice(0, limitCount);
  }, [allDoctors, limitCount]);

  // Sync Leaflet markers with displayed doctors
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear old pins
    markersRef.current.forEach((m) => m.marker.remove());
    markersRef.current = [];

    // Render pins for displayed items
    displayedDoctors.forEach((doc) => {
      if (doc.lat && doc.lon) {
        const marker = L.marker([doc.lat, doc.lon]).addTo(mapInstanceRef.current);
        
        // Navigation URL
        const gmapsUrl = userLocation
          ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${doc.lat},${doc.lon}`
          : `https://www.google.com/maps/search/?api=1&query=${doc.lat},${doc.lon}`;

        marker.bindPopup(`
          <div style="font-size: 13px; color: #1e293b; min-width: 190px; padding: 2px;">
            <strong style="font-size: 14px; color: #0f172a;">${doc.name}</strong><br/>
            <span style="color: #0d9488; font-weight: 600; font-size: 12px;">${doc.specialty}</span><br/>
            <span style="color: #64748b; font-size: 11px;">📍 ${doc.address}</span><br/>
            <span style="color: #0284c7; font-weight: 600; font-size: 12px;">🚗 ${doc.distance} km away</span><br/>
            ${doc.phone && doc.phone !== 'N/A' ? `<span style="color: #475569; font-size: 11px;">📞 ${doc.phone}</span><br/>` : ''}
            
            <div style="display: flex; gap: 6px; margin-top: 8px;">
              <a 
                href="${gmapsUrl}" 
                target="_blank" 
                rel="noreferrer" 
                style="flex: 1; text-align: center; background: #0284c7; color: #fff; padding: 5px 8px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: 600;"
              >
                Directions ↗
              </a>
            </div>
          </div>
        `);
        markersRef.current.push({ id: doc.id, marker });
      }
    });
  }, [displayedDoctors, userLocation]);

  // Geolocation setup
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        initMap(coords);
        fetchDoctors(coords[0], coords[1], selectedRadius);
      },
      () => {
        const defaultCoords = [22.5726, 88.3639]; // Kolkata fallback
        setUserLocation(defaultCoords);
        initMap(defaultCoords);
        fetchDoctors(defaultCoords[0], defaultCoords[1], selectedRadius);
      }
    );

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const initMap = (center) => {
    if (mapInstanceRef.current || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current).setView(center, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    L.circleMarker(center, {
      radius: 9,
      fillColor: '#00d4aa',
      color: '#ffffff',
      weight: 3,
      fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup('<b>You are here</b>');

    radiusCircleRef.current = L.circle(center, {
      radius: selectedRadius,
      color: '#00d4aa',
      fillColor: '#00d4aa',
      fillOpacity: 0.07,
      weight: 1.5,
      dashArray: '5, 8',
    }).addTo(map);

    mapInstanceRef.current = map;
  };

  const fetchDoctors = async (lat, lon, radius) => {
    try {
      setLoading(true);

      if (radiusCircleRef.current) {
        radiusCircleRef.current.setRadius(radius);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.fitBounds(radiusCircleRef.current.getBounds(), {
            padding: [25, 25],
          });
        }
      }

      const res = await api.get(`/user/nearby-doctors?lat=${lat}&lon=${lon}&radius=${radius}`);
      const rawList = res.data.doctors || [];

      const formatted = rawList.map((doc) => ({
        ...doc,
        distance: calculateDistance(lat, lon, doc.lat, doc.lon),
      }));

      setAllDoctors(formatted);
    } catch (err) {
      console.error('Error fetching nearby doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRadiusChange = (newRadius) => {
    setSelectedRadius(newRadius);
    setCustomRadiusInput('');
    if (userLocation) {
      fetchDoctors(userLocation[0], userLocation[1], newRadius);
    }
  };

  const handleCustomRadiusSubmit = (e) => {
    e.preventDefault();
    const parsedKm = parseFloat(customRadiusInput);
    if (!parsedKm || parsedKm <= 0 || parsedKm > 100) {
      alert('Please enter a valid radius between 1 and 100 km.');
      return;
    }
    const inMeters = parsedKm * 1000;
    setSelectedRadius(inMeters);
    if (userLocation) {
      fetchDoctors(userLocation[0], userLocation[1], inMeters);
    }
  };

  const focusDoctor = (doc) => {
    if (!mapInstanceRef.current || !doc.lat || !doc.lon) return;
    mapInstanceRef.current.flyTo([doc.lat, doc.lon], 16);
    const target = markersRef.current.find((m) => m.id === doc.id);
    if (target) target.marker.openPopup();
  };

  const handleBookAppointment = (e, doc) => {
    e.stopPropagation();
    // Save selected provider to session so Appointment form can pre-fill
    sessionStorage.setItem('selectedDoctor', JSON.stringify(doc));
    if (setActive) {
      setActive('appointments');
    } else {
      alert(`Booking appointment with ${doc.name}`);
    }
  };

  return (
    <div className="flex flex-col h-[700px] w-full border border-white/10 rounded-2xl overflow-hidden bg-slate-900 shadow-xl text-white">
      {/* Control Bar: Radius + Nearest Limit */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-950/90 border-b border-white/10">
        {/* Radius Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Radius:</span>
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            {[
              { label: '2 km', value: 2000 },
              { label: '5 km', value: 5000 },
              { label: '10 km', value: 10000 },
            ].map((r) => (
              <button
                key={r.value}
                onClick={() => handleRadiusChange(r.value)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  selectedRadius === r.value && !customRadiusInput
                    ? 'bg-teal-500 text-slate-950 shadow-sm shadow-teal-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleCustomRadiusSubmit} className="flex items-center gap-1.5 ml-1">
            <div className="relative">
              <input
                type="number"
                min="1"
                max="100"
                step="0.5"
                placeholder="Custom"
                value={customRadiusInput}
                onChange={(e) => setCustomRadiusInput(e.target.value)}
                className="w-20 px-2 py-1 text-xs bg-slate-900 border border-white/10 rounded-lg text-white placeholder-slate-500 outline-none focus:border-teal-400"
              />
              <span className="absolute right-2 top-1 text-[10px] text-slate-500 pointer-events-none">km</span>
            </div>
            <button
              type="submit"
              className="px-2.5 py-1 text-xs font-medium bg-teal-500/20 text-teal-300 hover:bg-teal-500 hover:text-slate-950 rounded-lg border border-teal-500/30 transition"
            >
              Apply
            </button>
          </form>
        </div>

        {/* Nearest Count Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Show Nearest:</span>
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            {[
              { label: 'Top 5', value: 5 },
              { label: 'Top 10', value: 10 },
              { label: 'Top 20', value: 20 },
              { label: 'All', value: 0 },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLimitCount(opt.value)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  limitCount === opt.value
                    ? 'bg-violet-500 text-white shadow-sm shadow-violet-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left List */}
        <div className="w-full md:w-96 border-r border-white/10 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-900/60">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-white text-sm tracking-wide">
              {limitCount > 0 ? `Nearest ${displayedDoctors.length} Facilities` : 'All Facilities Found'}
            </h3>
            <span className="text-[11px] text-slate-400">
              within {selectedRadius / 1000} km
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-sm gap-2">
              <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
              <span>Scanning facilities...</span>
            </div>
          ) : displayedDoctors.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-sm text-slate-400">No medical centers found within {selectedRadius / 1000} km.</p>
              <button
                onClick={() => handleRadiusChange(10000)}
                className="mt-3 text-xs text-teal-400 hover:underline cursor-pointer"
              >
                Expand radius to 10 km
              </button>
            </div>
          ) : (
            displayedDoctors.map((doc, idx) => {
              const gmapsUrl = userLocation
                ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${doc.lat},${doc.lon}`
                : `https://www.google.com/maps/search/?api=1&query=${doc.lat},${doc.lon}`;

              return (
                <div
                  key={doc.id || idx}
                  onClick={() => focusDoctor(doc)}
                  className="p-3.5 border border-white/10 rounded-xl hover:border-teal-500/50 hover:bg-white/[0.04] cursor-pointer transition text-left group flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-sm font-semibold text-white group-hover:text-teal-300 leading-tight">
                        {idx + 1}. {doc.name}
                      </h4>
                      <span className="text-[11px] font-bold bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full whitespace-nowrap border border-teal-500/20">
                        {doc.distance} km
                      </span>
                    </div>
                    <p className="text-xs text-teal-400/90 font-medium mt-1">{doc.specialty}</p>
                    <p className="text-xs text-slate-400 mt-1 truncate">{doc.address}</p>
                    {doc.phone && doc.phone !== 'N/A' && (
                      <p className="text-xs text-slate-500 mt-0.5">📞 {doc.phone}</p>
                    )}
                  </div>

                  {/* Direct Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <a
                      href={gmapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 text-center py-1.5 px-3 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-semibold transition"
                    >
                      Directions ↗
                    </a>
                    <button
                      onClick={(e) => handleBookAppointment(e, doc)}
                      className="flex-1 py-1.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-lg text-xs transition shadow-sm"
                    >
                      Book Appt
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Leaflet Map */}
        <div ref={mapContainerRef} className="flex-1 h-full z-0 min-h-[350px]" />
      </div>
    </div>
  );
}