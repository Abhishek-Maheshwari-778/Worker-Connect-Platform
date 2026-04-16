import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import userService from '@/services/userService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Plus, X, Upload, CheckCircle } from 'lucide-react';
import { Alert } from '@/components/common/UIComponents';
import Avatar from '@/components/common/Avatar';
import toast from 'react-hot-toast';
import { JOB_CATEGORIES } from '@/utils/helpers';
import Spinner from '@/components/common/Spinner';

const LabourProfileEdit = () => {
  const { user, updateUser } = useAuth();
  const qc = useQueryClient();
  const avatarRef  = useRef();
  const aadhaarRef = useRef();

  const profile = user?.labourProfile || {};

  const [basicForm, setBasicForm] = useState({
    name:  user?.name  || '',
    phone: user?.phone || '',
  });

  const [labourForm, setLabourForm] = useState({
    bio:              profile.bio              || '',
    experience:       profile.experience       || 0,
    dailyWageMin:     profile.dailyWageMin     || '',
    dailyWageMax:     profile.dailyWageMax     || '',
    workingRadius:    profile.workingRadius    || 20,
    isAvailable:      profile.isAvailable      ?? true,
    preferredShift:   profile.preferredShift   || 'flexible',
    preferredCategories: profile.preferredCategories || [],
  });

  const [skillInput, setSkillInput] = useState('');
  const [skills,     setSkills]     = useState(profile.skills || []);

  const addSkill = () => {
    const name = skillInput.trim();
    if (!name || skills.find(s => s.name.toLowerCase() === name.toLowerCase())) return;
    setSkills([...skills, { name, yearsOfExp: 0, proficiency: 'intermediate' }]);
    setSkillInput('');
  };

  const removeSkill = (name) => setSkills(skills.filter(s => s.name !== name));

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateProfileMutation = useMutation({
    mutationFn: () => Promise.all([
      userService.updateProfile(basicForm),
      userService.updateLabourProfile({ ...labourForm, skills }),
    ]),
    onSuccess: ([basicRes]) => {
      updateUser(basicRes.data.data);
      qc.invalidateQueries(['me']);
      toast.success('Profile updated!');
    },
    onError: (err) => toast.error(err.message),
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

  const aadhaarMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('aadhaar', file);
      return userService.uploadAadhaar(fd);
    },
    onSuccess: () => toast.success('Aadhaar uploaded! Pending verification.'),
    onError:   (err) => toast.error(err.message),
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) avatarMutation.mutate(file);
  };

  const handleAadhaarChange = (e) => {
    const file = e.target.files[0];
    if (file) aadhaarMutation.mutate(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate();
  };

  const verStatus = profile.verificationStatus || 'not_submitted';

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="page-title">Edit Profile</h1>
        <p className="text-slate-500 mt-1">Keep your profile up to date to get more job offers.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Avatar ── */}
        <div className="card card-body">
          <p className="text-sm font-semibold text-slate-700 mb-4">Profile Photo</p>
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar src={user?.avatar?.url} name={user?.name} size="xl" />
              <button type="button" onClick={() => avatarRef.current.click()}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary-700 transition-colors">
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">{user?.name}</p>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">{user?.role} • {user?.email}</p>
              {avatarMutation.isPending && <p className="text-xs text-primary mt-1 flex items-center gap-1"><Spinner size="sm" />Uploading…</p>}
            </div>
          </div>
        </div>

        {/* ── Basic info ── */}
        <div className="card card-body space-y-4">
          <p className="text-sm font-semibold text-slate-700">Basic Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={basicForm.name} onChange={e => setBasicForm({...basicForm, name: e.target.value})} required />
            </div>
            <div>
              <label className="label">Mobile Number</label>
              <input className="input" value={basicForm.phone} maxLength={10} onChange={e => setBasicForm({...basicForm, phone: e.target.value})} />
            </div>
          </div>
        </div>

        {/* ── Professional details ── */}
        <div className="card card-body space-y-4">
          <p className="text-sm font-semibold text-slate-700">Professional Details</p>
          <div>
            <label className="label">About You</label>
            <textarea className="input resize-none" rows={3} value={labourForm.bio} onChange={e => setLabourForm({...labourForm, bio: e.target.value})} placeholder="Describe your experience and work style…" maxLength={500} />
            <p className="form-hint">{labourForm.bio.length}/500</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Total Experience (years)</label>
              <input type="number" className="input" min={0} max={50} value={labourForm.experience} onChange={e => setLabourForm({...labourForm, experience: e.target.value})} />
            </div>
            <div>
              <label className="label">Working Radius (km)</label>
              <input type="number" className="input" min={1} max={200} value={labourForm.workingRadius} onChange={e => setLabourForm({...labourForm, workingRadius: e.target.value})} />
            </div>
            <div>
              <label className="label">Min. Daily Wage (₹)</label>
              <input type="number" className="input" min={0} value={labourForm.dailyWageMin} onChange={e => setLabourForm({...labourForm, dailyWageMin: e.target.value})} required />
            </div>
            <div>
              <label className="label">Max. Daily Wage (₹)</label>
              <input type="number" className="input" min={0} value={labourForm.dailyWageMax} onChange={e => setLabourForm({...labourForm, dailyWageMax: e.target.value})} required />
            </div>
          </div>

          <div>
            <label className="label">Preferred Shift</label>
            <select className="input" value={labourForm.preferredShift} onChange={e => setLabourForm({...labourForm, preferredShift: e.target.value})}>
              {['morning', 'evening', 'night', 'flexible'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="avail" className="w-4 h-4 rounded text-primary" checked={labourForm.isAvailable} onChange={e => setLabourForm({...labourForm, isAvailable: e.target.checked})} />
            <label htmlFor="avail" className="text-sm text-slate-700 font-medium cursor-pointer">I am currently available for work</label>
          </div>
        </div>

        {/* ── Skills ── */}
        <div className="card card-body space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">Skills</p>
            <p className="text-xs text-slate-400 mt-0.5">Tap any skill below to add it, or type your own</p>
          </div>

          {/* ── Predefined skill suggestions by category ── */}
          <div className="space-y-3">
            {[
              { cat: 'Construction & Civil',   color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',   skills: ['Masonry','Bricklaying','Plastering','Concrete Work','Tiling','Waterproofing','Scaffolding','Demolition'] },
              { cat: 'Electrical',             color: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100',   skills: ['Electrical Wiring','Switchboard Fitting','MCB / Fuse Box','Fan Installation','AC Installation','Solar Panel','CCTV Fitting','Inverter Setup'] },
              { cat: 'Plumbing & Sanitation',  color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',           skills: ['Pipe Fitting','Tap Repair','Bathroom Fitting','Drainage Work','Water Tank Cleaning','Geyser Repair','RO Fitting','Overhead Tank'] },
              { cat: 'Painting & Finishing',   color: 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100',           skills: ['Wall Painting','Texture Painting','Waterproof Coating','Putty Work','Polishing','Wood Painting','Spray Painting','Stencil Work'] },
              { cat: 'Carpentry & Woodwork',   color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',       skills: ['Furniture Making','Door & Window Fitting','Modular Kitchen','False Ceiling','Wood Polish','Almirah Making','Bed Making','Cabinet Work'] },
              { cat: 'Welding & Fabrication',  color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',               skills: ['Arc Welding','MIG Welding','Gate Making','Railing Work','Steel Fabrication','Grill Work','Pipe Welding','Sheet Metal'] },
              { cat: 'Cleaning & Housekeeping',color: 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100',           skills: ['House Cleaning','Sofa Cleaning','Carpet Cleaning','Kitchen Cleaning','Office Cleaning','Glass Cleaning','Pest Control','Sanitisation'] },
              { cat: 'Other Services',         color: 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100',       skills: ['Gardening','Driving','Security Guard','Cook / Helper','Moving & Packing','AC Service','Appliance Repair','CCTV Maintenance'] },
            ].map(({ cat, color, skills: catSkills }) => {
              const allAdded = catSkills.every(s => skills.find(sk => sk.name === s));
              const anyAdded = catSkills.some(s => skills.find(sk => sk.name === s));
              return (
                <div key={cat}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                    {cat}
                    {anyAdded && <span className="normal-case font-normal text-success text-xs">• some added</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {catSkills.map(s => {
                      const isAdded = !!skills.find(sk => sk.name === s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => isAdded ? removeSkill(s) : (setSkillInput(s), setTimeout(() => {
                            const name = s.trim();
                            if (name && !skills.find(sk => sk.name.toLowerCase() === name.toLowerCase())) {
                              setSkills(prev => [...prev, { name, yearsOfExp: 0, proficiency: 'intermediate' }]);
                            }
                            setSkillInput('');
                          }, 0))}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                            isAdded
                              ? 'bg-primary-100 border-primary text-primary-700 shadow-sm'
                              : color
                          }`}
                        >
                          {isAdded ? <span>✓</span> : <Plus style={{width:'11px',height:'11px'}} />}
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Custom skill input ── */}
          <div className="flex gap-2 pt-1 border-t border-surface-100">
            <input className="input flex-1 text-sm" value={skillInput} onChange={e => setSkillInput(e.target.value)}
              placeholder="Type a custom skill and press Add…"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
            <button type="button" onClick={addSkill} className="btn-primary btn flex-shrink-0">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {/* ── Added skills summary ── */}
          {skills.length > 0 && (
            <div className="bg-primary-50 rounded-xl p-3 border border-primary-100">
              <p className="text-xs font-semibold text-primary-700 mb-2">
                ✓ {skills.length} skill{skills.length !== 1 ? 's' : ''} added to your profile
              </p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map(s => (
                  <span key={s.name} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-primary-200 text-xs font-medium text-primary-700">
                    {s.name}
                    <button type="button" onClick={() => removeSkill(s.name)} className="hover:text-danger ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Aadhaar verification ── */}
        <div className="card card-body space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Identity Verification</p>
            {verStatus === 'approved' && (
              <span className="badge-green badge"><CheckCircle className="w-3 h-3" /> Verified</span>
            )}
            {verStatus === 'pending' && <span className="badge-yellow badge">Pending Review</span>}
            {verStatus === 'rejected' && <span className="badge-red badge">Rejected</span>}
          </div>

          <p className="text-xs text-slate-500">Upload your Aadhaar card to get verified and boost your profile visibility.</p>

          {verStatus !== 'approved' && (
            <button type="button" onClick={() => aadhaarRef.current.click()}
              className="btn-outline btn w-full">
              {aadhaarMutation.isPending ? <><Spinner size="sm" />Uploading…</> : <><Upload className="w-4 h-4" />Upload Aadhaar</>}
            </button>
          )}
          <input ref={aadhaarRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleAadhaarChange} />
        </div>

        {/* ── Submit ── */}
        <button type="submit" className="btn-primary btn w-full btn-lg" disabled={updateProfileMutation.isPending}>
          {updateProfileMutation.isPending
            ? <><Spinner size="sm" color="text-white" /> Saving…</>
            : 'Save Profile'
          }
        </button>
      </form>
    </div>
  );
};

export default LabourProfileEdit;