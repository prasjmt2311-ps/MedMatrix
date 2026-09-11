import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../../components/common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Stethoscope, Calendar, Video, UserRound,
  Map, PartyPopper, Heart, MessageSquare,
  LogOut, Menu, ChevronRight, Truck, MapPin
} from 'lucide-react';

import Overview from './sections/Overview';
import Consultation from './sections/Consultation';
import toast from 'react-hot-toast';
import MyHealthProfile from './sections/MyHealthProfile';
import OnlineConsultation from './sections/OnlineConsultation';
import Appointments from './sections/Appointments';
import Telemedicine from './sections/Telemedicine';
import SmartTransfer from './sections/SmartTransfer';
import ReportMap from './sections/ReportMap';
import Events from './sections/Events';
import Wellness from './sections/Wellness';
import Feedback from './sections/Feedback';
import AIAssistant from '../../components/common/AIAssistant';
import SOSButton from '../../components/common/SOSButton';
import NearbyDoctorsMap from '../../components/common/NearbyDoctorsMap';

const navItems = [
  {
    id: 'profile',
    label: 'My Health Profile',
    icon: UserRound
  },
  {
    id: 'overview',
    label: 'Dashboard',
    icon: LayoutDashboard
  },
  {
    id: 'nearby-doctors',
    label: 'Nearby Doctors',
    icon: MapPin
  },
  {
    id: 'consultation',
    label: 'Consultation',
    icon: Stethoscope
  },
  {
    id: 'online-consultation',
    label: 'Online Consultation',
    icon: Stethoscope
  },
  {
    id: 'appointments',
    label: 'Appointments',
    icon: Calendar
  },
  {
    id: 'telemedicine',
    label: 'Telemedicine',
    icon: Video
  },
  {
    id: 'transfer',
    label: 'Smart Transfer',
    icon: Truck
  },
  {
    id: 'reportmap',
    label: 'Report & Map',
    icon: Map
  },
  {
    id: 'events',
    label: 'Events',
    icon: PartyPopper
  },
  {
    id: 'wellness',
    label: 'Wellness',
    icon: Heart
  },
  {
    id: 'feedback',
    label: 'Feedback',
    icon: MessageSquare
  }
];


export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sectionMap = {
  profile: <MyHealthProfile />,
  overview: <Overview />,
  'nearby-doctors': (
    <NearbyDoctorsMap setActive={setActive} />
  ),
  transfer: <SmartTransfer />,
  consultation: <Consultation />,
  'online-consultation': (
    <OnlineConsultation setActive={setActive} />
  ),
  appointments: <Appointments />,
  telemedicine: <Telemedicine />,
  reportmap: <ReportMap />,
  events: <Events />,
  wellness: <Wellness />,
  feedback: <Feedback />
};
  const [patientProfile, setPatientProfile] = useState(null);
const [profileLoading, setProfileLoading] = useState(true);
useEffect(() => {
  const fetchPatientProfile = async () => {
    try {
      const { data } = await api.get('/patients/me');
      setPatientProfile(data);
    } catch (err) {
      console.error('PATIENT PROFILE ERROR:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  fetchPatientProfile();
}, []);
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={mobile ? 'flex flex-col h-full' : 'hidden lg:flex flex-col h-full'}>
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center">
            <Heart size={16} className="text-white" fill="white" />
          </div>
          <span className="text-lg font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
            Med<span style={{ background: 'linear-gradient(135deg,#00d4aa,#7c6aff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Matrix</span>
          </span>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-white text-sm font-semibold">{user?.name}</div>
            <div className="text-slate-500 text-xs">Patient</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActive(item.id); setSidebarOpen(false); }}
            className={'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ' +
              (active === item.id
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-0.5'
              )}
          >
            <item.icon size={17} />
            <span>{item.label}</span>
            {active === item.id && <ChevronRight size={14} className="ml-auto" />}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={17} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex relative">
      <div className="ambient-orb w-96 h-96 bg-teal-500/8 -top-20 -left-20 fixed" />
      <div className="ambient-orb w-96 h-96 bg-violet-500/8 bottom-0 right-0 fixed" />

      <div className="sidebar-panel w-60 shrink-0 bg-slate-900/60 border-r border-white/5 fixed left-0 top-0 h-full z-30">
        <Sidebar />
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 h-full w-60 bg-slate-900 border-r border-white/5 z-50 lg:hidden"
            >
              <Sidebar mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <div className="topbar-panel sticky top-0 z-20 bg-slate-950/80 backdrop-blur border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
              <Menu size={22} />
            </button>
            <h1 className="text-white font-semibold text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>
              {navItems.find((n) => n.id === active)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle size="sm" />
            <div className="w-9 h-9 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          {/* Patient ID Card */}
{active === 'overview' && (
  <div className="mb-6">
    <div className="bg-gradient-to-r from-teal-500/10 to-violet-500/10 border border-teal-500/20 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">
            Your MedMatrix Patient ID
          </p>

          {profileLoading ? (
            <div className="h-7 w-40 bg-white/10 rounded-lg animate-pulse" />
          ) : (
            <p className="text-xl font-bold text-white tracking-wider">
              {patientProfile?.patientId || 'Not available'}
            </p>
          )}

          <p className="text-xs text-slate-500 mt-2">
            Use this ID when interacting with hospitals and appointments.
          </p>
        </div>

        {patientProfile?.patientId && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(patientProfile.patientId);
              toast.success('Patient ID copied!');
            }}
            className="px-4 py-2 rounded-xl bg-teal-500/15 border border-teal-500/20 text-teal-400 text-sm font-medium hover:bg-teal-500/25 transition-all"
          >
            Copy ID
          </button>
        )}
      </div>
    </div>
  </div>
)}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
            >
             {sectionMap[active] || <Overview />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <SOSButton variant="floating" />
      <AIAssistant />
    </div>
  );
}