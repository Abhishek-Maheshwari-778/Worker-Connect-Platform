import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { MessageSquare, Users, Briefcase } from 'lucide-react';
import api from '@/services/api';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalWorkers: 0,
    activeJobs: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/employee/stats');
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome, {user?.name}!</h1>
          <p className="text-slate-500">You are managing the {user?.location?.city || 'local'} area operations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-orange-100 rounded-xl text-orange-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Managed Clients</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.totalClients}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-blue-100 rounded-xl text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Managed Workers</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.totalWorkers}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-green-100 rounded-xl text-green-600">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Area Jobs</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.activeJobs}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/employee/chat" className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium transition-colors">
            <MessageSquare size={20} />
            View Messages
          </Link>
          <Link to="/employee/jobs" className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
            <Briefcase size={20} />
            Manage Area Jobs
          </Link>
          <Link to="/employee/workers" className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-medium transition-colors">
            <Users size={20} />
            Worker Portfolio
          </Link>
          <Link to="/employee/clients" className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-medium transition-colors">
            <Users size={20} />
            Client Portfolio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
