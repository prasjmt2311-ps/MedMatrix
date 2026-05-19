import { motion } from 'framer-motion';
import { CheckCircle, Clock, XCircle, Truck, Flag, AlertCircle } from 'lucide-react';

const statusConfig = {
  pending:    { icon: Clock,         color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', label: 'Pending' },
  approved:   { icon: CheckCircle,   color: 'text-teal-400',   bg: 'bg-teal-500/20',   border: 'border-teal-500/30',   label: 'Approved' },
  rejected:   { icon: XCircle,       color: 'text-red-400',    bg: 'bg-red-500/20',    border: 'border-red-500/30',    label: 'Rejected' },
  'in-transit': { icon: Truck,       color: 'text-violet-400', bg: 'bg-violet-500/20', border: 'border-violet-500/30', label: 'In Transit' },
  completed:  { icon: Flag,          color: 'text-emerald-400',bg: 'bg-emerald-500/20',border: 'border-emerald-500/30',label: 'Completed' },
  cancelled:  { icon: AlertCircle,   color: 'text-slate-400',  bg: 'bg-slate-500/20',  border: 'border-slate-500/30',  label: 'Cancelled' },
};

export default function TransferTimeline({ timeline = [], currentStatus }) {
  if (!timeline.length) return null;

  return (
    <div className="space-y-0">
      {timeline.map((event, i) => {
        const cfg = statusConfig[event.status] || statusConfig.pending;
        const isLast = i === timeline.length - 1;
        return (
          <div key={i} className="flex gap-3">
            {/* Line + Icon */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={'w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ' + cfg.bg + ' ' + cfg.border}
              >
                <cfg.icon size={14} className={cfg.color} />
              </motion.div>
              {!isLast && <div className="w-0.5 h-6 bg-white/10 my-1" />}
            </div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex-1 pb-4"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className={'text-xs font-semibold capitalize ' + cfg.color}>{cfg.label}</span>
                <span className="text-slate-600 text-xs">
                  {new Date(event.timestamp).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{event.message}</p>
              {event.updatedBy && (
                <span className="text-xs text-slate-600">by {event.updatedBy}</span>
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}