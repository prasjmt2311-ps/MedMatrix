import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Search, BedDouble, Ambulance, Stethoscope, Brain, Upload, FileText, Locate, RefreshCw } from 'lucide-react';
import api from '../../../services/api';
import HospitalMap from '../../../components/common/HospitalMap';
import toast from 'react-hot-toast';

export default function ReportMap() {
  const [tab, setTab] = useState('map');
  const [hospitals, setHospitals] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [locating, setLocating] = useState(false);

  // Load hospitals on mount
  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async (lat, lng) => {
    setLoading(true);
    try {
      const params = lat && lng ? '?lat=' + lat + '&lng=' + lng : '';
      const { data } = await api.get('/user/nearby-hospitals' + params);
      setHospitals(data.hospitals || []);
    } catch {
      toast.error('Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  const handleLocate = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        fetchHospitals(latitude, longitude);
        toast.success('Location found!');
        setLocating(false);
      },
      () => {
        toast.error('Could not get your location. Allow location access.');
        setLocating(false);
      }
    );
  };

  const filtered = hospitals.filter(h =>
    h.name?.toLowerCase().includes(search.toLowerCase()) ||
    h.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-2">
        {['map', 'reports'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={'px-4 py-2 rounded-xl text-sm transition-all ' +
              (tab === t
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
              )}
          >
            {t === 'map' ? '🗺 Nearby Hospitals' : '📄 My Reports'}
          </button>
        ))}
      </div>

      {tab === 'map' ? (
        <div className="space-y-4">
          {/* Search + Locate Row */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search hospitals by name or city..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
              />
            </div>
            <button
              onClick={handleLocate}
              disabled={locating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 text-sm font-medium hover:bg-teal-500/25 transition-all disabled:opacity-60"
            >
              {locating
                ? <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                : <Locate size={16} />
              }
              {locating ? 'Locating...' : 'My Location'}
            </button>
            <button
              onClick={() => fetchHospitals()}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Map */}
          <HospitalMap
            hospitals={filtered}
            userLocation={userLocation}
            height="380px"
          />

          {/* Hospital Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">
                {loading ? 'Loading...' : filtered.length + ' Hospitals Found'}
              </h3>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="glass rounded-2xl p-4 h-20 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center">
                <MapPin size={28} className="text-slate-600 mx-auto mb-2" />
                <div className="text-slate-400 text-sm">No hospitals found</div>
                <div className="text-slate-600 text-xs mt-1">
                  Hospitals appear here after they register on MedMatrix
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((h, i) => (
                  <motion.div
                    key={h.id || i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => setSelectedHospital(selectedHospital?.id === h.id ? null : h)}
                    className={'glass rounded-2xl p-4 cursor-pointer transition-all hover:border-white/15 ' +
                      (selectedHospital?.id === h.id ? 'border-teal-500/30' : '')
                    }
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-white font-semibold">{h.name}</div>
                        <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                          <MapPin size={11} /> {h.address}, {h.city}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const lat = h.location?.coordinates?.[1];
                          const lng = h.location?.coordinates?.[0];
                          if (lat && lng) {
                            window.open('https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng, '_blank');
                          } else {
                            window.open('https://www.google.com/maps/search/' + encodeURIComponent(h.name + ' ' + h.city), '_blank');
                          }
                        }}
                        className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 transition-all"
                      >
                        <Navigation size={14} />
                      </button>
                    </div>

                    {/* Resource badges */}
                    <div className="flex flex-wrap gap-2">
                      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400">
                        <BedDouble size={11} /> {h.resources?.availableBeds ?? 0} beds
                      </span>
                      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400">
                        <Brain size={11} /> {h.resources?.availableIcuBeds ?? 0} ICU
                      </span>
                      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400">
                        <Ambulance size={11} /> {h.resources?.availableAmbulances ?? 0} amb
                      </span>
                      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                        <Stethoscope size={11} /> {h.resources?.availableDoctors ?? 0} doctors
                      </span>
                    </div>

                    {/* Expanded detail */}
                    {selectedHospital?.id === h.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t border-white/5 flex gap-3"
                      >
                        <a
                          href={'tel:' + h.phone}
                          className="flex-1 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs text-center hover:bg-teal-500/20 transition-all"
                        >
                          📞 Call Hospital
                        </a>
                        <button
                          onClick={() => toast('Admission request — available after booking a consultation')}
                          className="flex-1 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs text-center hover:bg-violet-500/20 transition-all"
                        >
                          🏥 Request Admission
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Reports Tab */
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-teal-500/30 transition-all cursor-pointer"
            onClick={() => toast('File upload coming with full backend integration')}
          >
            <Upload size={28} className="text-teal-400 mx-auto mb-3" />
            <div className="text-white font-medium mb-1">Upload Medical Report</div>
            <div className="text-slate-500 text-sm">PDF, JPG, PNG up to 10MB</div>
            <button className="mt-4 px-5 py-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 text-sm">
              Browse Files
            </button>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Blood Test Report', date: 'Apr 28, 2026', type: 'Lab Report' },
              { name: 'ECG Report', date: 'Apr 15, 2026', type: 'Cardiac' },
              { name: 'X-Ray Chest', date: 'Mar 30, 2026', type: 'Radiology' },
            ].map((r, i) => (
              <div key={i} className="glass rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <FileText size={16} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{r.name}</div>
                    <div className="text-slate-500 text-xs">{r.type} • {r.date}</div>
                  </div>
                </div>
                <button className="text-xs text-teal-400 hover:underline">View</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}