import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import {
  ArrowRight, Search, Filter, Brain, MapPin, Clock,
  Truck, AlertTriangle, Plus, X, CheckCircle, RefreshCw,
  Stethoscope, BedDouble, Ambulance, Phone, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import HospitalCompareCard from '../../../components/transfer/HospitalCompareCard';
import TransferTimeline from '../../../components/transfer/TransferTimeline';
import AmbulanceTracker from '../../../components/transfer/AmbulanceTracker';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const priorityConfig = {
  low:      { color: 'text-blue-400',   bg: 'bg-blue-500/10',   label: 'Low',      border: 'border-blue-500/30' },
  medium:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Medium',   border: 'border-yellow-500/30' },
  high:     { color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'High',     border: 'border-orange-500/30' },
  critical: { color: 'text-red-400',    bg: 'bg-red-500/10',    label: 'Critical', border: 'border-red-500/30' },
};

const statusConfig = {
  pending:      { color: 'text-yellow-400', label: 'Pending Review' },
  approved:     { color: 'text-teal-400',   label: 'Approved' },
  rejected:     { color: 'text-red-400',    label: 'Rejected' },
  'in-transit': { color: 'text-violet-400', label: 'In Transit' },
  completed:    { color: 'text-emerald-400',label: 'Completed' },
  cancelled:    { color: 'text-slate-400',  label: 'Cancelled' },
};

export default function SmartTransfer() {
  const { user } = useAuth();
  const [tab, setTab] = useState('find'); // find | my-transfers
  const [recommendations, setRecommendations] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [loadingRec, setLoadingRec] = useState(false);
  const [myTransfers, setMyTransfers] = useState([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [expandedTransfer, setExpandedTransfer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const socketRef = useRef(null);

  const [form, setForm] = useState({
    patientName: user?.name || '',
    patientAge: '',
    patientPhone: user?.phone || '',
    bloodGroup: 'O+',
    medicalCondition: '',
    medicalSummary: '',
    priority: 'medium',
    requiresICU: false,
    requiresAmbulance: true,
    specialistNeeded: '',
  });

  const [filters, setFilters] = useState({
    sortBy: 'score', // score | distance | beds | icu
    requiresICU: false,
    requiresAmbulance: false,
  });

  useEffect(() => {
    fetchRecommendations();
    fetchMyTransfers();
    setupSocket();
    getLocation();

    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  };

  const setupSocket = () => {
    socketRef.current = io(SOCKET_URL);
    socketRef.current.on('transfer-approved', (data) => {
      toast.success('Transfer approved! ' + data.hospitalName + ' will send an ambulance.');
      fetchMyTransfers();
    });
    socketRef.current.on('transfer-rejected', (data) => {
      toast.error('Transfer request was rejected: ' + (data.reason || 'No reason given'));
      fetchMyTransfers();
    });
    socketRef.current.on('transfer-status-update', () => fetchMyTransfers());
  };

  const fetchRecommendations = async (condition) => {
    setLoadingRec(true);
    try {
      const params = new URLSearchParams();
      if (condition) params.append('condition', condition);
      if (userLocation) {
        params.append('lat', userLocation.lat);
        params.append('lng', userLocation.lng);
      }
      if (filters.requiresICU) params.append('requiresICU', 'true');

      const { data } = await api.get('/transfer/recommendations?' + params.toString());
      let recs = data.recommendations || [];

      // Apply filter sorting
      if (filters.sortBy === 'distance') recs = recs.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
      else if (filters.sortBy === 'beds') recs = recs.sort((a, b) => b.hospital.resources.availableBeds - a.hospital.resources.availableBeds);
      else if (filters.sortBy === 'icu') recs = recs.sort((a, b) => b.hospital.resources.availableIcuBeds - a.hospital.resources.availableIcuBeds);

      if (filters.requiresICU) recs = recs.filter(r => r.hospital.resources.availableIcuBeds > 0);
      if (filters.requiresAmbulance) recs = recs.filter(r => r.hospital.resources.availableAmbulances > 0);

      setRecommendations(recs);
      setAiSummary(data.aiSummary || '');
    } catch {
      toast.error('Failed to load recommendations');
    } finally {
      setLoadingRec(false);
    }
  };

  const fetchMyTransfers = async () => {
    setLoadingTransfers(true);
    try {
      const { data } = await api.get('/transfer/user');
      setMyTransfers(data.transfers || []);
    } catch {} finally {
      setLoadingTransfers(false);
    }
  };

  const handleSubmitTransfer = async () => {
    if (!selectedHospital) { toast.error('Please select a hospital first'); return; }
    if (!form.patientName || !form.medicalCondition) {
      toast.error('Please fill patient name and medical condition');
      return;
    }

    try {
      await api.post('/transfer/create', {
        ...form,
        toHospitalId: selectedHospital.hospital.id,
      });
      toast.success('Transfer request sent to ' + selectedHospital.hospital.name);
      setShowForm(false);
      setSelectedHospital(null);
      setTab('my-transfers');
      fetchMyTransfers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send transfer request');
    }
  };

  const activeTransfer = myTransfers.find(t => t.status === 'in-transit');

  return (
    <div className="space-y-5">
      {/* Active Transfer Alert */}
      {activeTransfer && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-violet-500/10 border border-violet-500/30 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-violet-400 font-semibold text-sm">Active Transfer in Progress</span>
            <span className="text-slate-400 text-xs">— {activeTransfer.patientName}</span>
          </div>
          <AmbulanceTracker transfer={activeTransfer} socket={socketRef.current} />
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'find', label: '🔍 Find Hospital' },
          { id: 'my-transfers', label: '📋 My Transfers (' + myTransfers.length + ')' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={'px-4 py-2 rounded-xl text-sm transition-all ' +
              (tab === t.id
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
              )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'find' ? (
          <motion.div
            key="find"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-5"
          >
            {/* Search + Filter bar */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  placeholder="Search by condition (e.g. cardiac, trauma, stroke)..."
                  onKeyDown={e => e.key === 'Enter' && fetchRecommendations(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                />
              </div>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all ' +
                  (filterOpen ? 'bg-teal-500/20 text-teal-400 border-teal-500/30' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white')}
              >
                <Filter size={15} /> Filters
              </button>
              <button
                onClick={() => fetchRecommendations()}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
              >
                <RefreshCw size={15} />
              </button>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass rounded-2xl p-4 overflow-hidden"
                >
                  <div className="flex flex-wrap gap-4 items-center">
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block">Sort By</label>
                      <div className="flex gap-2">
                        {[
                          { value: 'score', label: 'Best Match' },
                          { value: 'distance', label: 'Nearest' },
                          { value: 'beds', label: 'Most Beds' },
                          { value: 'icu', label: 'ICU First' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setFilters(f => ({ ...f, sortBy: opt.value }))}
                            className={'px-3 py-1.5 rounded-xl text-xs transition-all ' +
                              (filters.sortBy === opt.value
                                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                                : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                              )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.requiresICU}
                          onChange={e => setFilters(f => ({ ...f, requiresICU: e.target.checked }))}
                          className="accent-teal-500"
                        />
                        <span className="text-sm text-slate-300">ICU Required</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.requiresAmbulance}
                          onChange={e => setFilters(f => ({ ...f, requiresAmbulance: e.target.checked }))}
                          className="accent-teal-500"
                        />
                        <span className="text-sm text-slate-300">Ambulance Available</span>
                      </label>
                    </div>
                    <button
                      onClick={() => { fetchRecommendations(); setFilterOpen(false); }}
                      className="px-4 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 text-sm hover:bg-teal-500/25 transition-all"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Summary */}
            {aiSummary && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-4 border border-violet-500/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={15} className="text-violet-400" />
                  <span className="text-violet-400 text-xs font-semibold uppercase tracking-wider">AI Recommendation</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{aiSummary}</p>
              </motion.div>
            )}

            {/* Hospital Cards */}
            {loadingRec ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="glass rounded-2xl h-64 animate-pulse" />
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <BedDouble size={32} className="text-slate-600 mx-auto mb-3" />
                <div className="text-slate-400 font-medium">No hospitals with available resources</div>
                <div className="text-slate-600 text-sm mt-1">
                  Hospitals appear here after they register and update their resources on MedMatrix
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((rec, i) => (
                  <HospitalCompareCard
                    key={rec.hospital.id || i}
                    rec={rec}
                    index={i}
                    onSelect={setSelectedHospital}
                    selected={selectedHospital?.hospital?.id === rec.hospital.id}
                  />
                ))}
              </div>
            )}

            {/* Request Transfer Button */}
            {selectedHospital && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4 border border-teal-500/30 flex items-center justify-between"
              >
                <div>
                  <div className="text-white font-semibold">Selected: {selectedHospital.hospital.name}</div>
                  <div className="text-slate-400 text-sm">ETA: {selectedHospital.estimatedArrival} • Score: {selectedHospital.score}/100</div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedHospital(null)}
                    className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 text-slate-900 font-bold text-sm hover:bg-teal-400 transition-all"
                  >
                    <Truck size={15} /> Request Transfer
                  </button>
                </div>
              </motion.div>
            )}

            {/* Transfer Form Modal */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                  onClick={e => e.target === e.currentTarget && setShowForm(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-white font-bold text-lg">Request Transfer</h2>
                          <p className="text-slate-400 text-sm">To {selectedHospital?.hospital?.name}</p>
                        </div>
                        <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-white/5 text-slate-400">
                          <X size={18} />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-400 mb-1.5 block">Patient Name *</label>
                            <input
                              value={form.patientName}
                              onChange={e => setForm({ ...form, patientName: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                              placeholder="Full name"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1.5 block">Age</label>
                            <input
                              type="number"
                              value={form.patientAge}
                              onChange={e => setForm({ ...form, patientAge: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                              placeholder="Age"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-400 mb-1.5 block">Phone</label>
                            <input
                              value={form.patientPhone}
                              onChange={e => setForm({ ...form, patientPhone: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                              placeholder="Contact number"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1.5 block">Blood Group</label>
                            <select
                              value={form.bloodGroup}
                              onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50"
                            >
                              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                <option key={bg} value={bg} className="bg-slate-900">{bg}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-slate-400 mb-1.5 block">Medical Condition *</label>
                          <input
                            value={form.medicalCondition}
                            onChange={e => setForm({ ...form, medicalCondition: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                            placeholder="e.g. Cardiac arrest, stroke, trauma"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-400 mb-1.5 block">Medical Summary</label>
                          <textarea
                            value={form.medicalSummary}
                            onChange={e => setForm({ ...form, medicalSummary: e.target.value })}
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 resize-none"
                            placeholder="Brief medical history, current medications, vitals..."
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-400 mb-1.5 block">Priority Level</label>
                          <div className="flex gap-2">
                            {['low', 'medium', 'high', 'critical'].map(p => {
                              const cfg = priorityConfig[p];
                              return (
                                <button
                                  key={p}
                                  onClick={() => setForm({ ...form, priority: p })}
                                  className={'flex-1 py-2 rounded-xl text-xs capitalize border transition-all ' +
                                    (form.priority === p ? cfg.bg + ' ' + cfg.color + ' ' + cfg.border : 'bg-white/5 border-white/10 text-slate-500 hover:text-white')}
                                >
                                  {cfg.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.requiresICU}
                              onChange={e => setForm({ ...form, requiresICU: e.target.checked })}
                              className="accent-teal-500"
                            />
                            <span className="text-sm text-slate-300">Requires ICU</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.requiresAmbulance}
                              onChange={e => setForm({ ...form, requiresAmbulance: e.target.checked })}
                              className="accent-teal-500"
                            />
                            <span className="text-sm text-slate-300">Requires Ambulance</span>
                          </label>
                        </div>

                        <div>
                          <label className="text-xs text-slate-400 mb-1.5 block">Specialist Needed (optional)</label>
                          <input
                            value={form.specialistNeeded}
                            onChange={e => setForm({ ...form, specialistNeeded: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                            placeholder="e.g. Cardiologist, Neurologist"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => setShowForm(false)}
                          className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSubmitTransfer}
                          className="flex-1 py-2.5 rounded-xl bg-teal-500 text-slate-900 font-bold text-sm hover:bg-teal-400 transition-all flex items-center justify-center gap-2"
                        >
                          <Truck size={15} /> Send Transfer Request
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* My Transfers Tab */
          <motion.div
            key="my-transfers"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            {loadingTransfers ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="glass rounded-2xl h-32 animate-pulse" />)}
              </div>
            ) : myTransfers.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Truck size={28} className="text-slate-600 mx-auto mb-3" />
                <div className="text-slate-400 font-medium">No transfer requests yet</div>
                <div className="text-slate-600 text-sm mt-1">Use "Find Hospital" to request a transfer</div>
                <button
                  onClick={() => setTab('find')}
                  className="mt-4 px-5 py-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 text-sm hover:bg-teal-500/25 transition-all"
                >
                  Find Hospital
                </button>
              </div>
            ) : myTransfers.map((transfer, i) => {
              const pCfg = priorityConfig[transfer.priority] || priorityConfig.medium;
              const sCfg = statusConfig[transfer.status] || statusConfig.pending;
              const isExpanded = expandedTransfer === transfer._id;

              return (
                <motion.div
                  key={transfer._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass rounded-2xl overflow-hidden"
                >
                  {/* Card Header */}
                  <div
                    className="p-5 cursor-pointer"
                    onClick={() => setExpandedTransfer(isExpanded ? null : transfer._id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold">{transfer.patientName}</span>
                          <span className={'text-xs px-2 py-0.5 rounded-full border ' + pCfg.bg + ' ' + pCfg.color + ' ' + pCfg.border}>
                            {pCfg.label}
                          </span>
                          <span className={'text-xs font-semibold ' + sCfg.color}>
                            {sCfg.label}
                          </span>
                        </div>
                        <div className="text-slate-400 text-sm mt-1">{transfer.medicalCondition}</div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span>To: {transfer.toHospital.name}</span>
                          <span>•</span>
                          <span>{new Date(transfer.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {transfer.status === 'in-transit' && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                            <span className="text-xs text-violet-400">Live</span>
                          </div>
                        )}
                        {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 overflow-hidden"
                      >
                        <div className="p-5 space-y-4">
                          {/* Ambulance Tracker */}
                          {transfer.status === 'in-transit' && (
                            <AmbulanceTracker transfer={transfer} socket={socketRef.current} />
                          )}

                          {/* Rejection reason */}
                          {transfer.status === 'rejected' && transfer.rejectionReason && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                              <div className="text-red-400 text-xs font-semibold mb-1">Rejection Reason</div>
                              <div className="text-slate-300 text-sm">{transfer.rejectionReason}</div>
                              <button
                                onClick={() => { setTab('find'); setShowForm(false); }}
                                className="mt-2 text-xs text-teal-400 hover:underline"
                              >
                                Find another hospital →
                              </button>
                            </div>
                          )}

                          {/* Hospital Notes */}
                          {transfer.hospitalNotes && (
                            <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-3">
                              <div className="text-teal-400 text-xs font-semibold mb-1">Hospital Notes</div>
                              <div className="text-slate-300 text-sm">{transfer.hospitalNotes}</div>
                            </div>
                          )}

                          {/* Timeline */}
                          <div>
                            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Transfer Timeline</div>
                            <TransferTimeline timeline={transfer.timeline} currentStatus={transfer.status} />
                          </div>

                          {/* Contact */}
                          <div className="flex gap-3">
                            <a
                              href={'tel:' + transfer.toHospital.phone}
                              className="flex-1 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs text-center flex items-center justify-center gap-1.5 hover:bg-teal-500/20 transition-all"
                            >
                              <Phone size={12} /> Call Hospital
                            </a>
                            {transfer.ambulance?.phone && (
                              <a
                                href={'tel:' + transfer.ambulance.phone}
                                className="flex-1 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs text-center flex items-center justify-center gap-1.5 hover:bg-orange-500/20 transition-all"
                              >
                                <Truck size={12} /> Call Ambulance
                              </a>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}