import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import {
  CheckCircle, XCircle, Clock, ArrowRight, AlertTriangle,
  User, Truck, Brain, Phone, ChevronDown, ChevronUp,
  BedDouble, Stethoscope, Ambulance, RefreshCw, Send
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import TransferTimeline from '../../../components/transfer/TransferTimeline';

const SOCKET_URL = 'http://localhost:5000';

const urgencyConfig = {
  critical: { color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',       label: 'Critical' },
  high:     { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', label: 'High' },
  medium:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: 'Medium' },
  low:      { color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',     label: 'Low' },
};

const statusConfig = {
  pending:      { icon: Clock,        color: 'text-yellow-400', label: 'Pending' },
  approved:     { icon: CheckCircle,  color: 'text-teal-400',   label: 'Approved' },
  rejected:     { icon: XCircle,      color: 'text-red-400',    label: 'Rejected' },
  'in-transit': { icon: Truck,        color: 'text-violet-400', label: 'In Transit' },
  completed:    { icon: CheckCircle,  color: 'text-emerald-400',label: 'Completed' },
  cancelled:    { icon: XCircle,      color: 'text-slate-400',  label: 'Cancelled' },
};

export default function PatientTransfer() {
  const { user } = useAuth();
  const [tab, setTab] = useState('incoming');
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [approveForm, setApproveForm] = useState({
    hospitalNotes: '', ambulanceDriver: '', vehicleNumber: '', ambulancePhone: '', eta: ''
  });
  const [rejectReason, setRejectReason] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    fetchTransfers();
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
  };

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const params = 'type=' + tab + (filterStatus !== 'all' ? '&status=' + filterStatus : '');
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
      toast.success('Transfer approved! Ambulance details sent to patient.');
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

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put('/transfer/' + id + '/status', { status });
      toast.success('Status updated to ' + status);
      fetchTransfers();
    } catch {
      toast.error('Failed to update status');
    }
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
            { id: 'incoming', label: 'Incoming' },
            { id: 'outgoing', label: 'Outgoing' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={'px-4 py-2 rounded-xl text-sm transition-all ' +
                (tab === t.id
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {['all', 'pending', 'approved', 'in-transit', 'completed', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={'px-2.5 py-1 rounded-lg text-xs capitalize transition-all ' +
                  (filterStatus === s
                    ? 'bg-white/15 text-white'
                    : 'text-slate-500 hover:text-white'
                  )}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
          <button onClick={fetchTransfers} className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-all">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Transfer List */}
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
          <motion.div
            key={transfer._id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div
              className="p-5 cursor-pointer hover:bg-white/2 transition-all"
              onClick={() => setExpandedId(isExpanded ? null : transfer._id)}
            >
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
                  </div>

                  <div className="text-slate-300 text-sm mt-0.5">{transfer.medicalCondition}</div>

                  <div className="flex items-center flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <ArrowRight size={10} />
                      {tab === 'incoming' ? 'From: ' + transfer.fromHospital.name : 'To: ' + transfer.toHospital.name}
                    </span>
                    {transfer.requiresICU && (
                      <span className="flex items-center gap-1 text-violet-400">
                        <Brain size={10} /> ICU Required
                      </span>
                    )}
                    {transfer.specialistNeeded && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Stethoscope size={10} /> {transfer.specialistNeeded}
                      </span>
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
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/5 overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    {/* Medical Summary */}
                    {transfer.medicalSummary && (
                      <div className="bg-white/3 rounded-xl p-3">
                        <div className="text-xs text-slate-400 mb-1 font-medium">Medical Summary</div>
                        <div className="text-slate-300 text-sm">{transfer.medicalSummary}</div>
                      </div>
                    )}

                    {/* Ambulance Info */}
                    {transfer.ambulance?.isAssigned && (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                        <div className="text-orange-400 text-xs font-medium mb-2">Ambulance Assigned</div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                          <span>Driver: {transfer.ambulance.driverName}</span>
                          <span>Vehicle: {transfer.ambulance.vehicleNumber}</span>
                          <span>ETA: {transfer.ambulance.eta}</span>
                          <a href={'tel:' + transfer.ambulance.phone} className="text-teal-400 hover:underline">
                            {transfer.ambulance.phone}
                          </a>
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
                        <button
                          onClick={() => setRejectModal(transfer)}
                          className="flex-1 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                        <button
                          onClick={() => setApproveModal(transfer)}
                          className="flex-1 py-2.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 text-sm font-semibold hover:bg-teal-500/25 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={14} /> Approve Transfer
                        </button>
                      </div>
                    )}

                    {transfer.status === 'approved' && (
                      <button
                        onClick={() => handleStatusUpdate(transfer._id, 'in-transit')}
                        className="w-full py-2.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400 text-sm font-semibold hover:bg-violet-500/25 transition-all flex items-center justify-center gap-2"
                      >
                        <Truck size={14} /> Mark as In Transit
                      </button>
                    )}

                    {transfer.status === 'in-transit' && (
                      <button
                        onClick={() => handleStatusUpdate(transfer._id, 'completed')}
                        className="w-full py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={14} /> Mark as Completed
                      </button>
                    )}

                    {/* Contact */}
                    <div className="flex gap-3">
                      <a
                        href={'tel:' + transfer.patientPhone}
                        className="flex-1 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs text-center flex items-center justify-center gap-1.5 hover:bg-teal-500/20 transition-all"
                      >
                        <Phone size={12} /> Patient
                      </a>
                      <a
                        href={'tel:' + transfer.fromHospital.phone}
                        className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs text-center flex items-center justify-center gap-1.5 hover:bg-white/10 transition-all"
                      >
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

      {/* Approve Modal */}
      <AnimatePresence>
        {approveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setApproveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-teal-500/30 rounded-3xl p-6 w-full max-w-md"
            >
              <h3 className="text-white font-bold text-lg mb-1">Approve Transfer</h3>
              <p className="text-slate-400 text-sm mb-5">For {approveModal.patientName} — {approveModal.medicalCondition}</p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Hospital Notes</label>
                  <textarea
                    value={approveForm.hospitalNotes}
                    onChange={e => setApproveForm({ ...approveForm, hospitalNotes: e.target.value })}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 resize-none"
                    placeholder="Any notes for the patient or family..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Driver Name</label>
                    <input
                      value={approveForm.ambulanceDriver}
                      onChange={e => setApproveForm({ ...approveForm, ambulanceDriver: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                      placeholder="Driver name"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Vehicle No.</label>
                    <input
                      value={approveForm.vehicleNumber}
                      onChange={e => setApproveForm({ ...approveForm, vehicleNumber: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                      placeholder="JH-01-AA-0000"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Ambulance Phone</label>
                    <input
                      value={approveForm.ambulancePhone}
                      onChange={e => setApproveForm({ ...approveForm, ambulancePhone: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">ETA</label>
                    <input
                      value={approveForm.eta}
                      onChange={e => setApproveForm({ ...approveForm, eta: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                      placeholder="e.g. 30 minutes"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setApproveModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 py-2.5 rounded-xl bg-teal-500 text-slate-900 font-bold text-sm hover:bg-teal-400 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={14} /> Confirm Approval
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setRejectModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-red-500/20 rounded-3xl p-6 w-full max-w-md"
            >
              <h3 className="text-white font-bold text-lg mb-1">Reject Transfer</h3>
              <p className="text-slate-400 text-sm mb-5">For {rejectModal.patientName}</p>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Reason for Rejection *</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50 resize-none"
                  placeholder="e.g. No ICU beds available, specialist not on duty..."
                />
              </div>

              <div className="flex gap-2 mt-3 mb-5">
                {['No beds available', 'ICU full', 'Specialist unavailable', 'Insufficient resources'].map(r => (
                  <button
                    key={r}
                    onClick={() => setRejectReason(r)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setRejectModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle size={14} /> Confirm Rejection
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}