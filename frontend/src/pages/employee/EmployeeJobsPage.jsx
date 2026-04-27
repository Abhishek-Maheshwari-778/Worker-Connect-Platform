import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Briefcase, MapPin, Calendar, Users, CheckCircle, X } from 'lucide-react';
import { formatDate, formatCurrency, JOB_STATUS_CSS, JOB_STATUS_LABELS } from '@/utils/helpers';
import Spinner from '@/components/common/Spinner';
import Avatar from '@/components/common/Avatar';
import toast from 'react-hot-toast';

const EmployeeJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/employee/jobs');
      setJobs(res.data.data);
    } catch (err) {
      console.error('Error fetching jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async (jobId) => {
    setLoadingApps(true);
    try {
      const res = await api.get(`/employee/jobs/${jobId}/applicants`);
      setApplicants(res.data.data);
    } catch (err) {
      toast.error('Failed to load applicants');
    } finally {
      setLoadingApps(false);
    }
  };

  const handleHire = async (jobId, workerId) => {
    try {
      await api.put(`/employee/jobs/${jobId}/hire/${workerId}`);
      toast.success('Worker assigned successfully!');
      fetchApplicants(jobId);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Hiring failed');
    }
  };

  const handleUpdateStatus = async (jobId, status) => {
    try {
      await api.put(`/employee/jobs/${jobId}/status`, { status });
      toast.success(`Job marked as ${status.replace('_', ' ')}`);
      fetchJobs();
    } catch (err) {
      toast.error('Failed to update job status');
    }
  };

  const openApplicants = (job) => {
    setSelectedJob(job);
    fetchApplicants(job._id);
  };

  if (loading) return <div className="flex justify-center p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Area Job Postings</h1>
          <p className="text-slate-500">View and manage jobs in your assigned territory</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {jobs.length > 0 ? jobs.map(job => (
          <div key={job._id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{job.title}</h3>
                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><MapPin size={14} /> {job.location?.city}</span>
                  <span className="flex items-center gap-1"><Calendar size={14} /> Posted {formatDate(job.createdAt)}</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${JOB_STATUS_CSS[job.status] || 'bg-slate-100'}`}>
                {JOB_STATUS_LABELS[job.status]}
              </span>
            </div>
            
            <p className="text-slate-600 text-sm line-clamp-2 mb-4">{job.description}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Budget</span>
                <span className="text-sm font-bold text-slate-700">{formatCurrency(job.budgetMin)} - {formatCurrency(job.budgetMax)}</span>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => openApplicants(job)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition-colors"
                >
                  <Users size={16} />
                  Manage Workers ({job.applicants?.length || 0})
                </button>

                {(job.status === 'open' || job.status === 'pending') && (
                  <button 
                    onClick={() => handleUpdateStatus(job._id, 'in_progress')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                  >
                    Start Work
                  </button>
                )}

                {job.status === 'in_progress' && (
                  <button 
                    onClick={() => handleUpdateStatus(job._id, 'completed')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"
                  >
                    Mark Done
                  </button>
                )}

                {(job.status === 'open' || job.status === 'pending' || job.status === 'in_progress') && (
                  <button 
                    onClick={() => handleUpdateStatus(job._id, 'cancelled')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <Briefcase className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500">No active jobs found in your area.</p>
          </div>
        )}
      </div>

      {/* ── Applicants Modal ───────────────────────────────────────────── */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Job Applicants</h3>
                <p className="text-sm text-slate-500">{selectedJob.title}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loadingApps ? (
                <div className="flex justify-center p-10"><Spinner /></div>
              ) : applicants.length > 0 ? (
                <div className="space-y-4">
                  {applicants.map(app => (
                    <div key={app._id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-4">
                        <Avatar src={app.labour?.avatar?.url} name={app.labour?.name} size="md" />
                        <div>
                          <p className="font-bold text-slate-800">{app.labour?.name}</p>
                          <p className="text-xs text-slate-500">{app.labour?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {app.status === 'accepted' ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm font-bold bg-green-50 px-3 py-1 rounded-lg">
                            <CheckCircle size={16} /> Hired
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleHire(selectedJob._id, app.labour._id)}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                          >
                            Hire on behalf of Client
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-slate-500">No applications received yet.</p>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">As a mediator, you can hire workers directly to fulfill client requirements.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeJobsPage;
