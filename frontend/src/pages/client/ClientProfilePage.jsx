import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { Camera } from 'lucide-react';
import userService from '@/services/userService';
import Avatar from '@/components/common/Avatar';
import Spinner from '@/components/common/Spinner';
import { Alert } from '@/components/common/UIComponents';
import toast from 'react-hot-toast';

const ClientProfilePage = () => {
  const { user, updateUser } = useAuth();
  const avatarRef = useRef();
  const profile   = user?.clientProfile || {};

  const [basicForm, setBasicForm] = useState({
    name:  user?.name  || '',
    phone: user?.phone || '',
  });

  const [clientForm, setClientForm] = useState({
    companyName:          profile.companyName          || '',
    companyType:          profile.companyType          || 'individual',
    industryType:         profile.industryType         || '',
    gstNumber:            profile.gstNumber            || '',
    websiteUrl:           profile.websiteUrl           || '',
    preferredPaymentMode: profile.preferredPaymentMode || 'upi',
  });

  const [error, setError] = useState('');

  const updateMutation = useMutation({
    mutationFn: () => Promise.all([
      userService.updateProfile(basicForm),
      userService.updateClientProfile(clientForm),
    ]),
    onSuccess: ([basicRes]) => {
      updateUser(basicRes.data.data);
      toast.success('Profile updated successfully!');
    },
    onError: (err) => setError(err.message),
  });

  const avatarMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return userService.uploadAvatar(fd);
    },
    onSuccess: (res) => {
      updateUser({ avatar: res.data.data.avatar });
      toast.success('Avatar updated!');
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    updateMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="page-title">Account Settings</h1>
        <p className="text-slate-500 mt-1">Manage your profile and business details.</p>
      </div>

      {error && <Alert type="error" message={error} />}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Avatar ── */}
        <div className="card card-body">
          <p className="text-sm font-semibold text-slate-700 mb-4">Profile Photo</p>
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar src={user?.avatar?.url} name={user?.name} size="xl" />
              <button type="button" onClick={() => avatarRef.current.click()}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files[0] && avatarMutation.mutate(e.target.files[0])} />
            </div>
            <div>
              <p className="font-medium text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
              {avatarMutation.isPending && <p className="text-xs text-primary mt-1 flex items-center gap-1"><Spinner size="sm" /> Uploading…</p>}
            </div>
          </div>
        </div>

        {/* ── Personal info ── */}
        <div className="card card-body space-y-4">
          <p className="text-sm font-semibold text-slate-700">Personal Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={basicForm.name}
                onChange={e => setBasicForm({ ...basicForm, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input className="input" value={basicForm.phone} maxLength={10}
                onChange={e => setBasicForm({ ...basicForm, phone: e.target.value })} />
            </div>
          </div>
        </div>

        {/* ── Business info ── */}
        <div className="card card-body space-y-4">
          <p className="text-sm font-semibold text-slate-700">Business Details <span className="text-slate-400 font-normal">(optional)</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Company Name</label>
              <input className="input" value={clientForm.companyName}
                onChange={e => setClientForm({ ...clientForm, companyName: e.target.value })} />
            </div>
            <div>
              <label className="label">Company Type</label>
              <select className="input" value={clientForm.companyType}
                onChange={e => setClientForm({ ...clientForm, companyType: e.target.value })}>
                <option value="individual">Individual</option>
                <option value="small_business">Small Business</option>
                <option value="contractor">Contractor</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="label">Industry</label>
              <input className="input" value={clientForm.industryType} placeholder="e.g. Real Estate, Manufacturing"
                onChange={e => setClientForm({ ...clientForm, industryType: e.target.value })} />
            </div>
            <div>
              <label className="label">GST Number</label>
              <input className="input" value={clientForm.gstNumber} placeholder="Optional"
                onChange={e => setClientForm({ ...clientForm, gstNumber: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Website</label>
              <input className="input" value={clientForm.websiteUrl} placeholder="https://yourcompany.com"
                onChange={e => setClientForm({ ...clientForm, websiteUrl: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Preferred Payment Mode</label>
            <select className="input" value={clientForm.preferredPaymentMode}
              onChange={e => setClientForm({ ...clientForm, preferredPaymentMode: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn-primary btn w-full btn-lg" disabled={updateMutation.isPending}>
          {updateMutation.isPending
            ? <><Spinner size="sm" color="text-white" /> Saving…</>
            : 'Save Changes'
          }
        </button>
      </form>
    </div>
  );
};

export default ClientProfilePage;