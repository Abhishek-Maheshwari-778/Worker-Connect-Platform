import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Settings, Briefcase, HardHat, Building2 } from 'lucide-react';
import Sidebar   from './Sidebar';
import Navbar    from './Navbar';
import { useRoleTheme } from '@/hooks/useRoleTheme';

const employeeNav = [
  { to: '/employee',      end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employee/jobs',    icon: Briefcase, label: 'Area Jobs' },
  { to: '/employee/workers', icon: HardHat, label: 'Workers' },
  { to: '/employee/clients', icon: Building2, label: 'Clients' },
  { to: '/employee/chat',    icon: MessageSquare, label: 'Messages' },
  { divider: true, key: 'account', label: 'Account' },
  { to: '/employee/settings', icon: Settings, label: 'Settings' },
];

const EmployeeLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { dark, wrapperProps } = useRoleTheme('employee');

  return (
    <div
      {...wrapperProps}
      className={`min-h-screen flex flex-col ${
        dark ? 'dark bg-slate-900 text-slate-100' : 'bg-surface-50 text-gray-900'
      }`}
    >
      <Navbar onMenuToggle={() => setSidebarOpen(true)} />
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-0 sm:px-4 lg:px-6 py-0 lg:py-4 gap-0 lg:gap-5">
        <Sidebar navItems={employeeNav} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 py-4 px-4 sm:px-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;
