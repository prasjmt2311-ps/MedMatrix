import { useState, useEffect, useRef } from 'react';
import SOSButton from '../components/common/SOSButton';
import ThemeToggle from '../components/common/ThemeToggle';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Heart, Ambulance, BedDouble, Stethoscope, Brain, MapPin,
  Video, Shield, ChevronDown, ChevronUp, Star, Menu, X,
  ArrowRight, Zap, Activity, Users, Building2, Phone,
  Mail, MessageSquare, Play, CheckCircle
} from 'lucide-react';

/* ─────────────────────────────────────────
   NAVBAR
───────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

//   const navLinks = ['Features', 'Benefits', 'Testimonials', 'FAQ', 'Demo'];

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ' +
        (scrolled ? 'glass border-b border-white/5 py-3 topbar-panel' : 'py-5')}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center">
            <Heart size={18} className="text-white" fill="white" />
          </div>
          <span className="text-xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
            Med<span className="gradient-text">Matrix</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-400 hover:text-teal-400 transition-colors duration-200">Features</a>
            <a href="#benefits" className="text-sm text-slate-400 hover:text-teal-400 transition-colors duration-200">Benefits</a>
            <a href="#testimonials" className="text-sm text-slate-400 hover:text-teal-400 transition-colors duration-200">Testimonials</a>
            <a href="#faq" className="text-sm text-slate-400 hover:text-teal-400 transition-colors duration-200">FAQ</a>
            <a href="#demo" className="text-sm text-slate-400 hover:text-teal-400 transition-colors duration-200">Demo</a>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 text-slate-900 hover:opacity-90 transition-opacity"
          >
            Get Started
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/5 px-6 py-4 flex flex-col gap-4"
          >
            <a href="#features" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-teal-400 transition-colors">Features</a>
            <a href="#benefits" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-teal-400 transition-colors">Benefits</a>
            <a href="#testimonials" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-teal-400 transition-colors">Testimonials</a>
            <a href="#faq" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-teal-400 transition-colors">FAQ</a>
            <a href="#demo" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-teal-400 transition-colors">Demo</a>
            <div className="flex gap-3 pt-2">
              <button onClick={() => navigate('/login')} className="flex-1 py-2 text-sm border border-white/10 rounded-xl text-slate-300">Sign In</button>
              <button onClick={() => navigate('/signup')} className="flex-1 py-2 text-sm bg-teal-500 rounded-xl text-slate-900 font-semibold">Sign Up</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ─────────────────────────────────────────
   HERO SECTION
───────────────────────────────────────── */
function Hero() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, -120]);

  const handleSOS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => {
        toast.error('🚨 SOS Alert Sent! Emergency services notified.', { duration: 4000 });
      }, () => {
        toast.error('🚨 SOS Sent! (Enable location for better response)', { duration: 4000 });
      });
    } else {
      toast.error('🚨 SOS Alert Sent!', { duration: 4000 });
    }
  };

  const stats = [
    { value: '500+', label: 'Hospitals', icon: Building2 },
    { value: '50K+', label: 'Patients Served', icon: Users },
    { value: '98%', label: 'Uptime', icon: Activity },
    { value: '< 2min', label: 'Avg Response', icon: Zap },
  ];

  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-24 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-teal-500/12 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-violet-500/12 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-teal-500/5 rounded-full blur-[120px]" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,212,170,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <motion.div style={{ y }} className="max-w-7xl mx-auto px-6 relative">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <span className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase border border-teal-500/30 text-teal-400 bg-teal-500/5">
            🏥 Healthcare Reimagined
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="text-center text-5xl md:text-7xl font-extrabold leading-tight text-white mb-6"
        >
          One Platform for<br />
          <span className="gradient-text">All Your Care</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-center text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10"
        >
          Simplify hospital admissions, track real-time bed availability, consult doctors instantly,
          and manage health insurance — all in one place.
        </motion.p>

        {/* CTA Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <button
            onClick={() => navigate('/signup/user')}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-400 text-slate-900 font-bold text-lg hover:opacity-90 transition-all flex items-center gap-2 glow-teal"
          >
            Start Free <ArrowRight size={20} />
          </button>

          {/* SOS Button */}
          <SOSButton variant="inline" />
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="glass rounded-2xl p-4 text-center"
            >
              <stat.icon size={20} className="text-teal-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
      >
        <span className="text-xs text-slate-600">scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown size={16} className="text-slate-600" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────
   FEATURES SECTION
