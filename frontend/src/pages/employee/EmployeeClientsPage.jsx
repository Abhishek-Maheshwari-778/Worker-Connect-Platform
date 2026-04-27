import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Building2, Phone, Mail, User, MessageSquare, ShieldCheck, CheckCircle } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import Spinner from '@/components/common/Spinner';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const EmployeeClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get('/employee/clients');
      setClients(res.data.data);
    } catch (err) {
      console.error('Error fetching clients', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await api.put(`/employee/users/${userId}/approve`);
      toast.success('Client approved successfully!');
      fetchClients();
    } catch (err) {
      toast.error('Failed to approve client');
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Managed Clients</h1>
          <p className="text-slate-500">Employers and clients assigned to your portfolio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.length > 0 ? clients.map(profile => (
          <div key={profile._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center text-center relative overflow-hidden">
            {profile.user?.isVerified && (
              <div className="absolute top-4 right-4 bg-green-100 text-green-600 p-1 rounded-full">
                <ShieldCheck size={16} />
              </div>
            )}

            <Avatar src={profile.user?.avatar?.url} name={profile.user?.name} size="xl" />
            <h3 className="mt-4 text-lg font-bold text-slate-800">{profile.companyName || profile.user?.name}</h3>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full mt-1 uppercase">
              {profile.companyType?.replace('_', ' ') || 'Individual Client'}
            </span>
            
            <div className="mt-6 w-full space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                <Phone size={16} className="text-slate-400" />
                <span>{profile.user?.phone || 'No phone'}</span>
              </div>
            </div>

            <div className="mt-6 w-full grid grid-cols-2 gap-3">
              <Link 
                to={`/employee/chat`} 
                className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors text-sm"
              >
                <MessageSquare size={16} />
                Chat
              </Link>
              {!profile.user?.isVerified ? (
                <button 
                  onClick={() => handleApprove(profile.user?._id)}
                  className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors text-sm"
                >
                  <ShieldCheck size={16} />
                  Approve
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 rounded-2xl font-bold text-sm">
                  <CheckCircle size={16} />
                  Verified
                </div>
              )}
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <Building2 className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500">You haven't been assigned any clients yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeClientsPage;
