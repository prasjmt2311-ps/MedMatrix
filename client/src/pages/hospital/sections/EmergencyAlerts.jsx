import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Send, Bell, Clock, CheckCircle, Zap, Phone } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const alertTypes = ['Mass Casualty', 'Fire Emergency', 'Blood Shortage', 'ICU Full', 'Power Outage', 'Staff Shortage'];
const severities = ['low', 'medium', 'high', 'critical'];

const severityConfig = {
  low:      { color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',     label: 'Low' },
  medium:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: 'Medium' },
  high:     { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', label: 'High' },
  critical: { color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',        label: 'Critical' },
};

const recentAlerts = [
  { id: 1, type: 'Blood Shortage', message: 'O+ blood critically low — need 20 units urgently', severity: 'critical', time: '15 min ago', resolved: false },
  { id: 2, type: 'ICU Full', message: 'All ICU beds occupied. Diverting new critical patients.', severity: 'high', time: '1 hr ago', resolved: false },
  { id: 3, type: 'Staff Shortage', message: 'Night shift understaffed by 3 nurses in Ward B.', severity: 'medium', time: '3 hr ago', resolved: true },
];

export default function EmergencyAlerts() {
  const [form, setForm] = useState({ type: 'Blood Shortage', severity: 'high', message: '' });
  const [sending, setSending] = useState(false);
  const [alerts, setAlerts] = useState(recentAlerts);
  const [activeTab, setActiveTab] = useState('send');

  // ✅ NEW — Real-time SOS monitoring
  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    socket.on('connect', () => {
      socket.emit('join-hospital-monitor', { hospitalId: 'hospital' });
    });

    socket.on('sos-alert', (data) => {
      const newAlert = {
        id: data.alertId || Date.now(),
        type: 'SOS Emergency',
        message: data.userName + ' needs help. ' + data.message + ' | ' + data.location.address,
        severity: 'critical',
        time: 'Just now',
        resolved: false,
        isSOS: true,
        phone: data.phone,
      };
      setAlerts(prev => [newAlert, ...prev]);
      setActiveTab('history');
      toast.error('🚨 SOS Alert received!', { duration: 6000 });

      // Beep sound
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        osc.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.start();
        setTimeout(() => osc.stop(), 600);
      } catch {}
    });

    socket.on('sos-acknowledged', (data) => {
      setAlerts(prev => prev.map(a =>
        a.id === data.alertId ? { ...a, resolved: true } : a
      ));
    });

    return () => socket.disconnect();
  }, []);

  const handleSend = async () => {
    if (!form.message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    setSending(true);
    try {
      await api.post('/hospital/emergency-alert', form);
      const newAlert = {
        id: Date.now(),
        ...form,
        time: 'Just now',
        resolved: false,
      };
      setAlerts(prev => [newAlert, ...prev]);
      setForm({ ...form, message: '' });
      toast.success('Emergency alert sent to all nearby hospitals!');
      setActiveTab('history');
    } catch {
      toast.error('Failed to send alert');
    } finally {
      setSending(false);
    }
  };

  const toggleResolve = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: !a.resolved } : a));
  };

  return (
    <div className="space-y-6">
      {alerts.some(a => !a.resolved && a.severity === 'critical') && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-400 animate-pulse" />
          </div>
          <div>
            <div className="text-red-400 font-semibold text-sm">Active Critical Alert</div>
            <div className="text-slate-400 text-xs">You have unresolved critical alerts requiring immediate attention.</div>
          </div>
        </motion.div>
      )}

      <div className="flex gap-2">
        {['send', 'history'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={'px-4 py-2 rounded-xl text-sm capitalize transition-all ' +
              (activeTab === tab
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
              )}
          >
            {tab === 'send' ? '🚨 Send Alert' : '📋 Alert History'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'send' ? (
          <motion.div key="send" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Zap size={18} className="text-red-400" /> Broadcast Emergency Alert
              </h3>
              <p className="text-slate-400 text-sm">Alert will be sent to all connected hospitals and emergency services.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Alert Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50">
                    {alertTypes.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Severity Level</label>
                  <div className="flex gap-2">
                    {severities.map(s => {
                      const cfg = severityConfig[s];
                      return (
                        <button key={s} onClick={() => setForm({ ...form, severity: s })}
                          className={'flex-1 py-2 rounded-xl text-xs border capitalize font-medium transition-all ' +
                            (form.severity === s ? cfg.bg + ' ' + cfg.color : 'bg-white/5 border-white/10 text-slate-500 hover:text-white')}>
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Alert Message</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  rows={4} placeholder="Describe the emergency situation in detail..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50 resize-none" />
              </div>
              <button onClick={handleSend} disabled={sending}
                className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                {sending
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Send size={16} /> Send Emergency Alert</>}
              </button>
            </div>

            <div className="glass rounded-2xl p-5">
              <h4 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Quick Templates</h4>
              <div className="space-y-2">
                {[
                  { text: 'All ICU beds are at full capacity. Please divert critical patients.', severity: 'critical', type: 'ICU Full' },
                  { text: 'O+ and O- blood urgently needed. Contact blood bank immediately.', severity: 'high', type: 'Blood Shortage' },
                  { text: 'Mass casualty event — activating emergency protocol.', severity: 'critical', type: 'Mass Casualty' },
                ].map((t, i) => (
                  <button key={i} onClick={() => setForm({ type: t.type, severity: t.severity, message: t.text })}
                    className="w-full text-left px-4 py-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/15 transition-all">
                    <div className="text-white text-xs font-medium mb-0.5">{t.type}</div>
                    <div className="text-slate-500 text-xs">{t.text}</div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="history" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-3">
            {alerts.map((alert, i) => {
              const cfg = severityConfig[alert.severity];
              return (
                <motion.div key={alert.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={'glass rounded-2xl p-5 border ' + (alert.resolved ? 'opacity-60' : '') + ' ' + cfg.bg}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={'w-10 h-10 rounded-xl ' + cfg.bg + ' flex items-center justify-center shrink-0'}>
                        <Bell size={18} className={cfg.color + (alert.resolved ? '' : ' animate-pulse')} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold text-sm">{alert.type}</span>
                          <span className={'text-xs px-2 py-0.5 rounded-full border font-medium ' + cfg.bg + ' ' + cfg.color}>
                            {cfg.label}
                          </span>
                          {alert.isSOS && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                              🚨 SOS
                            </span>
                          )}
                          {alert.resolved && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30">
                              Resolved
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-sm mt-1">{alert.message}</div>
                        {alert.phone && (
                          <a href={'tel:' + alert.phone} className="flex items-center gap-1 text-teal-400 text-xs mt-1 hover:underline">
                            <Phone size={11} /> {alert.phone}
                          </a>
                        )}
                        <div className="flex items-center gap-1 mt-2 text-xs text-slate-600">
                          <Clock size={11} /> {alert.time}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => toggleResolve(alert.id)}
                      className={'shrink-0 p-2 rounded-xl transition-all ' +
                        (alert.resolved ? 'bg-slate-500/10 text-slate-500' : 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20')}>
                      <CheckCircle size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}