───────────────────────────────────────── */
function Features() {
  const features = [
    { icon: BedDouble, title: 'Real-Time Bed Tracking', desc: 'Live updates on ICU, general, and emergency bed availability across all connected hospitals.', color: 'text-teal-400', bg: 'bg-teal-500/10' },
    { icon: Ambulance, title: 'Ambulance Dispatch', desc: 'Track and request ambulances in real-time. Know ETA before the emergency escalates.', color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { icon: Video, title: 'Telemedicine', desc: 'HD video consultations with verified doctors from home. Powered by WebRTC technology.', color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { icon: Brain, title: 'AI Health Assistant', desc: 'Ask health questions, get instant guidance, and translate medical reports in English & Hindi.', color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { icon: MapPin, title: 'Hospital Locator', desc: 'Find nearest hospitals with available resources on an interactive live map.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: Shield, title: 'Insurance Management', desc: 'Manage health insurance claims and agreements digitally without paperwork hassles.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <section id="features" className="py-28 relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs uppercase tracking-widest text-teal-400 font-semibold">What We Offer</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-3">
            Built for <span className="gradient-text">Modern Healthcare</span>
          </h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto">
            Every feature designed to save time, reduce friction, and ultimately — save lives.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="glass rounded-2xl p-6 group cursor-default"
            >
              <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon size={22} className={f.color} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   BENEFITS SECTION
───────────────────────────────────────── */
function Benefits() {
  const benefits = [
    'Instant hospital admission pre-approval',
    'Zero paperwork with digital agreements',
    'Real-time doctor availability tracking',
    'Secure health record management',
    'Multi-language support (EN + HI)',
    'HIPAA-inspired data privacy standards',
    'Calendar sync for appointments',
    '24/7 AI-powered health assistance',
  ];

  return (
    <section id="benefits" className="py-28 relative overflow-hidden">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-xs uppercase tracking-widest text-teal-400 font-semibold">Why MedMatrix</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-6">
              Healthcare that<br /><span className="gradient-text">works for you</span>
            </h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              We built MedMatrix because healthcare shouldn't be complicated. 
              Whether you're a patient in distress or a hospital managing hundreds of beds — 
              one platform handles it all.
            </p>
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 text-slate-900 font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
              See How It Works <ArrowRight size={18} />
            </button>
          </motion.div>

          {/* Right - Checklist */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-3"
          >
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="glass rounded-xl px-5 py-3 flex items-center gap-3"
              >
                <CheckCircle size={18} className="text-teal-400 shrink-0" />
                <span className="text-slate-300 text-sm">{b}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   TESTIMONIALS SECTION
───────────────────────────────────────── */
function Testimonials() {
  const [active, setActive] = useState(0);
  const testimonials = [
    { name: 'Dr. Priya Sharma', role: 'Cardiologist, AIIMS Delhi', text: 'MedMatrix transformed how we manage patient admissions. Real-time bed tracking alone saves us hours every day.', stars: 5 },
    { name: 'Rahul Mehta', role: 'Patient, Mumbai', text: 'During my father\'s cardiac emergency, I found an ICU bed in under 3 minutes using MedMatrix. It literally saved his life.', stars: 5 },
    { name: 'Admin, Apollo Hospitals', role: 'Hospital Management', text: 'The hospital dashboard gives us complete control over resources. Patient transfer approvals have never been smoother.', stars: 5 },
    { name: 'Ananya Singh', role: 'Patient, Bangalore', text: 'The telemedicine feature is brilliant. Consulted a specialist from home, got a prescription — zero travel, zero wait time.', stars: 5 },
  ];

  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % testimonials.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="testimonials" className="py-28">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs uppercase tracking-widest text-teal-400 font-semibold">Testimonials</span>
          <h2 className="text-4xl font-bold text-white mt-3">Trusted by <span className="gradient-text">thousands</span></h2>
        </motion.div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="glass rounded-3xl p-8 md:p-12 text-center"
            >
              <div className="flex justify-center mb-4">
                {[...Array(testimonials[active].stars)].map((_, i) => (
                  <Star key={i} size={18} className="text-yellow-400" fill="#facc15" />
                ))}
              </div>
              <p className="text-slate-300 text-lg md:text-xl leading-relaxed mb-8 italic">
                "{testimonials[active].text}"
              </p>
              <div>
                <div className="text-white font-semibold">{testimonials[active].name}</div>
                <div className="text-slate-500 text-sm">{testimonials[active].role}</div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-2 rounded-full transition-all ${i === active ? 'w-6 bg-teal-400' : 'w-2 bg-slate-600'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   FAQ SECTION
───────────────────────────────────────── */
function FAQ() {
  const [open, setOpen] = useState(null);
  const faqs = [
    { q: 'Is MedMatrix free to use?', a: 'Yes! Basic features are completely free. Premium features like advanced analytics are available for hospitals at affordable pricing.' },
    { q: 'How accurate is real-time bed availability?', a: 'Bed availability is updated every 60 seconds directly from hospital management systems. Accuracy depends on hospital integration status.' },
    { q: 'Can I use telemedicine without registration?', a: 'No — registration ensures your medical history is maintained securely and doctors can access your profile during consultations.' },
    { q: 'Is my health data safe?', a: 'Absolutely. All data is encrypted in transit and at rest. We follow HIPAA-inspired data privacy principles and never sell user data.' },
    { q: 'How does the SOS button work?', a: 'One tap shares your GPS location with the nearest connected hospitals and dispatches an emergency alert to available ambulances.' },
    { q: 'Does the AI support Hindi?', a: 'Yes! Our Gemini-powered AI assistant fully supports English ↔ Hindi, including medical report translation.' },
  ];

  return (
    <section id="faq" className="py-28">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs uppercase tracking-widest text-teal-400 font-semibold">FAQ</span>
          <h2 className="text-4xl font-bold text-white mt-3">Common <span className="gradient-text">Questions</span></h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="glass rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className="text-white font-medium">{faq.q}</span>
                {open === i
                  ? <ChevronUp size={18} className="text-teal-400 shrink-0" />
                  : <ChevronDown size={18} className="text-slate-500 shrink-0" />}
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="px-6 pb-5 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   WATCH DEMO SECTION
───────────────────────────────────────── */
function WatchDemo() {
  const [playing, setPlaying] = useState(false);

  return (
    <section id="demo" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-950/20 to-transparent pointer-events-none" />
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs uppercase tracking-widest text-teal-400 font-semibold">Watch Demo</span>
          <h2 className="text-4xl font-bold text-white mt-3">
            See it in <span className="gradient-text">action</span>
          </h2>
          <p className="text-slate-400 mt-4">A 2-minute walkthrough of everything MedMatrix can do.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden glass aspect-video flex items-center justify-center group cursor-pointer"
          onClick={() => setPlaying(!playing)}
        >
          {/* Demo placeholder — replace src with real video URL */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900/30 to-violet-900/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm"
            >
              <Play size={32} className="text-white ml-1" fill="white" />
            </motion.div>
          </div>
          <div className="absolute bottom-6 left-6 text-left">
            <div className="text-white font-semibold text-lg">MedMatrix Full Demo</div>
            <div className="text-slate-400 text-sm">2:14 • Healthcare Platform Overview</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   FOOTER
───────────────────────────────────────── */
function Footer() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill all fields');
      return;
    }
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setForm({ name: '', email: '', message: '' });
    toast.success('Message sent! We\'ll get back to you soon.');
  };

  return (
    <footer className="border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 mb-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center">
                <Heart size={16} className="text-white" fill="white" />
              </div>
              <span className="text-lg font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                Med<span className="gradient-text">Matrix</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Simplifying healthcare for patients and hospitals across India.
            </p>
            <div className="flex gap-3 mt-6">
              {['Twitter', 'LinkedIn', 'GitHub'].map(s => (
                <span key={s} className="text-xs text-slate-600 hover:text-teal-400 cursor-pointer transition-colors">{s}</span>
              ))}
            </div>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <div className="space-y-2">
              {['Help Center', 'Privacy Policy', 'Terms of Service', 'Contact Us', 'Status Page'].map(l => (
                <div key={l} className="text-slate-500 hover:text-teal-400 text-sm cursor-pointer transition-colors">{l}</div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div id="contact">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <MessageSquare size={16} className="text-teal-400" /> Send us a Message
            </h4>
            <div className="space-y-3">
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 transition-colors"
              />
              <input
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="Email address"
                type="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 transition-colors"
              />
              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Your message..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 transition-colors resize-none"
              />
              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full py-2.5 rounded-xl bg-teal-500 text-slate-900 font-semibold text-sm hover:bg-teal-400 transition-colors disabled:opacity-60"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-slate-600 text-sm">© 2026 MedMatrix. All rights reserved.</span>
          <span className="text-slate-600 text-sm flex items-center gap-1">
            Built with <Heart size={12} className="text-red-500" fill="#ef4444" /> for better healthcare
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────── */
export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <Benefits />
      <Testimonials />
      <FAQ />
      <WatchDemo />
      <Footer />
    </div>
  );
}