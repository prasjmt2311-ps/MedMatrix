import { motion } from 'framer-motion';
import { BedDouble, Brain, Ambulance, Stethoscope, MapPin, Clock, Star, ArrowRight, CheckCircle } from 'lucide-react';

const priorityConfig = {
  'Highly Recommended': { color: 'text-teal-400', bg: 'bg-teal-500/15 border-teal-500/30' },
  'Recommended':        { color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/30' },
  'Available':          { color: 'text-slate-400', bg: 'bg-slate-500/15 border-slate-500/30' },
};

export default function HospitalCompareCard({ rec, index, onSelect, selected }) {
  const cfg = priorityConfig[rec.priority] || priorityConfig['Available'];
  const r = rec.hospital.resources;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={() => onSelect(rec)}
      className={'glass rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-1 ' +
        (selected ? 'border-teal-500/40 ring-1 ring-teal-500/20' : 'hover:border-white/20')}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">{rec.hospital.name}</span>
            {index === 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 font-semibold">
                Best Match
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
            <MapPin size={10} /> {rec.hospital.city}
            {rec.distanceKm && <span className="ml-1">• {rec.distanceKm} km</span>}
          </div>
        </div>
        <span className={'text-xs px-2.5 py-1 rounded-full border font-medium ' + cfg.bg + ' ' + cfg.color}>
          {rec.priority}
        </span>
      </div>

      {/* Score bar */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-slate-500">Match Score</span>
          <span className={'text-xs font-bold ' + cfg.color}>{rec.score}/100</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: Math.min(rec.score, 100) + '%' }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400"
          />
        </div>
      </div>

      {/* Resources */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { icon: BedDouble, value: r.availableBeds, label: 'Beds', color: 'text-teal-400' },
          { icon: Brain, value: r.availableIcuBeds, label: 'ICU', color: 'text-violet-400' },
          { icon: Ambulance, value: r.availableAmbulances, label: 'Amb', color: 'text-orange-400' },
          { icon: Stethoscope, value: r.availableDoctors, label: 'Docs', color: 'text-emerald-400' },
        ].map((item, i) => (
          <div key={i} className="text-center bg-white/3 rounded-xl p-2">
            <item.icon size={14} className={'mx-auto mb-0.5 ' + item.color} />
            <div className={'text-sm font-bold ' + item.color}>{item.value ?? 0}</div>
            <div className="text-xs text-slate-600">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Reasons */}
      <div className="space-y-1 mb-3">
        {rec.reasons.slice(0, 3).map((reason, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
            <CheckCircle size={10} className="text-teal-400 shrink-0" />
            {reason}
          </div>
        ))}
      </div>

      {/* ETA + Select */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Clock size={11} />
          <span>ETA: {rec.estimatedArrival}</span>
        </div>
        <button className={'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ' +
          (selected
            ? 'bg-teal-500 text-slate-900'
            : 'bg-teal-500/15 border border-teal-500/30 text-teal-400 hover:bg-teal-500/25'
          )}
        >
          {selected ? <CheckCircle size={12} /> : <ArrowRight size={12} />}
          {selected ? 'Selected' : 'Select'}
        </button>
      </div>
    </motion.div>
  );
}