import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

export default function HospitalAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchHospitalAppointments = async () => {
    try {
      const { data } = await api.get('/appointments/hospital');
      setAppointments(data);
    } catch (err) {
      console.error('HOSPITAL APPOINTMENTS ERROR:', err);
      toast.error('Unable to fetch hospital appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalAppointments();
  }, []);

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    let fee = null;

    if (newStatus === 'confirmed') {
      const enteredFee = window.prompt('Set consultation fee for this patient (₹):', '500');
      if (enteredFee === null) return;
      fee = Number(enteredFee) || 0;
    }

    try {
      const payload = { status: newStatus };
      if (fee !== null) payload.fee = fee;

      // Changed from api.patch to api.put to prevent CORS preflight blocks
      const { data } = await api.put(`/appointments/${appointmentId}/status`, payload);
      toast.success(`Appointment marked as ${newStatus}`);

      setAppointments((prev) =>
        prev.map((a) => (a._id === appointmentId ? data.appointment : a))
      );
    } catch (err) {
      console.error('STATUS UPDATE ERROR:', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const filtered =
    filter === 'all'
      ? appointments
      : appointments.filter((a) => a.status === filter);

  if (loading) {
    return <div className="text-slate-400 p-8 text-center">Loading appointments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Patient Appointment Requests</h2>
        <div className="flex gap-2">
          {['all', 'pending', 'confirmed', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs capitalize transition-all ${
                filter === f
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-12 text-center text-slate-500">
            No appointments found.
          </div>
        ) : (
          filtered.map((appt) => (
            <div
              key={appt._id}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-semibold text-base">
                    {appt.patient?.name || 'Walk-in Patient'}
                  </span>
                  <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                    ID: {appt.patientId}
                  </span>
                </div>
                <div className="text-slate-400 text-xs mt-1">
                  Doctor: <strong className="text-slate-200">{appt.doctorName}</strong> ({appt.specialty})
                </div>
                {appt.reason && (
                  <div className="text-slate-400 text-xs mt-1">
                    Reason: <span className="text-slate-300 italic">{appt.reason}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-teal-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> {new Date(appt.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> {appt.time}
                  </span>
                  {appt.fee > 0 && (
                    <span className="text-emerald-400 font-semibold">₹{appt.fee}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${
                    appt.status === 'confirmed'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : appt.status === 'cancelled'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                  }`}
                >
                  {appt.status}
                </span>

                {appt.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusUpdate(appt._id, 'confirmed')}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium transition-all"
                    >
                      Approve &amp; Set Fee
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(appt._id, 'cancelled')}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-medium transition-all"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}