import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import {
  CheckCircle, XCircle, Clock, ArrowRight, AlertTriangle,
  User, Truck, Brain, Phone, ChevronDown, ChevronUp,
  BedDouble, Stethoscope, Ambulance, RefreshCw, Send,
  Plus, Heart, Activity, Thermometer, Wind, Shield,
  MessageSquare, Search, Filter, Info
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import TransferTimeline from '../../../components/transfer/TransferTimeline';
import DigiLockerPanel from '../../../components/transfer/DigiLockerPanel';
import HospitalCompareCard from '../../../components/transfer/HospitalCompareCard';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const urgencyConfig = {
  critical: { color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',       label: 'Critical' },
  high:     { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', label: 'High' },
  medium:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: 'Medium' },
  low:      { color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',     label: 'Low' },
};

const statusConfig = {
  pending:           { icon: Clock,           color: 'text-yellow-400', label: 'Pending' },
  approved:          { icon: CheckCircle,     color: 'text-teal-400',   label: 'Approved' },
  rejected:          { icon: XCircle,         color: 'text-red-400',    label: 'Rejected' },
  'in-transit':      { icon: Truck,           color: 'text-violet-400', label: 'In Transit' },
  completed:         { icon: CheckCircle,     color: 'text-emerald-400',label: 'Completed' },
  cancelled:         { icon: XCircle,         color: 'text-slate-400',  label: 'Cancelled' },
  'info-requested':  { icon: MessageSquare,   color: 'text-cyan-400',   label: 'Info Requested' },
};

const TRANSFER_REASONS = [
  { id: 'icu_unavailable',       label: 'ICU Unavailable',         icon: Brain,        color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/25' },
  { id: 'specialist_unavailable', label: 'Specialist Unavailable', icon: Stethoscope,  color: 'text-teal-400',   bg: 'bg-teal-500/10 border-teal-500/25' },
  { id: 'emergency_overload',    label: 'Emergency Overload',      icon: AlertTriangle,color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/25' },
  { id: 'surgery_requirement',   label: 'Surgery Requirement',     icon: Heart,        color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/25' },
  { id: 'equipment_unavailable', label: 'Equipment Unavailable',   icon: BedDouble,    color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/25' },
  { id: 'bed_shortage',          label: 'Bed Shortage',            icon: BedDouble,    color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/25' },
];

const REASON_LABELS = Object.fromEntries(TRANSFER_REASONS.map(r => [r.id, r.label]));

export default function PatientTransfer() {
  const { user } = useAuth();
  const [tab, setTab] = useState('incoming');
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [infoModal, setInfoModal] = useState(null);
  const [respondModal, setRespondModal] = useState(null);
  const [approveForm, setApproveForm] = useState({
    hospitalNotes: '', ambulanceDriver: '', vehicleNumber: '', ambulancePhone: '', eta: ''
  });
  const [rejectReason, setRejectReason] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [respondMessage, setRespondMessage] = useState('');
  const socketRef = useRef(null);

  // ─── Initiate Transfer State ───
  const [initStep, setInitStep] = useState(1); // 1=patient, 2=reason+vitals, 3=recommendations, 4=confirm
  const [recommendations, setRecommendations] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [loadingRec, setLoadingRec] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdTransferId, setCreatedTransferId] = useState(null);

  const [initForm, setInitForm] = useState({
    patientName: '', patientAge: '', patientPhone: '', bloodGroup: 'O+',
    medicalCondition: '', medicalSummary: '',
    priority: 'high', requiresICU: false, requiresAmbulance: true, specialistNeeded: '',
    transferReason: '', transferReasonDetail: '',
    vitals: { bp: '', heartRate: '', spo2: '', temperature: '', respiratoryRate: '' },
  });

  useEffect(() => {
    if (tab !== 'initiate') {
      fetchTransfers();
    }
    setupSocket();
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [tab]);

  const setupSocket = () => {
    if (socketRef.current) socketRef.current.disconnect();
    socketRef.current = io(SOCKET_URL);
    socketRef.current.on('transfer-request', (data) => {
      toast.error('🚨 New transfer request for ' + data.patientName, { duration: 6000 });
      fetchTransfers();
    });
    socketRef.current.on('transfer-info-requested', (data) => {
      toast('📋 Info requested for ' + data.patientName, { duration: 5000 });
      fetchTransfers();
    });
    socketRef.current.on('transfer-info-responded', () => fetchTransfers());
  };

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const params = 'type=' + (tab === 'initiate' ? 'outgoing' : tab) + (filterStatus !== 'all' ? '&status=' + filterStatus : '');
      const { data } = await api.get('/transfer/hospital?' + params);
      setTransfers(data.transfers || []);
    } catch {
      toast.error('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await api.put('/transfer/' + approveModal._id + '/approve', approveForm);
      toast.success('Transfer approved! Ambulance details sent.');
      setApproveModal(null);
      setApproveForm({ hospitalNotes: '', ambulanceDriver: '', vehicleNumber: '', ambulancePhone: '', eta: '' });
      fetchTransfers();
    } catch {
      toast.error('Failed to approve transfer');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Please provide a reason'); return; }
    try {
      await api.put('/transfer/' + rejectModal._id + '/reject', { rejectionReason: rejectReason });
      toast.success('Transfer request rejected');
      setRejectModal(null);
      setRejectReason('');
      fetchTransfers();
    } catch {
      toast.error('Failed to reject transfer');
    }
  };

  const handleRequestInfo = async () => {
    if (!infoMessage.trim()) { toast.error('Please enter what info you need'); return; }
    try {
      await api.put('/transfer/' + infoModal._id + '/request-info', { message: infoMessage });
      toast.success('Info request sent to sending hospital');
      setInfoModal(null);
      setInfoMessage('');
      fetchTransfers();
    } catch {
      toast.error('Failed to send info request');
    }
  };

  const handleRespondInfo = async () => {
    if (!respondMessage.trim()) { toast.error('Please enter your response'); return; }
    try {
      await api.put('/transfer/' + respondModal._id + '/respond-info', { response: respondMessage });
      toast.success('Additional info sent');
      setRespondModal(null);
      setRespondMessage('');
      fetchTransfers();
    } catch {
      toast.error('Failed to send response');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put('/transfer/' + id + '/status', { status });
      toast.success('Status updated to ' + status);
      fetchTransfers();
    } catch {
      toast.error('Failed to update status');
    }
  };

  // ─── Initiate Transfer Handlers ───
  const fetchRecommendations = async () => {
    setLoadingRec(true);
    try {
      const params = new URLSearchParams();
      if (initForm.medicalCondition) params.append('condition', initForm.medicalCondition);
      if (initForm.requiresICU) params.append('requiresICU', 'true');
      if (initForm.specialistNeeded) params.append('specialistNeeded', initForm.specialistNeeded);

      const { data } = await api.get('/transfer/recommendations?' + params.toString());
      // Filter out own hospital
      const recs = (data.recommendations || []).filter(r => r.hospital.id !== user?._id?.toString() && r.hospital.id !== user?.id);
      setRecommendations(recs);
      setAiSummary(data.aiSummary || '');
    } catch {
      toast.error('Failed to load recommendations');
    } finally {
      setLoadingRec(false);
    }
  };

  const handleInitiateSubmit = async () => {
    if (!selectedHospital) { toast.error('Please select a destination hospital'); return; }
    if (!initForm.patientName || !initForm.medicalCondition || !initForm.transferReason) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/transfer/create', {
        ...initForm,
        toHospitalId: selectedHospital.hospital.id,
      });
      toast.success('🚑 Transfer request sent to ' + selectedHospital.hospital.name);
      setCreatedTransferId(data.transfer?._id);
      setInitStep(4); // confirmation step
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const resetInitForm = () => {
    setInitForm({
      patientName: '', patientAge: '', patientPhone: '', bloodGroup: 'O+',
      medicalCondition: '', medicalSummary: '',
      priority: 'high', requiresICU: false, requiresAmbulance: true, specialistNeeded: '',
      transferReason: '', transferReasonDetail: '',
      vitals: { bp: '', heartRate: '', spo2: '', temperature: '', respiratoryRate: '' },
    });
    setInitStep(1);
    setSelectedHospital(null);
    setCreatedTransferId(null);
    setRecommendations([]);
    setAiSummary('');
  };

  const filteredTransfers = filterStatus === 'all'
    ? transfers
    : transfers.filter(t => t.status === filterStatus);

  // Summary counts
  const pending = transfers.filter(t => t.status === 'pending').length;
  const approved = transfers.filter(t => t.status === 'approved').length;
  const inTransit = transfers.filter(t => t.status === 'in-transit').length;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: pending, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Approved', value: approved, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
          { label: 'In Transit', value: inTransit, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
        ].map((s, i) => (
          <div key={i} className={'glass rounded-xl p-4 text-center border ' + s.bg}>
            <div className={'text-2xl font-bold ' + s.color}>{s.value}</div>
            <div className="text-slate-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs + Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {[
            { id: 'incoming', label: '📥 Incoming' },
            { id: 'outgoing', label: '📤 Outgoing' },
            { id: 'initiate', label: '➕ Initiate Transfer' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={'px-4 py-2 rounded-xl text-sm transition-all ' +
                (tab === t.id
                  ? (t.id === 'initiate' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-violet-500/20 text-violet-400 border border-violet-500/30')
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab !== 'initiate' && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {['all', 'pending', 'approved', 'info-requested', 'in-transit', 'completed', 'rejected'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={'px-2.5 py-1 rounded-lg text-xs capitalize transition-all ' +
                    (filterStatus === s
                      ? 'bg-white/15 text-white'
                      : 'text-slate-500 hover:text-white'
                    )}
                >
                  {s === 'all' ? 'All' : s === 'info-requested' ? 'Info Req.' : s}
                </button>
              ))}
            </div>
            <button onClick={fetchTransfers} className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-all">
              <RefreshCw size={14} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* ═══════════════════════════════════════════════════ */}
        {/* ─── INITIATE TRANSFER TAB ─── */}
        {/* ═══════════════════════════════════════════════════ */}
        {tab === 'initiate' ? (
          <motion.div key="initiate" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-5">

            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {[
                { n: 1, label: 'Patient Details' },
                { n: 2, label: 'Reason & Vitals' },
                { n: 3, label: 'Select Hospital' },
                { n: 4, label: 'Confirmation' },
              ].map((step, i) => (
                <div key={step.n} className="flex items-center gap-2">
                  <button
                    onClick={() => { if (step.n < initStep || (step.n <= 3 && initStep > step.n)) setInitStep(step.n); }}
                    className={'w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ' +
                      (initStep === step.n
                        ? 'bg-teal-500 text-slate-900'
                        : initStep > step.n
                          ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                          : 'bg-white/5 text-slate-500 border border-white/10'
                      )}
                  >
                    {initStep > step.n ? <CheckCircle size={13} /> : step.n}
                  </button>
                  <span className={'text-xs hidden sm:inline ' + (initStep >= step.n ? 'text-white' : 'text-slate-600')}>{step.label}</span>
                  {i < 3 && <div className={'w-6 h-px ' + (initStep > step.n ? 'bg-teal-500/40' : 'bg-white/10')} />}
                </div>
              ))}
            </div>

            {/* ─── Step 1: Patient Details ─── */}
            {initStep === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6 space-y-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <User size={16} className="text-teal-400" /> Patient Information
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Patient Name *</label>
                    <input value={initForm.patientName} onChange={e => setInitForm({ ...initForm, patientName: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50" placeholder="Full name" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Age</label>
                    <input type="number" value={initForm.patientAge} onChange={e => setInitForm({ ...initForm, patientAge: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50" placeholder="Age" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Phone</label>
                    <input value={initForm.patientPhone} onChange={e => setInitForm({ ...initForm, patientPhone: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50" placeholder="Contact number" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Blood Group</label>
                    <select value={initForm.bloodGroup} onChange={e => setInitForm({ ...initForm, bloodGroup: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50">
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg} value={bg} className="bg-slate-900">{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Medical Condition *</label>
                  <input value={initForm.medicalCondition} onChange={e => setInitForm({ ...initForm, medicalCondition: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                    placeholder="e.g. Acute MI, Polytrauma, Stroke" />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Medical Summary</label>
                  <textarea value={initForm.medicalSummary} onChange={e => setInitForm({ ...initForm, medicalSummary: e.target.value })}
                    rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 resize-none"
                    placeholder="Brief history, current treatment, reason for transfer..." />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={initForm.requiresICU} onChange={e => setInitForm({ ...initForm, requiresICU: e.target.checked })} className="accent-teal-500" />
                    <span className="text-sm text-slate-300">Requires ICU</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={initForm.requiresAmbulance} onChange={e => setInitForm({ ...initForm, requiresAmbulance: e.target.checked })} className="accent-teal-500" />
                    <span className="text-sm text-slate-300">Requires Ambulance</span>
                  </label>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Specialist Needed (optional)</label>
                  <input value={initForm.specialistNeeded} onChange={e => setInitForm({ ...initForm, specialistNeeded: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                    placeholder="e.g. Cardiologist, Neurosurgeon" />
                </div>

                <button
                  onClick={() => { if (!initForm.patientName || !initForm.medicalCondition) { toast.error('Please fill patient name and condition'); return; } setInitStep(2); }}
                  className="w-full py-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 font-semibold text-sm hover:bg-teal-500/25 transition-all flex items-center justify-center gap-2"
                >
                  Next: Transfer Reason & Vitals <ArrowRight size={14} />
                </button>
              </motion.div>
            )}

            {/* ─── Step 2: Transfer Reason & Vitals ─── */}
            {initStep === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                {/* Transfer Reason */}
                <div className="glass rounded-2xl p-6 space-y-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <AlertTriangle size={16} className="text-orange-400" /> Transfer Reason *
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {TRANSFER_REASONS.map(reason => (
                      <button key={reason.id}
                        onClick={() => setInitForm({ ...initForm, transferReason: reason.id })}
                        className={'p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ' +
                          (initForm.transferReason === reason.id
                            ? reason.bg + ' ring-1 ring-white/10'
                            : 'bg-white/3 border-white/8 hover:border-white/15'
                          )}
                      >
                        <reason.icon size={18} className={initForm.transferReason === reason.id ? reason.color : 'text-slate-500'} />
                        <div className={'text-sm font-semibold mt-2 ' + (initForm.transferReason === reason.id ? 'text-white' : 'text-slate-400')}>{reason.label}</div>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Additional Details</label>
                    <input value={initForm.transferReasonDetail} onChange={e => setInitForm({ ...initForm, transferReasonDetail: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                      placeholder="Provide more context..." />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Priority Level</label>
                    <div className="flex gap-2">
                      {['low', 'medium', 'high', 'critical'].map(p => {
                        const cfg = urgencyConfig[p];
                        return (
                          <button key={p} onClick={() => setInitForm({ ...initForm, priority: p })}
                            className={'flex-1 py-2.5 rounded-xl text-xs capitalize border font-medium transition-all ' +
                              (initForm.priority === p ? cfg.bg + ' ' + cfg.color : 'bg-white/5 border-white/10 text-slate-500 hover:text-white')}>
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Vitals */}
                <div className="glass rounded-2xl p-6 space-y-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Activity size={16} className="text-pink-400" /> Patient Vitals
                  </h3>
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { key: 'bp', label: 'Blood Pressure', placeholder: '120/80', icon: Heart, color: 'text-red-400' },
                      { key: 'heartRate', label: 'Heart Rate', placeholder: '78', icon: Activity, color: 'text-pink-400' },
                      { key: 'spo2', label: 'SpO₂ %', placeholder: '98', icon: Wind, color: 'text-blue-400' },
                      { key: 'temperature', label: 'Temp °F', placeholder: '98.6', icon: Thermometer, color: 'text-orange-400' },
                      { key: 'respiratoryRate', label: 'RR /min', placeholder: '16', icon: Wind, color: 'text-teal-400' },
                    ].map(v => (
                      <div key={v.key}>
                        <label className="text-[10px] text-slate-400 mb-1 block flex items-center gap-1">
                          <v.icon size={9} className={v.color} /> {v.label}
                        </label>
                        <input
                          value={initForm.vitals[v.key]}
                          onChange={e => setInitForm({ ...initForm, vitals: { ...initForm.vitals, [v.key]: e.target.value } })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 text-center"
                          placeholder={v.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setInitStep(1)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-all">
                    ← Back
                  </button>
                  <button
                    onClick={() => { if (!initForm.transferReason) { toast.error('Please select a transfer reason'); return; } fetchRecommendations(); setInitStep(3); }}
                    className="flex-1 py-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 font-semibold text-sm hover:bg-teal-500/25 transition-all flex items-center justify-center gap-2">
                    Next: Find Hospital <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 3: AI Recommendations ─── */}
            {initStep === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                {/* AI Summary */}
                {aiSummary && (
                  <div className="glass rounded-2xl p-4 border border-violet-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={15} className="text-violet-400" />
                      <span className="text-violet-400 text-xs font-semibold uppercase tracking-wider">AI Recommendation</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{aiSummary}</p>
                  </div>
                )}

                {/* Hospital Grid */}
                {loadingRec ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="glass rounded-2xl h-64 animate-pulse" />)}
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="glass rounded-2xl p-12 text-center">
                    <BedDouble size={32} className="text-slate-600 mx-auto mb-3" />
                    <div className="text-slate-400 font-medium">No hospitals with available resources found</div>
                    <div className="text-slate-600 text-sm mt-1">Try adjusting requirements or check back later</div>
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

                {/* Selected hospital bar */}
                {selectedHospital && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-4 border border-teal-500/30 flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold">Selected: {selectedHospital.hospital.name}</div>
                      <div className="text-slate-400 text-sm">ETA: {selectedHospital.estimatedArrival} • Score: {selectedHospital.score}/100</div>
                    </div>
                    <button onClick={() => setSelectedHospital(null)} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white">
                      <XCircle size={16} />
                    </button>
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setInitStep(2)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-all">
                    ← Back
                  </button>
                  <button onClick={() => fetchRecommendations()}
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm hover:text-white transition-all">
                    <RefreshCw size={14} />
                  </button>
                  <button
                    onClick={handleInitiateSubmit}
                    disabled={!selectedHospital || submitting}
                    className="flex-1 py-3 rounded-xl bg-teal-500 text-slate-900 font-bold text-sm hover:bg-teal-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <><div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> Sending...</> : <><Truck size={15} /> Send Transfer Request</>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 4: Confirmation + DigiLocker ─── */}
            {initStep === 4 && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
                <div className="glass rounded-2xl p-8 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}
                    className="w-16 h-16 rounded-full bg-teal-500/20 border-2 border-teal-500/40 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-teal-400" />
                  </motion.div>
                  <h3 className="text-white font-bold text-xl mb-1">Transfer Request Sent!</h3>
                  <p className="text-slate-400 text-sm mb-2">
                    {initForm.patientName} → {selectedHospital?.hospital?.name}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                    <span className={'px-2 py-0.5 rounded-full border ' + urgencyConfig[initForm.priority]?.bg + ' ' + urgencyConfig[initForm.priority]?.color}>
                      {urgencyConfig[initForm.priority]?.label}
                    </span>
                    <span>{REASON_LABELS[initForm.transferReason] || initForm.transferReason}</span>
                  </div>
                </div>

                {/* DigiLocker sync */}
                {createdTransferId && (
                  <DigiLockerPanel transferId={createdTransferId} />
                )}

                <div className="flex gap-3">
                  <button onClick={() => { resetInitForm(); setTab('outgoing'); fetchTransfers(); }}
                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm hover:bg-white/10 transition-all">
                    View Outgoing Transfers
                  </button>
                  <button onClick={resetInitForm}
                    className="flex-1 py-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 font-semibold text-sm hover:bg-teal-500/25 transition-all flex items-center justify-center gap-2">
                    <Plus size={14} /> New Transfer
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>

        ) : (
          /* ═══════════════════════════════════════════════════ */
          /* ─── INCOMING / OUTGOING TABS ─── */
          /* ═══════════════════════════════════════════════════ */
          <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="glass rounded-2xl h-28 animate-pulse" />)}
              </div>
            ) : filteredTransfers.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center">
                <Truck size={24} className="text-slate-600 mx-auto mb-2" />
                <div className="text-slate-400 text-sm">No {tab} transfer requests</div>
              </div>
            ) : filteredTransfers.map((transfer, i) => {
              const u = urgencyConfig[transfer.priority] || urgencyConfig.medium;
              const s = statusConfig[transfer.status] || statusConfig.pending;
              const isExpanded = expandedId === transfer._id;

              return (
                <motion.div key={transfer._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }} className="glass rounded-2xl overflow-hidden">
                  {/* Header */}
                  <div className="p-5 cursor-pointer hover:bg-white/2 transition-all" onClick={() => setExpandedId(isExpanded ? null : transfer._id)}>
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                        <User size={18} className="text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold">{transfer.patientName}</span>
                          <span className="text-slate-500 text-xs">Age {transfer.patientAge}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{transfer.bloodGroup}</span>
                          <span className={'text-xs px-2 py-0.5 rounded-full border ' + u.bg + ' ' + u.color}>{u.label}</span>
                          {transfer.transferReason && transfer.transferReason !== 'other' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                              {REASON_LABELS[transfer.transferReason] || transfer.transferReason}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-300 text-sm mt-0.5">{transfer.medicalCondition}</div>
                        <div className="flex items-center flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <ArrowRight size={10} />
                            {tab === 'incoming' ? 'From: ' + transfer.fromHospital.name : 'To: ' + transfer.toHospital.name}
                          </span>
                          {transfer.requiresICU && (
                            <span className="flex items-center gap-1 text-violet-400"><Brain size={10} /> ICU Required</span>
                          )}
                          {transfer.specialistNeeded && (
                            <span className="flex items-center gap-1 text-emerald-400"><Stethoscope size={10} /> {transfer.specialistNeeded}</span>
                          )}
                          {transfer.digilocker?.synced && (
                            <span className="flex items-center gap-1 text-emerald-400"><Shield size={10} /> DigiLocker</span>
                          )}
                          <span>{new Date(transfer.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <s.icon size={14} className={s.color} />
                          <span className={'text-xs ' + s.color}>{s.label}</span>
                        </div>
                        {isExpanded ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="border-t border-white/5 overflow-hidden">
                        <div className="p-5 space-y-4">
                          {/* Vitals display */}
                          {transfer.vitals && Object.values(transfer.vitals).some(v => v) && (
                            <div>
                              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Vitals</div>
                              <div className="grid grid-cols-5 gap-2">
                                {[
                                  { label: 'BP', value: transfer.vitals.bp, icon: Heart, color: 'text-red-400' },
                                  { label: 'Heart Rate', value: transfer.vitals.heartRate, icon: Activity, color: 'text-pink-400' },
                                  { label: 'SpO₂', value: transfer.vitals.spo2, icon: Wind, color: 'text-blue-400' },
                                  { label: 'Temp', value: transfer.vitals.temperature, icon: Thermometer, color: 'text-orange-400' },
                                  { label: 'RR', value: transfer.vitals.respiratoryRate, icon: Wind, color: 'text-teal-400' },
                                ].filter(v => v.value).map((v, vi) => (
                                  <div key={vi} className="text-center bg-white/3 rounded-xl p-2.5">
                                    <v.icon size={14} className={'mx-auto mb-1 ' + v.color} />
                                    <div className="text-white text-sm font-bold">{v.value}</div>
                                    <div className="text-slate-600 text-xs">{v.label}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Medical Summary */}
                          {transfer.medicalSummary && (
                            <div className="bg-white/3 rounded-xl p-3">
                              <div className="text-xs text-slate-400 mb-1 font-medium">Medical Summary</div>
                              <div className="text-slate-300 text-sm">{transfer.medicalSummary}</div>
                            </div>
                          )}

                          {/* Info Request thread */}
                          {transfer.infoRequest?.message && (
                            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 space-y-2">
                              <div className="text-cyan-400 text-xs font-semibold flex items-center gap-1"><MessageSquare size={11} /> Information Requested</div>
                              <div className="text-slate-300 text-sm">"{transfer.infoRequest.message}"</div>
                              {transfer.infoRequest.response && (
                                <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-2 mt-2">
                                  <div className="text-teal-400 text-xs font-semibold mb-0.5">Response</div>
                                  <div className="text-slate-300 text-sm">"{transfer.infoRequest.response}"</div>
                                </div>
                              )}
                              {/* Respond button for outgoing + no response yet */}
                              {tab === 'outgoing' && transfer.status === 'info-requested' && !transfer.infoRequest.response && (
                                <button onClick={() => setRespondModal(transfer)}
                                  className="mt-1 px-3 py-1.5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xs font-semibold hover:bg-teal-500/25 transition-all flex items-center gap-1.5">
                                  <Send size={10} /> Send Response
                                </button>
                              )}
                            </div>
                          )}

                          {/* DigiLocker documents */}
                          {transfer.digilocker?.synced && (
                            <DigiLockerPanel
                              transferId={transfer._id}
                              synced={true}
                              compact={true}
                            />
                          )}

                          {/* Ambulance Info */}
                          {transfer.ambulance?.isAssigned && (
                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                              <div className="text-orange-400 text-xs font-medium mb-2">Ambulance Assigned</div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                                <span>Driver: {transfer.ambulance.driverName}</span>
                                <span>Vehicle: {transfer.ambulance.vehicleNumber}</span>
                                <span>ETA: {transfer.ambulance.eta}</span>
                                <a href={'tel:' + transfer.ambulance.phone} className="text-teal-400 hover:underline">{transfer.ambulance.phone}</a>
                              </div>
                            </div>
                          )}

                          {/* Timeline */}
                          <div>
                            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Timeline</div>
                            <TransferTimeline timeline={transfer.timeline} currentStatus={transfer.status} />
                          </div>

                          {/* Actions */}
                          {transfer.status === 'pending' && tab === 'incoming' && (
                            <div className="flex gap-3">
                              <button onClick={() => setInfoModal(transfer)}
                                className="flex-1 py-2.5 rounded-xl border border-cyan-500/30 text-cyan-400 text-sm hover:bg-cyan-500/10 transition-all flex items-center justify-center gap-2">
                                <Info size={14} /> Request Info
                              </button>
                              <button onClick={() => setRejectModal(transfer)}
                                className="flex-1 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
                                <XCircle size={14} /> Reject
                              </button>
                              <button onClick={() => setApproveModal(transfer)}
                                className="flex-1 py-2.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 text-sm font-semibold hover:bg-teal-500/25 transition-all flex items-center justify-center gap-2">
                                <CheckCircle size={14} /> Approve
                              </button>
                            </div>
                          )}

                          {transfer.status === 'info-requested' && tab === 'incoming' && (
                            <div className="flex gap-3">
                              <button onClick={() => setRejectModal(transfer)}
                                className="flex-1 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
                                <XCircle size={14} /> Reject
                              </button>
                              <button onClick={() => setApproveModal(transfer)}
                                className="flex-1 py-2.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 text-sm font-semibold hover:bg-teal-500/25 transition-all flex items-center justify-center gap-2">
                                <CheckCircle size={14} /> Approve
                              </button>
                            </div>
                          )}

                          {transfer.status === 'approved' && (
                            <button onClick={() => handleStatusUpdate(transfer._id, 'in-transit')}
                              className="w-full py-2.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400 text-sm font-semibold hover:bg-violet-500/25 transition-all flex items-center justify-center gap-2">
                              <Truck size={14} /> Mark as In Transit
                            </button>
                          )}

                          {transfer.status === 'in-transit' && (
                            <button onClick={() => handleStatusUpdate(transfer._id, 'completed')}
                              className="w-full py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-2">
                              <CheckCircle size={14} /> Mark as Completed
                            </button>
                          )}

                          {/* Contact */}
                          <div className="flex gap-3">
                            <a href={'tel:' + transfer.patientPhone}
                              className="flex-1 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs text-center flex items-center justify-center gap-1.5 hover:bg-teal-500/20 transition-all">
                              <Phone size={12} /> Patient
                            </a>
                            <a href={'tel:' + transfer.fromHospital.phone}
                              className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs text-center flex items-center justify-center gap-1.5 hover:bg-white/10 transition-all">
                              <Phone size={12} /> From Hospital
                            </a>
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

      {/* ═══ APPROVE MODAL ═══ */}
      <AnimatePresence>
        {approveModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setApproveModal(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-teal-500/30 rounded-3xl p-6 w-full max-w-md">
              <h3 className="text-white font-bold text-lg mb-1">Approve Transfer</h3>
              <p className="text-slate-400 text-sm mb-5">For {approveModal.patientName} — {approveModal.medicalCondition}</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Hospital Notes</label>
                  <textarea value={approveForm.hospitalNotes} onChange={e => setApproveForm({ ...approveForm, hospitalNotes: e.target.value })}
                    rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 resize-none"
                    placeholder="Any notes for the patient or family..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Driver Name</label>
                    <input value={approveForm.ambulanceDriver} onChange={e => setApproveForm({ ...approveForm, ambulanceDriver: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50" placeholder="Driver name" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Vehicle No.</label>
                    <input value={approveForm.vehicleNumber} onChange={e => setApproveForm({ ...approveForm, vehicleNumber: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50" placeholder="JH-01-AA-0000" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Ambulance Phone</label>
                    <input value={approveForm.ambulancePhone} onChange={e => setApproveForm({ ...approveForm, ambulancePhone: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50" placeholder="Phone number" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">ETA</label>
                    <input value={approveForm.eta} onChange={e => setApproveForm({ ...approveForm, eta: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50" placeholder="e.g. 30 minutes" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setApproveModal(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5">Cancel</button>
                <button onClick={handleApprove} className="flex-1 py-2.5 rounded-xl bg-teal-500 text-slate-900 font-bold text-sm hover:bg-teal-400 transition-all flex items-center justify-center gap-2">
                  <CheckCircle size={14} /> Confirm Approval
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ REJECT MODAL ═══ */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setRejectModal(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-red-500/20 rounded-3xl p-6 w-full max-w-md">
              <h3 className="text-white font-bold text-lg mb-1">Reject Transfer</h3>
              <p className="text-slate-400 text-sm mb-5">For {rejectModal.patientName}</p>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Reason for Rejection *</label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50 resize-none"
                  placeholder="e.g. No ICU beds available, specialist not on duty..." />
              </div>
              <div className="flex gap-2 mt-3 mb-5">
                {['No beds available', 'ICU full', 'Specialist unavailable', 'Insufficient resources'].map(r => (
                  <button key={r} onClick={() => setRejectReason(r)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
                    {r}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setRejectModal(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5">Cancel</button>
                <button onClick={handleReject} className="flex-1 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/25 transition-all flex items-center justify-center gap-2">
                  <XCircle size={14} /> Confirm Rejection
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ REQUEST INFO MODAL ═══ */}
      <AnimatePresence>
        {infoModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setInfoModal(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-cyan-500/20 rounded-3xl p-6 w-full max-w-md">
              <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                <Info size={18} className="text-cyan-400" /> Request More Information
              </h3>
              <p className="text-slate-400 text-sm mb-5">For {infoModal.patientName} — from {infoModal.fromHospital.name}</p>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">What additional info do you need? *</label>
                <textarea value={infoMessage} onChange={e => setInfoMessage(e.target.value)}
                  rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                  placeholder="e.g. Need latest CT scan report, allergy history..." />
              </div>
              <div className="flex gap-2 mt-3 mb-5">
                {['Latest lab reports needed', 'CT/MRI scans required', 'Allergy history needed', 'Insurance details required'].map(r => (
                  <button key={r} onClick={() => setInfoMessage(r)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
                    {r}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setInfoModal(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5">Cancel</button>
                <button onClick={handleRequestInfo} className="flex-1 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-bold text-sm hover:bg-cyan-500/25 transition-all flex items-center justify-center gap-2">
                  <Send size={14} /> Send Request
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ RESPOND INFO MODAL ═══ */}
      <AnimatePresence>
        {respondModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setRespondModal(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-teal-500/20 rounded-3xl p-6 w-full max-w-md">
              <h3 className="text-white font-bold text-lg mb-1">Respond to Info Request</h3>
              <p className="text-slate-400 text-sm mb-2">For {respondModal.patientName}</p>
              {respondModal.infoRequest?.message && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 mb-4">
                  <div className="text-cyan-400 text-xs font-semibold mb-0.5">They asked:</div>
                  <div className="text-slate-300 text-sm">"{respondModal.infoRequest.message}"</div>
                </div>
              )}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Your Response *</label>
                <textarea value={respondMessage} onChange={e => setRespondMessage(e.target.value)}
                  rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 resize-none"
                  placeholder="Provide the requested information..." />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setRespondModal(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5">Cancel</button>
                <button onClick={handleRespondInfo} className="flex-1 py-2.5 rounded-xl bg-teal-500 text-slate-900 font-bold text-sm hover:bg-teal-400 transition-all flex items-center justify-center gap-2">
                  <Send size={14} /> Send Response
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}