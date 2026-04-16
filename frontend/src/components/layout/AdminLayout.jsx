import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Users, ShieldCheck, Shield, Briefcase,
  Trophy, AlertTriangle, Activity, BarChart2, Ghost,
  Target, Settings, BookOpen, MessageSquare,
} from 'lucide-react';
import Sidebar   from './Sidebar';
import Navbar    from './Navbar';
import LabourBot from '@/components/chat/LabourBot';
import { useRoleTheme } from '@/hooks/useRoleTheme';

const adminNav = [
  { to: '/admin',               end: true, icon: LayoutDashboard, label: 'Dashboard'        },
  { to: '/admin/analytics',     icon: BarChart2,     label: 'Analytics'         },
  { divider: true, key: 'mgmt', label: 'Management' },
  { to: '/admin/users',         icon: Users,         label: 'User Management'   },
  { to: '/admin/verifications', icon: ShieldCheck,   label: 'Verifications'     },
  { to: '/admin/jobs',          icon: Briefcase,     label: 'All Jobs'          },
  { to: '/admin/schemes',       icon: BookOpen,      label: 'Govt. Schemes'     },
  { to: '/admin/badges',        icon: Trophy,        label: 'Badge Stats'       },
  { to: '/admin/fraud',         icon: AlertTriangle, label: 'Fraud Detection'   },
  { to: '/admin/audit',         icon: Activity,      label: 'Audit Log'         },
  { to: '/admin/disputes',      icon: Shield,        label: 'Disputes'          },
  { divider: true, key: 'tools', label: 'Tools' },
  { to: '/admin/inactive-users', icon: Ghost,        label: 'Inactive Users'    },
  { to: '/admin/verif-sla',      icon: Target,       label: 'Verification SLA'  },
  { divider: true, key: 'comms', label: 'Communications' },
  { to: '/admin/contacts',       icon: MessageSquare, label: 'Contact Messages' },
  { divider: true, key: 'account', label: 'Account' },
  { to: '/admin/settings',       icon: Settings,     label: 'Settings'          },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { dark, wrapperProps } = useRoleTheme('admin');

  return (
    <div
      {...wrapperProps}
      className={`min-h-screen flex flex-col ${
        dark ? 'dark bg-slate-900 text-slate-100' : 'bg-surface-50 text-gray-900'
      }`}
    >
      <Navbar onMenuToggle={() => setSidebarOpen(true)} />
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-0 sm:px-4 lg:px-6 py-0 lg:py-4 gap-0 lg:gap-5">
        <Sidebar navItems={adminNav} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 py-4 px-4 sm:px-0">
          <Outlet />
        </main>
      </div>
      {/* LabourBot scoped to admin dashboard only */}
      <LabourBot />
    </div>
  );
};

export default AdminLayout;