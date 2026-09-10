import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Building2, Mail, Lock, Phone, MapPin, Hash, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function HospitalSignup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    hospitalName: '', email: '', password: '', phone: '',
    address: '', city: '', state: '', pincode: '', registrationNumber: ''
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = ['hospitalName', 'email', 'password', 'phone', 'address', 'city', 'state', 'pincode', 'registrationNumber'];
    for (const field of required) {
      if (!form[field]) {
        toast.error('Please fill all required fields');
        return;
      }
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register/hospital', form);
      login(data.token, data.user, data.role);
      toast.success('Hospital registered! Welcome to MedMatrix.');
      navigate('/hospital/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition-colors";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
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
            Register Hospital
          </h1>
          <p className="text-slate-400 text-sm text-center mb-8">Join MedMatrix as a Healthcare Provider</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hospital Name */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Hospital Name *</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input name="hospitalName" value={form.hospitalName} onChange={handleChange}
                  placeholder="City General Hospital"
                  className={inputClass + " pl-10 pr-4"} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Official Email *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="admin@hospital.com"
                  className={inputClass + " pl-10 pr-4"} />
              </div>
            </div>

            {/* Phone + Reg Number */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1.5 block">Phone *</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="0326-XXXXXX"
                    className={inputClass + " pl-10 pr-3"} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1.5 block">Reg. Number *</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input name="registrationNumber" value={form.registrationNumber} onChange={handleChange} placeholder="MCI-XXXXXX"
                    className={inputClass + " pl-10 pr-3"} />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Street Address *</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input name="address" value={form.address} onChange={handleChange} placeholder="123 Medical Avenue"
                  className={inputClass + " pl-10 pr-4"} />
              </div>
            </div>

            {/* City, State, Pincode */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1.5 block">City *</label>
                <input name="city" value={form.city} onChange={handleChange} placeholder="Dhanbad"
                  className={inputClass + " px-3"} />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1.5 block">State *</label>
                <input name="state" value={form.state} onChange={handleChange} placeholder="Jharkhand"
                  className={inputClass + " px-3"} />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1.5 block">Pincode *</label>
                <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="826001"
                  className={inputClass + " px-3"} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Password *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange}
                  placeholder="Min 6 characters"
                  className={inputClass + " pl-10 pr-10"} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-teal-500 text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <> Register Hospital <ArrowRight size={16} /> </>}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Already registered?{' '}
            <Link to="/login" className="text-teal-400 hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}