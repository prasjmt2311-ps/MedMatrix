import { motion } from 'framer-motion';
import { Heart, Droplets, Moon, Zap, TrendingUp, Apple, Activity } from 'lucide-react';
import { useState } from 'react';

const tips = [
  { icon: Droplets, title: 'Stay Hydrated', desc: 'Drink 8 glasses of water daily. Track intake to stay consistent.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: Moon, title: 'Sleep Well', desc: '7-9 hours of quality sleep improves immMed and mental health.', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { icon: Apple, title: 'Eat Balanced', desc: 'Include fruits, vegetables, and proteins in every meal.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: Activity, title: 'Stay Active', desc: '30 minutes of exercise daily reduces chronic disease risk by 50%.', color: 'text-teal-400', bg: 'bg-teal-500/10' },
];

const metrics = [
  { label: 'Steps Today', value: '6,842', goal: '10,000', percent: 68, color: 'bg-teal-500' },
  { label: 'Water Intake', value: '1.8L', goal: '2.5L', percent: 72, color: 'bg-blue-500' },
  { label: 'Sleep Quality', value: '7.2h', goal: '8h', percent: 90, color: 'bg-violet-500' },
  { label: 'Active Minutes', value: '24 min', goal: '30 min', percent: 80, color: 'bg-emerald-500' },
];

export default function Wellness() {
  const [bmi, setBmi] = useState({ height: '', weight: '' });
  const [bmiResult, setBmiResult] = useState(null);

  const calcBMI = () => {
    const h = parseFloat(bmi.height) / 100;
    const w = parseFloat(bmi.weight);
    if (!h || !w) return;
    const result = (w / (h * h)).toFixed(1);
    let category = result < 18.5 ? 'Underweight' : result < 25 ? 'Normal' : result < 30 ? 'Overweight' : 'Obese';
    setBmiResult({ value: result, category });
  };

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div>
        <h3 className="text-slate-400 text-sm font-medium mb-4 uppercase tracking-wider">Today's Health Metrics</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {metrics.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">{m.label}</span>
                <span className="text-white font-bold text-sm">{m.value}</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: m.percent + '%' }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className={'h-full rounded-full ' + m.color}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-slate-600">{m.percent}% of goal</span>
                <span className="text-xs text-slate-600">Goal: {m.goal}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* BMI Calculator */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Heart size={18} className="text-teal-400" /> BMI Calculator
        </h3>
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="text-xs text-slate-400 mb-1.5 block">Height (cm)</label>
            <input
              type="number"
              value={bmi.height}
              onChange={e => setBmi({ ...bmi, height: e.target.value })}
              placeholder="e.g. 170"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-400 mb-1.5 block">Weight (kg)</label>
            <input
              type="number"
              value={bmi.weight}
              onChange={e => setBmi({ ...bmi, weight: e.target.value })}
              placeholder="e.g. 65"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
            />
          </div>
        </div>
        <button
          onClick={calcBMI}
          className="px-5 py-2.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 text-sm font-medium hover:bg-teal-500/25 transition-all"
        >
          Calculate BMI
        </button>
        {bmiResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <span className="text-slate-400 text-sm">Your BMI: </span>
            <span className="text-white font-bold text-xl">{bmiResult.value}</span>
            <span className="ml-3 text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400">{bmiResult.category}</span>
          </motion.div>
        )}
      </div>

      {/* Wellness Tips */}
      <div>
        <h3 className="text-slate-400 text-sm font-medium mb-4 uppercase tracking-wider">Wellness Tips</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {tips.map((tip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-4 flex gap-4"
            >
              <div className={'w-10 h-10 rounded-xl ' + tip.bg + ' flex items-center justify-center shrink-0'}>
                <tip.icon size={18} className={tip.color} />
              </div>
              <div>
                <div className="text-white font-medium text-sm mb-1">{tip.title}</div>
                <div className="text-slate-400 text-xs leading-relaxed">{tip.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}