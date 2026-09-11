import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/common/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import {
 LayoutDashboard, BedDouble, UserRound, ArrowLeftRight, Search,
  Megaphone, BarChart3, AlertTriangle, LogOut,
  Menu, Bell, Heart, ChevronRight, Video
} from 'lucide-react';
import DoctorCall from './sections/DoctorCall';
import PatientSearch from './sections/PatientSearch';
import ResourceManager from './sections/ResourceManager';
import DoctorManagement from './sections/DoctorManagement';
import PatientTransfer from './sections/PatientTransfer';
import CampaignTracker from './sections/CampaignTracker';
import Analytics from './sections/Analytics';
import EmergencyAlerts from './sections/EmergencyAlerts';
import AIAssistant from '../../components/common/AIAssistant';

const navItems = [
  {
  id: 'patient-search',
  label: 'Search Patient',
  icon: Search
},
  { id: 'doctorcall', label: 'Video Consultation', icon: Video },
  { id: 'resources',  label: 'Manage Resources',          icon: BedDouble },
  { id: 'doctors',    label: 'Doctor Management',          icon: UserRound },
  { id: 'transfer',   label: 'Patient Transfer',           icon: ArrowLeftRight },
  { id: 'campaigns',  label: 'Campaign Tracker',           icon: Megaphone },
  { id: 'analytics',  label: 'Analytics',                  icon: BarChart3 },
  { id: 'emergency',  label: 'Emergency Alerts',           icon: AlertTriangle },
];

const sectionMap = {
  'patient-search': <PatientSearch />,
  doctorcall: <DoctorCall />,
  resources: <ResourceManager />,
  doctors:   <DoctorManagement />,
  transfer:  <PatientTransfer />,
  campaigns: <CampaignTracker />,
  analytics: <Analytics />,
  emergency: <EmergencyAlerts />,
};

export default function HospitalDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('resources');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-teal-500 flex items-center justify-center">
            <Heart size={16} className="text-white" fill="white" />
          </div>
          <span className="text-lg font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
            Med<span style={{ background: 'linear-gradient(135deg,#00d4aa,#7c6aff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Matrix</span>
          </span>
        </div>
        <div className="mt-1 text-xs text-violet-400 font-medium">Hospital Portal</div>
      </div>

      {/* Hospital Info */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-white text-sm font-semibold truncate max-w-[140px]">{user?.name}</div>
            <div className="text-slate-500 text-xs">Hospital Admin</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setActive(item.id); setSidebarOpen(false); }}
            className={'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ' +
              (active === item.id
                ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
          >
            <item.icon size={17} />
            <span>{item.label}</span>
            {active === item.id && <ChevronRight size={14} className="ml-auto" />}
            {item.id === 'emergency' && (
              <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
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
      <div className="sidebar-panel w-60 shrink-0 bg-slate-900/60 border-r border-white/5 fixed left-0 top-0 h-full z-30 hidden lg:block">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 h-full w-60 bg-slate-900 border-r border-white/5 z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Topbar */}
        <div className="topbar-panel sticky top-0 z-20 bg-slate-950/80 backdrop-blur border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
              <Menu size={22} />
            </button>
            <h1 className="text-white font-semibold text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>
              {navItems.find(n => n.id === active)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle size="sm" />
            <button className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>
            <div className="w-9 h-9 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Content */}
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
      <AIAssistant />
    </div>
  );
}