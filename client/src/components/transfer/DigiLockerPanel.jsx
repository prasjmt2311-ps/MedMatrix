import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Shield, CheckCircle, Loader, Download,
  ClipboardList, Pill, TestTube, CreditCard, Image,
  Syringe, ChevronDown, ChevronUp, Heart, Activity,
  Thermometer, Wind, RefreshCw, ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DOC_TYPE_CONFIG = {
  discharge_summary: { icon: ClipboardList, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20', label: 'Discharge Summary' },
  prescription:      { icon: Pill,          color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', label: 'Prescription' },
  lab_report:        { icon: TestTube,      color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Lab Report' },
  insurance:         { icon: CreditCard,    color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Insurance' },
  imaging:           { icon: Image,         color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', label: 'Imaging' },
  vaccination:       { icon: Syringe,       color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Vaccination' },
  vitals_report:     { icon: Activity,      color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', label: 'Vitals Report' },
  referral_letter:   { icon: FileText,      color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', label: 'Referral Letter' },
};

/* ─── Single Document Card ─── */
function DocumentCard({ doc, index }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = DOC_TYPE_CONFIG[doc.type] || DOC_TYPE_CONFIG.discharge_summary;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={'rounded-xl border overflow-hidden ' + cfg.bg}
    >
      <div
        className="p-3.5 cursor-pointer hover:bg-white/2 transition-all"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className={'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ' + cfg.bg}>
            <Icon size={16} className={cfg.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold text-xs truncate">{doc.title}</span>
              {doc.digilockerVerified && (
                <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-semibold shrink-0">
                  <Shield size={8} /> Verified
                </span>
              )}
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5">{cfg.label} • {doc.issuedBy}</div>
            {doc.digilockerDocId && (
              <div className="text-slate-600 text-[10px] mt-0.5 font-mono">{doc.digilockerDocId}</div>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {expanded ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 overflow-hidden"
          >
            <div className="p-3.5 space-y-2.5">
              {doc.description && (
                <p className="text-slate-400 text-xs leading-relaxed">{doc.description}</p>
              )}

              {/* Vitals */}
              {doc.metadata?.vitals && Object.values(doc.metadata.vitals).some(v => v) && (
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { label: 'BP', value: doc.metadata.vitals.bp, icon: Heart, color: 'text-red-400' },
                    { label: 'HR', value: doc.metadata.vitals.heartRate, icon: Activity, color: 'text-pink-400' },
                    { label: 'SpO₂', value: doc.metadata.vitals.spo2, icon: Wind, color: 'text-blue-400' },
                    { label: 'Temp', value: doc.metadata.vitals.temperature, icon: Thermometer, color: 'text-orange-400' },
                    { label: 'RR', value: doc.metadata.vitals.respiratoryRate, icon: Wind, color: 'text-teal-400' },
                  ].filter(v => v.value).map((v, i) => (
                    <div key={i} className="text-center bg-white/3 rounded-lg p-1.5">
                      <v.icon size={10} className={'mx-auto mb-0.5 ' + v.color} />
                      <div className="text-white text-[10px] font-bold">{v.value}</div>
                      <div className="text-slate-600 text-[9px]">{v.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Lab Values */}
              {doc.metadata?.labValues && Object.values(doc.metadata.labValues).some(v => v) && (
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(doc.metadata.labValues)
                    .filter(([, v]) => v)
                    .map(([key, val], i) => (
                      <div key={i} className="flex items-center justify-between bg-white/3 rounded-lg px-2.5 py-1.5">
                        <span className="text-slate-400 text-[10px] capitalize">{key}</span>
                        <span className="text-white text-[10px] font-semibold">{val}</span>
                      </div>
                    ))}
                </div>
              )}

              {/* Medications */}
              {doc.metadata?.medications?.length > 0 && (
                <div>
                  <div className="text-slate-500 text-[10px] font-medium uppercase tracking-wider mb-1">Medications</div>
                  <div className="flex flex-wrap gap-1">
                    {doc.metadata.medications.map((med, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {med}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {doc.metadata?.notes && (
                <div className="bg-white/3 rounded-lg p-2.5">
                  <div className="text-slate-500 text-[10px] font-medium mb-0.5">Notes</div>
                  <div className="text-slate-300 text-xs">{doc.metadata.notes}</div>
                </div>
              )}

              {/* Issued date */}
              <div className="text-slate-600 text-[10px] flex items-center gap-1.5">
                <FileText size={9} />
                Issued: {new Date(doc.issuedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {doc.digilockerSyncedAt && (
                  <span> • Synced: {new Date(doc.digilockerSyncedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main DigiLocker Panel ─── */
export default function DigiLockerPanel({ transferId, documents = [], onSync, synced = false, compact = false }) {
  const [docs, setDocs] = useState(documents);
  const [syncing, setSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(synced);
  const [syncTime, setSyncTime] = useState(null);

  const handleSync = async () => {
    if (!transferId) {
      toast.error('Save transfer first before syncing DigiLocker');
      return;
    }
    setSyncing(true);
    try {
      const { data } = await api.post('/transfer/' + transferId + '/sync-digilocker');
      setDocs(data.documents || []);
      setIsSynced(true);
      setSyncTime(new Date());
      toast.success('📄 DigiLocker: ' + (data.count || 0) + ' medical records synced!');
      if (onSync) onSync(data.documents);
    } catch (err) {
      toast.error('DigiLocker sync failed. Try again.');
    } finally {
      setSyncing(false);
    }
  };

  const fetchDocs = async () => {
    if (!transferId) return;
    try {
      const { data } = await api.get('/transfer/' + transferId + '/documents');
      if (data.documents?.length > 0) {
        setDocs(data.documents);
        setIsSynced(true);
      }
    } catch {}
  };

  // If no docs loaded but synced flag is set, fetch them
  if (synced && docs.length === 0 && transferId) {
    fetchDocs();
  }

  return (
    <div className={'rounded-2xl overflow-hidden ' + (compact ? '' : 'glass')}>
      {/* Header */}
      <div className={'flex items-center justify-between ' + (compact ? 'mb-3' : 'p-4 border-b border-white/5')}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <Shield size={14} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm flex items-center gap-1.5">
              DigiLocker
              {isSynced && (
                <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-medium">
                  <CheckCircle size={8} /> Synced
                </span>
              )}
            </div>
            <div className="text-slate-500 text-[10px]">
              {isSynced
                ? docs.length + ' documents verified' + (syncTime ? ' • ' + syncTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '')
                : 'Medical document portability'
              }
            </div>
          </div>
        </div>

        {!isSynced ? (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(45,212,191,0.15))',
              border: '1px solid rgba(16,185,129,0.3)',
              color: '#34d399',
            }}
          >
            {syncing ? (
              <>
                <Loader size={12} className="animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Download size={12} />
                Fetch from DigiLocker
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-500 hover:text-white transition-all bg-white/3 border border-white/5"
          >
            <RefreshCw size={10} className={syncing ? 'animate-spin' : ''} />
            Re-sync
          </button>
        )}
      </div>

      {/* Syncing Animation */}
      <AnimatePresence>
        {syncing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={'py-8 text-center ' + (compact ? '' : 'px-4')}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 mx-auto mb-3 rounded-full"
                style={{ border: '2px solid rgba(16,185,129,0.2)', borderTopColor: '#34d399' }}
              />
              <div className="text-white font-semibold text-sm mb-1">Connecting to DigiLocker</div>
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-emerald-400/60 text-xs"
              >
                Fetching medical records securely...
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documents List */}
      {docs.length > 0 && !syncing && (
        <div className={compact ? 'space-y-2' : 'p-4 space-y-2'}>
          {docs.map((doc, i) => (
            <DocumentCard key={doc._id || i} doc={doc} index={i} />
          ))}
        </div>
      )}

      {/* Empty state when synced but no docs */}
      {isSynced && docs.length === 0 && !syncing && (
        <div className={compact ? 'py-6 text-center' : 'p-6 text-center'}>
          <FileText size={20} className="text-slate-600 mx-auto mb-2" />
          <div className="text-slate-500 text-xs">No documents found in DigiLocker</div>
        </div>
      )}
    </div>
  );
}
