import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, User, Mail, Lock, Phone, Droplets, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function UserSignup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
  name: '',
  email: '',
  password: '',
  phone: '',
  bloodGroup: 'O+',
  address: '',
  dateOfBirth: '',
  gender: 'Other',
  city: '',
  state: '',
  pincode: '',
  emergencyContact: {
    name: '',
    phone: '',
    relationship: ''
  },
  allergies: '',
  medicalConditions: '',
  currentMedications: '',
  previousSurgeries: ''
});;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
   if (
  !form.name ||
  !form.email ||
  !form.password ||
  !form.phone ||
  !form.address
) {
  toast.error('Please fill all required fields');
  return;
}
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
     const submitData = {
  ...form,
  allergies: form.allergies
    ? form.allergies.split(',').map(item => item.trim()).filter(Boolean)
    : [],
  medicalConditions: form.medicalConditions
    ? form.medicalConditions.split(',').map(item => item.trim()).filter(Boolean)
    : [],
  currentMedications: form.currentMedications
    ? form.currentMedications.split(',').map(item => item.trim()).filter(Boolean)
    : [],
  previousSurgeries: form.previousSurgeries
    ? form.previousSurgeries.split(',').map(item => item.trim()).filter(Boolean)
    : []
};

const { data } = await api.post('/auth/register/user', submitData);
      login(data.token, data.user, data.role);
     toast.success(`Account created! Your Patient ID is ${data.user.patientId}`);

navigate('/user/dashboard', {
  state: {
    patientId: data.user.patientId
  }
});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center">
            <Heart size={20} className="text-white" fill="white" />
          </div>
          <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
            Med<span style={{ background: 'linear-gradient(135deg, #00d4aa, #7c6aff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Matrix</span>
          </span>
        </Link>

        <div className="bg-white/4 backdrop-blur-xl border border-white/8 rounded-3xl p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
            Create Account
          </h1>
          <p className="text-slate-400 text-sm text-center mb-8">Join MedMatrix as a Patient</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Full Name *</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input name="name" value={form.name} onChange={handleChange} placeholder="Ankit Kumar"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition-colors" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Email Address *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition-colors" />
              </div>
            </div>

            {/* Phone + Blood Group row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1.5 block">Phone *</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1.5 block">Blood Group</label>
                <div className="relative">
                  <Droplets size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-sm text-white focus:outline-none focus:border-teal-500/60 transition-colors appearance-none">
                    {bloodGroups.map(bg => <option key={bg} value={bg} className="bg-slate-900">{bg}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Password *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Min 6 characters"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition-colors" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {/* Date of Birth + Gender */}
<div className="grid grid-cols-2 gap-3">
  <div>
    <label className="text-xs text-slate-400 font-medium mb-1.5 block">
      Date of Birth
    </label>
    <input
      name="dateOfBirth"
      type="date"
      value={form.dateOfBirth}
      onChange={handleChange}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500/60 transition-colors"
    />
  </div>

  <div>
    <label className="text-xs text-slate-400 font-medium mb-1.5 block">
      Gender
    </label>
    <select
      name="gender"
      value={form.gender}
      onChange={handleChange}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500/60 transition-colors"
    >
      <option value="Male" className="bg-slate-900">Male</option>
      <option value="Female" className="bg-slate-900">Female</option>
      <option value="Other" className="bg-slate-900">Other</option>
    </select>
  </div>
</div>
           {/* Address */}
<div>
  <label className="text-xs text-slate-400 font-medium mb-1.5 block">
    Full Address *
  </label>
  <input
    name="address"
    value={form.address}
    onChange={handleChange}
    placeholder="House no., Street, Area"
    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition-colors"
  />
</div>

{/* City + State + Pincode */}
<div className="grid grid-cols-3 gap-3">
  <div>
    <label className="text-xs text-slate-400 font-medium mb-1.5 block">
      City
    </label>
    <input
      name="city"
      value={form.city}
      onChange={handleChange}
      placeholder="Gorakhpur"
      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/60"
    />
  </div>

  <div>
    <label className="text-xs text-slate-400 font-medium mb-1.5 block">
      State
    </label>
    <input
      name="state"
      value={form.state}
      onChange={handleChange}
      placeholder="UP"
      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/60"
    />
  </div>

  <div>
    <label className="text-xs text-slate-400 font-medium mb-1.5 block">
      Pincode
    </label>
    <input
      name="pincode"
      value={form.pincode}
      onChange={handleChange}
      placeholder="273001"
      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/60"
    />
  </div>
</div>
{/* Emergency Contact */}
<div className="pt-2">
  <p className="text-sm font-semibold text-white mb-3">
    Emergency Contact
  </p>

  <div className="space-y-3">
    <input
      name="emergencyName"
      value={form.emergencyContact.name}
      onChange={(e) =>
        setForm({
          ...form,
          emergencyContact: {
            ...form.emergencyContact,
            name: e.target.value
          }
        })
      }
      placeholder="Contact person's name"
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/60"
    />

    <div className="grid grid-cols-2 gap-3">
      <input
        name="emergencyPhone"
        value={form.emergencyContact.phone}
        onChange={(e) =>
          setForm({
            ...form,
            emergencyContact: {
              ...form.emergencyContact,
              phone: e.target.value
            }
          })
        }
        placeholder="Phone number"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/60"
      />

      <input
        name="emergencyRelationship"
        value={form.emergencyContact.relationship}
        onChange={(e) =>
          setForm({
            ...form,
            emergencyContact: {
              ...form.emergencyContact,
              relationship: e.target.value
            }
          })
        }
        placeholder="Relationship"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/60"
      />
    </div>
  </div>
</div>
{/* Medical Information */}
<div className="pt-2 space-y-3">
  <p className="text-sm font-semibold text-white">
    Medical Information
  </p>

  <input
    name="allergies"
    value={form.allergies}
    onChange={handleChange}
    placeholder="Allergies (e.g. Penicillin, Dust) — if none, write None"
    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/60"
  />

  <input
    name="medicalConditions"
    value={form.medicalConditions}
    onChange={handleChange}
    placeholder="Existing medical conditions — if none, write None"
    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/60"
  />

  <input
    name="currentMedications"
    value={form.currentMedications}
    onChange={handleChange}
    placeholder="Current medications — if none, write None"
    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/60"
  />

  <input
    name="previousSurgeries"
    value={form.previousSurgeries}
    onChange={handleChange}
    placeholder="Previous surgeries — if none, write None"
    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/60"
  />
</div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 text-slate-900 font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                : <> Create Account <ArrowRight size={16} /> </>}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-400 hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}