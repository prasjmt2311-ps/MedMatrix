import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  X
} from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const statusConfig = {
  confirmed: {
    icon: CheckCircle,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
    label: 'Confirmed'
  },
  pending: {
    icon: AlertCircle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    label: 'Pending'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10 border-slate-500/20',
    label: 'Completed'
  },
  cancelled: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    label: 'Cancelled'
  }
};

export default function Appointments() {
  const [filter, setFilter] = useState('all');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    doctorName: '',
    specialty: '',
    hospitalName: '',
    date: '',
    time: '',
    reason: ''
  });

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await api.get('/appointments/my');
        setAppointments(data);
      } catch (err) {
        console.error('APPOINTMENTS ERROR:', err);
        toast.error('Unable to load appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const filtered =
    filter === 'all'
      ? appointments
      : appointments.filter((a) => a.status === filter);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();

    if (
      !form.doctorName ||
      !form.specialty ||
      !form.date ||
      !form.time
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const { data } = await api.post('/appointments', form);

      setAppointments((prev) => [...prev, data.appointment]);

      setForm({
        doctorName: '',
        specialty: '',
        hospitalName: '',
        date: '',
        time: '',
        reason: ''
      });

      setShowForm(false);
      toast.success('Appointment booked successfully');
    } catch (err) {
      console.error('BOOK APPOINTMENT ERROR:', err);
      toast.error(
        err.response?.data?.message ||
        'Unable to book appointment'
      );
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-12 text-center text-slate-400">
        Loading appointments...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Filter Tabs + New Button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {[
            'all',
            'confirmed',
            'pending',
            'completed',
            'cancelled'
          ].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                'px-3 py-1.5 rounded-xl text-xs capitalize transition-all ' +
                (filter === f
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white')
              }
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 text-sm hover:bg-teal-500/25 transition-all"
        >
          <Plus size={14} />
          New
        </button>
      </div>

      {/* Calendar Strip */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={16} className="text-teal-400" />
          <span className="text-white text-sm font-medium">
            Appointments Calendar
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 14 }, (_, i) => {
            const day = i + 1;

            const hasAppt = appointments.some((a) => {
              if (!a.date) return false;
              return new Date(a.date).getDate() === day;
            });

            return (
              <div
                key={day}
                className={
                  'shrink-0 w-12 h-14 rounded-xl flex flex-col items-center justify-center text-xs cursor-pointer transition-all ' +
                  (hasAppt
                    ? 'bg-teal-500/20 border border-teal-500/30 text-teal-400'
                    : 'bg-white/5 border border-white/5 text-slate-500 hover:bg-white/10')
                }
              >
                <span className="text-xs text-slate-500">
                  {[
                    'S',
                    'M',
                    'T',
                    'W',
                    'T',
                    'F',
                    'S'
                  ][(day + 2) % 7]}
                </span>

                <span className="font-bold mt-0.5">
                  {day}
                </span>

                {hasAppt && (
                  <span className="w-1 h-1 rounded-full bg-teal-400 mt-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Appointment List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-slate-500">
            No appointments found.
          </div>
        ) : (
          filtered.map((appt, i) => {
            const s =
              statusConfig[appt.status] ||
              statusConfig.pending;

            return (
              <motion.div
                key={appt._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass rounded-2xl p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">

                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center text-white font-bold text-sm">
                    {appt.doctorName
                      ?.split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2) || 'DR'}
                  </div>

                  <div>
                    <div className="text-white font-semibold text-sm">
                      {appt.doctorName}
                    </div>

                    <div className="text-slate-500 text-xs">
                      {appt.specialty}
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar size={11} />
                        {new Date(appt.date).toLocaleDateString()}
                      </span>

                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={11} />
                        {appt.time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {appt.fee ? (
                    <div className="text-right">
                      <div className="text-white font-bold text-sm">
                        ₹{appt.fee}
                      </div>
                    </div>
                  ) : null}

                  <span
                    className={
                      'text-xs px-2.5 py-1 rounded-full border font-medium ' +
                      s.bg +
                      ' ' +
                      s.color
                    }
                  >
                    {s.label}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Book Appointment Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Book Appointment
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Enter appointment details
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleBookAppointment}
              className="space-y-4"
            >

              <div>
                <label className="text-xs text-slate-400">
                  Doctor Name *
                </label>

                <input
                  name="doctorName"
                  value={form.doctorName}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Priya Sharma"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-teal-500/50"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">
                  Specialty *
                </label>

                <input
                  name="specialty"
                  value={form.specialty}
                  onChange={handleChange}
                  placeholder="e.g. Cardiologist"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-teal-500/50"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">
                  Hospital
                </label>

                <input
                  name="hospitalName"
                  value={form.hospitalName}
                  onChange={handleChange}
                  placeholder="Hospital name"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="text-xs text-slate-400">
                    Date *
                  </label>

                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400">
                    Time *
                  </label>

                  <input
                    type="time"
                    name="time"
                    value={form.time}
                    onChange={handleChange}
                    className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none"
                  />
                </div>

              </div>

              <div>
                <label className="text-xs text-slate-400">
                  Reason for Visit
                </label>

                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  placeholder="Briefly describe your reason for consultation"
                  rows="3"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-teal-500 text-slate-950 font-semibold text-sm hover:bg-teal-400 transition-all"
              >
                Book Appointment
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}