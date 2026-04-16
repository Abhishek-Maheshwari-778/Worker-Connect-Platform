import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, ClipboardList, MessageCircle,
  BookOpen, Settings, Trophy, Sparkles, AlertTriangle,
} from 'lucide-react';
import Sidebar    from './Sidebar';
import Navbar     from './Navbar';
import LabourBot  from '@/components/chat/LabourBot';
import { useRoleTheme } from '@/hooks/useRoleTheme';

const labourNav = [
  { to: '/labour',              end: true,           icon: LayoutDashboard, label: 'Dashboard'        },
  { divider: true, key: 'work', label: 'Work' },
  { to: '/labour/jobs',         icon: Briefcase,     label: 'Browse Jobs'     },
  { to: '/labour/leaderboard',  icon: Trophy,        label: 'Leaderboard'     },
  { to: '/labour/points',       icon: Sparkles,      label: 'My XP & Badges'  },
  { to: '/labour/applications', icon: ClipboardList, label: 'My Applications' },
  { to: '/labour/chat',         icon: MessageCircle, label: 'Messages'        },
  { divider: true, key: 'info', label: 'Info' },
  { to: '/labour/schemes',      icon: BookOpen,      label: 'Govt. Schemes'   },
  { divider: true, key: 'me',   label: 'Account' },
  { to: '/labour/disputes',     icon: AlertTriangle, label: 'My Disputes'     },
  { to: '/labour/settings',     icon: Settings,      label: 'Settings'        },
];

const LabourLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { dark, wrapperProps } = useRoleTheme('labour');

  return (
    <div
      {...wrapperProps}
      className={`min-h-screen flex flex-col ${
        dark ? 'dark bg-slate-900 text-slate-100' : 'bg-surface-50 text-gray-900'
      }`}
    >
      <Navbar onMenuToggle={() => setSidebarOpen(true)} />
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-0 sm:px-4 lg:px-6 py-0 lg:py-4 gap-0 lg:gap-5">
        <Sidebar navItems={labourNav} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 py-4 px-4 sm:px-0">
          <Outlet />
        </main>
      </div>
      {/* LabourBot scoped to labour dashboard only */}
      <LabourBot />
    </div>
  );
};

export default LabourLayout;