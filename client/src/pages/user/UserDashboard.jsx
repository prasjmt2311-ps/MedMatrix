import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../../components/common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Stethoscope, Calendar, Video,
  Map, PartyPopper, Heart, MessageSquare,
  LogOut, Menu, X, Bell, ChevronRight, Truck
} from 'lucide-react';

import Overview from './sections/Overview';
import Consultation from './sections/Consultation';
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

const navItems = [
  { id: 'overview',      label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'consultation',  label: 'Consultation',   icon: Stethoscope },
  { id: 'online-consultation', label: 'Online Consultation', icon: Stethoscope },
  { id: 'appointments',  label: 'Appointments',   icon: Calendar },
  { id: 'telemedicine',  label: 'Telemedicine',   icon: Video },
  { id: 'transfer', label: 'Smart Transfer', icon: Truck },
  { id: 'reportmap',     label: 'Report & Map',   icon: Map },
  { id: 'events',        label: 'Events',         icon: PartyPopper },
  { id: 'wellness',      label: 'Wellness',       icon: Heart },
  { id: 'feedback',      label: 'Feedback',       icon: MessageSquare },
];

const sectionMap = {
  transfer: <SmartTransfer />,
  overview:     <Overview />,
  consultation: <Consultation />,
  'online-consultation': <OnlineConsultation />,
  appointments: <Appointments />,
  telemedicine: <Telemedicine />,
  reportmap:    <ReportMap />,
  events:       <Events />,
  wellness:     <Wellness />,
  feedback:     <Feedback />,
};

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={mobile
      ? 'flex flex-col h-full'
      : 'hidden lg:flex flex-col h-full'
    }>
      {/* Logo */}
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

      {/* User Info */}
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

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setActive(item.id); setSidebarOpen(false); }}
            className={'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ' +
              (active === item.id
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-0.5'
              )}
            style={active === item.id ? { boxShadow: '0 0 12px rgba(0,212,170,0.1)' } : {}}
          >
            <item.icon size={17} />
            <span>{item.label}</span>
            {active === item.id && <ChevronRight size={14} className="ml-auto" />}
          </button>
        ))}
      </nav>

      {/* Logout */}
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
      {/* Ambient orbs */}
      <div className="ambient-orb w-96 h-96 bg-teal-500/8 -top-20 -left-20 fixed" />
      <div className="ambient-orb w-96 h-96 bg-violet-500/8 bottom-0 right-0 fixed" />
      {/* Desktop Sidebar */}
      <div className="sidebar-panel w-60 shrink-0 bg-slate-900/60 border-r border-white/5 fixed left-0 top-0 h-full z-30">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
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

      {/* Main Content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Topbar */}
        <div className="topbar-panel sticky top-0 z-20 bg-slate-950/80 backdrop-blur border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-white font-semibold text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>
                {navItems.find(n => n.id === active)?.label}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle size="sm" />
            <button className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-400 rounded-full" />
            </button>
            <div className="w-9 h-9 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Section Content */}
        <div className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
            >
              {sectionMap[active]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <SOSButton variant="floating" />
      <AIAssistant />   
    </div>
  );
}