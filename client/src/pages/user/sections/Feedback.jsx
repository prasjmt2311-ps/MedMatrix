import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, CheckCircle } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const categories = ['General', 'Doctor Quality', 'App Experience', 'Telemedicine', 'Support'];

export default function Feedback() {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [category, setCategory] = useState('General');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!rating) { toast.error('Please select a rating'); return; }
    if (!message.trim()) { toast.error('Please write a message'); return; }
    setLoading(true);
    try {
      await api.post('/user/feedback', { rating, message, category });
      setSubmitted(true);
      toast.success('Thank you for your feedback!');
    } catch {
      toast.error('Failed to submit. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mb-4">
          <CheckCircle size={28} className="text-teal-400" />
        </div>
        <h3 className="text-white font-bold text-xl mb-2">Feedback Submitted!</h3>
        <p className="text-slate-400 text-sm max-w-sm">Your feedback helps us improve MedMatrix for everyone. Thank you!</p>
        <button
          onClick={() => { setSubmitted(false); setRating(0); setMessage(''); }}
          className="mt-6 px-5 py-2.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 text-sm hover:bg-teal-500/25 transition-all"
        >
          Submit Another
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <p className="text-slate-400 text-sm">Your feedback directly helps us improve MedMatrix.</p>

      {/* Star Rating */}
      <div className="glass rounded-2xl p-6 text-center">
        <h3 className="text-white font-semibold mb-4">How would you rate your experience?</h3>
        <div className="flex justify-center gap-3">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={36}
                className={'transition-colors ' + ((hovered || rating) >= star ? 'text-yellow-400' : 'text-slate-700')}
                fill={(hovered || rating) >= star ? '#facc15' : 'transparent'}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-slate-400 text-sm mt-3"
          >
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][rating]}
          </motion.p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="text-xs text-slate-400 font-medium mb-2 block uppercase tracking-wider">Feedback Category</label>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={'px-3 py-1.5 rounded-xl text-sm transition-all ' +
                (category === c
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="text-xs text-slate-400 font-medium mb-2 block uppercase tracking-wider">Your Message</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={5}
          placeholder="Tell us about your experience, what we can improve, or what you love about MedMatrix..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 transition-colors resize-none"
        />
        <div className="text-right text-xs text-slate-600 mt-1">{message.length}/500</div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 text-slate-900 font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading
          ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          : <><Send size={16} /> Submit Feedback</>
        }
      </button>
    </div>
  );
}