import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, ClipboardList, Users,
  MessageCircle, Settings, AlertTriangle, BookOpen,
} from 'lucide-react';
import Sidebar   from './Sidebar';
import Navbar    from './Navbar';
import LabourBot from '@/components/chat/LabourBot';
import { useRoleTheme } from '@/hooks/useRoleTheme';

const clientNav = [
  { to: '/client',              end: true,           icon: LayoutDashboard, label: 'Dashboard'       },
  { divider: true, key: 'jobs', label: 'Jobs' },
  { to: '/client/post-job',     icon: PlusCircle,    label: 'Post a Job'    },
  { to: '/client/jobs',         icon: ClipboardList, label: 'My Postings'   },
  { to: '/client/labourers',    icon: Users,         label: 'Browse Workers' },
  { to: '/client/chat',         icon: MessageCircle, label: 'Messages'      },
  { divider: true, key: 'info', label: 'Info' },
  { to: '/client/schemes',      icon: BookOpen,      label: 'Govt. Schemes' },
  { divider: true, key: 'me',   label: 'Account' },
  { to: '/client/disputes',     icon: AlertTriangle, label: 'My Disputes'   },
  { to: '/client/settings',     icon: Settings,      label: 'Settings'      },
];

const ClientLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { dark, wrapperProps } = useRoleTheme('client');

  return (
    <div
      {...wrapperProps}
      className={`min-h-screen flex flex-col ${
        dark ? 'dark bg-slate-900 text-slate-100' : 'bg-surface-50 text-gray-900'
      }`}
    >
      <Navbar onMenuToggle={() => setSidebarOpen(true)} />
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-0 sm:px-4 lg:px-6 py-0 lg:py-4 gap-0 lg:gap-5">
        <Sidebar navItems={clientNav} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 py-4 px-4 sm:px-0">
          <Outlet />
        </main>
      </div>
      {/* LabourBot scoped to client dashboard only */}
      <LabourBot />
    </div>
  );
};

export default ClientLayout;