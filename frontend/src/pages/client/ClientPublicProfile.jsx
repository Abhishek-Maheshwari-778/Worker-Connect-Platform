// frontend/src/pages/client/ClientPublicProfile.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Building2, MapPin, Star, Briefcase, 
  CheckCircle, Users, Calendar, Mail, Globe,
  Loader2, AlertCircle
} from 'lucide-react';
import userService from '@/services/userService';
import Avatar from '@/components/common/Avatar';
import { EmptyState } from '@/components/common/UIComponents';

const ClientPublicProfile = () => {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['client-public-profile', id],
    queryFn: () => userService.getClientById(id).then(r => r.data.data),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState
          icon={AlertCircle}
          title="Client not found"
          description="This client profile doesn't exist or has been removed."
          action={<Link to="/labour/jobs" className="btn-primary btn">Browse Jobs</Link>}
        />
      </div>
    );
  }

  const client = data;
  const profile = client.clientProfile || {};
  const stats = client.stats || {};

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      {/* Back button */}
      <Link 
        to="/labour/jobs" 
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Jobs
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-32" />

        <div className="px-6 pb-6">
          <div className="relative -mt-16 mb-4 flex items-end justify-between">
            <div className="flex items-end gap-4">
              <Avatar 
                src={client.avatar?.url} 
                name={client.name} 
                size="xl" 
                className="border-4 border-white shadow-lg"
              />
              <div className="mb-1">
                <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {profile.companyName || 'Individual Client'}
                  {profile.companyType && (
                    <span className="text-slate-400">· {profile.companyType.replace('_', ' ')}</span>
                  )}
                </p>
              </div>
            </div>

            {client.isVerified && (
              <span className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold">
                <CheckCircle className="w-4 h-4" /> Verified
              </span>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <StatCard 
              icon={Briefcase} 
              label="Total Jobs" 
              value={stats.totalJobs || 0} 
              color="text-blue-600"
              bg="bg-blue-50"
            />
            <StatCard 
              icon={CheckCircle} 
              label="Completed" 
              value={stats.completedJobs || 0} 
              color="text-green-600"
              bg="bg-green-50"
            />
            <StatCard 
              icon={Users} 
              label="Total Hires" 
              value={stats.totalHires || 0} 
              color="text-purple-600"
              bg="bg-purple-50"
            />
            <StatCard 
              icon={Star} 
              label="Rating" 
              value={client.averageRating ? `${client.averageRating.toFixed(1)}/5` : '—'} 
              color="text-amber-500"
              bg="bg-amber-50"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - About */}
        <div className="md:col-span-2 space-y-6">
          {/* About Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">About</h2>

            {profile.industryType && (
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                <Building2 className="w-4 h-4 text-slate-400" />
                Industry: <span className="font-medium">{profile.industryType}</span>
              </div>
            )}

            {client.location?.city && (
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                <MapPin className="w-4 h-4 text-slate-400" />
                Location: <span className="font-medium">{client.location.city}, {client.location.state}</span>
              </div>
            )}

            {profile.websiteUrl && (
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                <Globe className="w-4 h-4 text-slate-400" />
                Website: <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{profile.websiteUrl}</a>
              </div>
            )}

            {profile.preferredPaymentMode && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="text-slate-400">💳</span>
                Preferred Payment: <span className="font-medium capitalize">{profile.preferredPaymentMode.replace('_', ' ')}</span>
              </div>
            )}
          </div>

          {/* Recent Jobs Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Job Postings</h2>

            {stats.openJobs > 0 ? (
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                <Briefcase className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-semibold text-orange-800">{stats.openJobs} Open Job{stats.openJobs !== 1 ? 's' : ''}</p>
                  <p className="text-sm text-orange-600">This client is currently hiring</p>
                </div>
                <Link 
                  to={`/labour/jobs?client=${id}`}
                  className="ml-auto px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-colors"
                >
                  View Jobs
                </Link>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No open jobs currently</p>
            )}
          </div>
        </div>

        {/* Right Column - Trust Indicators */}
        <div className="space-y-6">
          {/* Trust Score Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Trust Score</h3>

            <div className="flex items-center justify-center">
              <div className="relative">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="8"
                    strokeDasharray={`${(stats.completionRate || 0) * 2.51} 251`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900">{Math.round(stats.completionRate || 0)}%</span>
                  <span className="text-[10px] text-slate-400">Completion</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center mt-4">
              Based on job completion rate and hiring history
            </p>
          </div>

          {/* Member Since */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Member Since</h3>
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span className="font-medium">
                {new Date(client.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Safety Tip */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
            <p className="text-xs text-amber-800">
              <strong>💡 Safety Tip:</strong> Always verify job details before starting work. Report any suspicious activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className={`${bg} rounded-2xl p-4 text-center`}>
    <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
    <p className="text-2xl font-bold text-slate-900">{value}</p>
    <p className="text-xs text-slate-500">{label}</p>
  </div>
);

export default ClientPublicProfile;