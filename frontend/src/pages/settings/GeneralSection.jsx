// import { useState, useRef, useEffect, useCallback } from 'react';
// import {
//   Camera, Check, X, Edit2, Loader2, ChevronDown,
//   MapPin, User, Briefcase, Shield, Star, Plus,
//   Upload, CheckCircle, AlertTriangle, HardHat,
//   Building2, IndianRupee, Clock, ToggleLeft,
//   ToggleRight, Save, Phone, Heart, UserCheck
// } from 'lucide-react';
// import { useAuth }                     from '@/context/AuthContext';
// import { useSocket }                   from '@/context/SocketContext';
// import { useMutation }                 from '@tanstack/react-query';
// import userService                     from '@/services/userService';
// import { INDIA_STATES }                from '@/utils/indiaData';
// import { JOB_CATEGORIES }             from '@/utils/helpers';
// import toast                           from 'react-hot-toast';
// import api                             from '@/services/api';

// const SKILL_CATS = [
//   { cat:'Construction & Civil',    color:'orange', skills:['Masonry','Bricklaying','Plastering','Concrete Work','Tiling','Waterproofing','Scaffolding','Demolition'] },
//   { cat:'Electrical',              color:'yellow', skills:['Electrical Wiring','Switchboard Fitting','MCB / Fuse Box','Fan Installation','AC Installation','Solar Panel','CCTV Fitting','Inverter Setup'] },
//   { cat:'Plumbing & Sanitation',   color:'blue',   skills:['Pipe Fitting','Tap Repair','Bathroom Fitting','Drainage Work','Water Tank Cleaning','Geyser Repair','RO Fitting','Overhead Tank'] },
//   { cat:'Painting & Finishing',    color:'pink',   skills:['Wall Painting','Texture Painting','Waterproof Coating','Putty Work','Polishing','Wood Painting','Spray Painting','Stencil Work'] },
//   { cat:'Carpentry & Woodwork',    color:'amber',  skills:['Furniture Making','Door & Window Fitting','Modular Kitchen','False Ceiling','Wood Polish','Almirah Making','Bed Making','Cabinet Work'] },
//   { cat:'Welding & Fabrication',   color:'red',    skills:['Arc Welding','MIG Welding','Gate Making','Railing Work','Steel Fabrication','Grill Work','Pipe Welding','Sheet Metal'] },
//   { cat:'Cleaning & Housekeeping', color:'teal',   skills:['House Cleaning','Sofa Cleaning','Carpet Cleaning','Kitchen Cleaning','Office Cleaning','Glass Cleaning','Pest Control','Sanitisation'] },
//   { cat:'Other Services',          color:'slate',  skills:['Gardening','Driving','Security Guard','Cook / Helper','Moving & Packing','AC Service','Appliance Repair','CCTV Maintenance'] },
// ];

// const CLR = {
//   orange:'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
//   yellow:'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100',
//   blue:  'bg-blue-50  border-blue-200  text-blue-700  hover:bg-blue-100',
//   pink:  'bg-pink-50  border-pink-200  text-pink-700  hover:bg-pink-100',
//   amber: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
//   red:   'bg-red-50   border-red-200   text-red-700   hover:bg-red-100',
//   teal:  'bg-teal-50  border-teal-200  text-teal-700  hover:bg-teal-100',
//   slate: 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100',
// };

// const field = (extra='') =>
//   `w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white text-gray-800 placeholder-gray-400 transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${extra}`;

// const Card = ({ icon: Icon, title, accent='orange', children }) => (
//   <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
//     <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
//       <div className={`w-8 h-8 rounded-xl bg-${accent}-100 flex items-center justify-center flex-shrink-0`}>
//         <Icon className={`w-4 h-4 text-${accent}-600`} />
//       </div>
//       <h3 className="font-semibold text-sm text-gray-800">{title}</h3>
//     </div>
//     <div className="p-5">{children}</div>
//   </div>
// );

// const Row = ({ label, display, saving, open, onOpen, onCancel, onSave, children }) => (
//   <div className="py-3.5 border-b border-gray-50 last:border-0">
//     <div className="flex items-start justify-between gap-3">
//       <div className="flex-1 min-w-0">
//         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
//         {!open && (
//           <p className="text-sm font-medium text-gray-800 break-words">
//             {display || <span className="text-gray-400 italic text-xs">Not set — click Edit to add</span>}
//           </p>
//         )}
//       </div>
//       {!open && (
//         <button onClick={onOpen}
//           className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all mt-0.5">
//           <Edit2 className="w-3 h-3" /> Edit
//         </button>
//       )}
//     </div>
//     {open && (
//       <div className="mt-2 space-y-2">
//         {children}
//         <div className="flex gap-2 pt-1">
//           <button onClick={onSave} disabled={saving}
//             className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 disabled:opacity-60 transition-colors">
//             {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
//             Save
//           </button>
//           <button onClick={onCancel}
//             className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
//             <X className="w-3.5 h-3.5" /> Cancel
//           </button>
//         </div>
//       </div>
//     )}
//   </div>
// );

// const StateSelect = ({ value, onChange }) => {
//   const [open, setOpen] = useState(false);
//   const [q,    setQ]    = useState('');
//   const ref = useRef();
//   useEffect(() => {
//     const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
//     document.addEventListener('mousedown', fn);
//     return () => document.removeEventListener('mousedown', fn);
//   }, []);
//   const list = INDIA_STATES.filter(s => s.state.toLowerCase().includes(q.toLowerCase()));
//   return (
//     <div ref={ref} className="relative">
//       <button type="button" onClick={() => setOpen(o => !o)}
//         className={`${field()} flex items-center justify-between cursor-pointer`}>
//         <span className={value ? '' : 'text-gray-400 italic text-xs'}>{value || 'Select state'}</span>
//         <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
//       </button>
//       {open && (
//         <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
//           <div className="p-2 border-b border-gray-100">
//             <input value={q} onChange={e => setQ(e.target.value)} autoFocus placeholder="Search state…"
//               className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-orange-400" />
//           </div>
//           <div className="max-h-52 overflow-y-auto">
//             {list.map(s => (
//               <button key={s.state} type="button"
//                 onClick={() => { onChange(s.state); setOpen(false); setQ(''); }}
//                 className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === s.state ? 'bg-orange-50 text-orange-700 font-semibold' : 'hover:bg-orange-50 hover:text-orange-700'}`}>
//                 {s.state}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// const CitySelect = ({ value, onChange, stateVal }) => {
//   const [open, setOpen] = useState(false);
//   const [q,    setQ]    = useState('');
//   const ref = useRef();
//   useEffect(() => {
//     const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
//     document.addEventListener('mousedown', fn);
//     return () => document.removeEventListener('mousedown', fn);
//   }, []);
//   const cities = (INDIA_STATES.find(s => s.state === stateVal)?.cities || []).filter(c => c.toLowerCase().includes(q.toLowerCase()));
//   return (
//     <div ref={ref} className="relative">
//       <button type="button" disabled={!stateVal} onClick={() => stateVal && setOpen(o => !o)}
//         className={`${field()} flex items-center justify-between ${!stateVal ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
//         <span className={value ? '' : 'text-gray-400 italic text-xs'}>{value || (stateVal ? 'Select city' : 'Select state first')}</span>
//         <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
//       </button>
//       {open && stateVal && (
//         <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
//           <div className="p-2 border-b border-gray-100">
//             <input value={q} onChange={e => setQ(e.target.value)} autoFocus placeholder="Search city…"
//               className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-orange-400" />
//           </div>
//           <div className="max-h-52 overflow-y-auto">
//             {cities.map(c => (
//               <button key={c} type="button"
//                 onClick={() => { onChange(c); setOpen(false); setQ(''); }}
//                 className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === c ? 'bg-orange-50 text-orange-700 font-semibold' : 'hover:bg-orange-50 hover:text-orange-700'}`}>
//                 {c}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// /* ═══════════════════════════════════════════════════════════════════════════════
//    MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════ */
// export default function GeneralSection() {
//   const { user, updateUser } = useAuth();
//   const { on }  = useSocket();
//   const role     = user?.role || 'labour';
//   const isLabour = role === 'labour';
//   const isClient = role === 'client';
//   const profile  = isLabour ? (user?.labourProfile || {}) : (user?.clientProfile || {});

//   // Real-time: update verified status when admin approves/rejects
//   useEffect(() => {
//     const off = on('verification:updated', ({ status, isVerified }) => {
//       updateUser({ ...user, isVerified: isVerified ?? (status === 'approved') });
//       refetchUser();
//     });
//     return () => off?.();
//   }, [on, user, updateUser]);

//   const avatarRef        = useRef();
//   const aadhaarRef       = useRef();
//   const clientAadhaarRef = useRef();

//   const [f, setF] = useState({
//     name:    user?.name              || '',
//     phone:   user?.phone             || '',
//     dob:     user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
//     gender:  user?.gender            || '',
//     address: user?.location?.address || '',
//     state:   user?.location?.state   || '',
//     city:    user?.location?.city    || '',
//     pincode: user?.location?.pincode || '',
//     ecName:     user?.emergencyContact?.name     || '',
//     ecPhone:    user?.emergencyContact?.phone    || '',
//     ecRelation: user?.emergencyContact?.relation || '',
//   });

//   // Emergency contact local error state
//   const [ecError, setEcError] = useState('');

//   useEffect(() => {
//     setF({
//       name:    user?.name              || '',
//       phone:   user?.phone             || '',
//       dob:     user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
//       gender:  user?.gender            || '',
//       address: user?.location?.address || '',
//       state:   user?.location?.state   || '',
//       city:    user?.location?.city    || '',
//       pincode: user?.location?.pincode || '',
//       ecName:     user?.emergencyContact?.name     || '',
//       ecPhone:    user?.emergencyContact?.phone    || '',
//       ecRelation: user?.emergencyContact?.relation || '',
//     });
//   }, [user?.name, user?.phone, user?.dob, user?.gender,
//       user?.location?.address, user?.location?.state,
//       user?.location?.city, user?.location?.pincode,
//       user?.emergencyContact?.name, user?.emergencyContact?.phone,
//       user?.emergencyContact?.relation]);

//   const [lf, setLf] = useState({
//     bio:                  profile.bio                  || '',
//     experience:           profile.experience           || 0,
//     dailyWageMin:         profile.dailyWageMin         || '',
//     dailyWageMax:         profile.dailyWageMax         || '',
//     workingRadius:        profile.workingRadius        || 20,
//     preferredShift:       profile.preferredShift       || 'flexible',
//     isAvailable:          profile.isAvailable          ?? true,
//     preferredCategories:  profile.preferredCategories  || [],
//   });

//   const [cf, setCf] = useState({
//     companyName:          profile.companyName          || '',
//     companyType:          profile.companyType          || 'individual',
//     industryType:         profile.industryType         || '',
//     gstNumber:            profile.gstNumber            || '',
//     websiteUrl:           profile.websiteUrl           || '',
//     preferredPaymentMode: profile.preferredPaymentMode || 'upi',
//   });

//   const [skills,     setSkills]     = useState(profile.skills || []);
//   const [skillInput, setSkillInput] = useState('');
//   const [saving,     setSaving]     = useState({});
//   const [editing,    setEditing]    = useState({});

//   const refetchUser = useCallback(async () => {
//     try {
//       const res = await api.get('/auth/me');
//       const u   = res.data.data;
//       updateUser({ ...u, location: u.location || {} });
//       const p = u.role === 'labour' ? (u.labourProfile || {}) : (u.clientProfile || {});
//       setF({
//         name:       u.name              || '',
//         phone:      u.phone             || '',
//         dob:        u.dob ? new Date(u.dob).toISOString().split('T')[0] : '',
//         gender:     u.gender            || '',
//         address:    u.location?.address || '',
//         state:      u.location?.state   || '',
//         city:       u.location?.city    || '',
//         pincode:    u.location?.pincode || '',
//         ecName:     u.emergencyContact?.name     || '',
//         ecPhone:    u.emergencyContact?.phone    || '',
//         ecRelation: u.emergencyContact?.relation || '',
//       });
//       setLf(prev => ({
//         ...prev,
//         bio:                 p.bio                  ?? prev.bio,
//         experience:          p.experience           ?? prev.experience,
//         dailyWageMin:        p.dailyWageMin         ?? prev.dailyWageMin,
//         dailyWageMax:        p.dailyWageMax         ?? prev.dailyWageMax,
//         workingRadius:       p.workingRadius        ?? prev.workingRadius,
//         preferredShift:      p.preferredShift       ?? prev.preferredShift,
//         isAvailable:         p.isAvailable          ?? prev.isAvailable,
//         preferredCategories: p.preferredCategories  ?? prev.preferredCategories,
//       }));
//       setSkills(p.skills || []);
//       setCf(prev => ({
//         companyName:          p.companyName          || prev.companyName,
//         companyType:          p.companyType          || prev.companyType,
//         industryType:         p.industryType         || prev.industryType,
//         gstNumber:            p.gstNumber            || prev.gstNumber,
//         websiteUrl:           p.websiteUrl           || prev.websiteUrl,
//         preferredPaymentMode: p.preferredPaymentMode || prev.preferredPaymentMode,
//       }));
//     } catch (_) {}
//   }, [updateUser]);

//   const savePersonal = async (key, payload) => {
//     setSaving(s => ({ ...s, [key]: true }));
//     try {
//       const res = await userService.updateProfile(payload);
//       const updatedUser = res?.data?.data;
//       if (updatedUser) {
//         updateUser(updatedUser);
//         setF({
//           name:    updatedUser.name              || '',
//           phone:   updatedUser.phone             || '',
//           dob:     updatedUser.dob ? new Date(updatedUser.dob).toISOString().split('T')[0] : '',
//           gender:  updatedUser.gender            || '',
//           address: updatedUser.location?.address || '',
//           state:   updatedUser.location?.state   || '',
//           city:    updatedUser.location?.city    || '',
//           pincode: updatedUser.location?.pincode || '',
//           ecName:     updatedUser.emergencyContact?.name     || '',
//           ecPhone:    updatedUser.emergencyContact?.phone    || '',
//           ecRelation: updatedUser.emergencyContact?.relation || '',
//         });
//       } else {
//         await refetchUser();
//       }
//       setEditing(e => ({ ...e, [key]: false }));
//       toast.success('Saved!');
//     } catch (err) {
//       toast.error(err?.response?.data?.message || err.message || 'Save failed');
//     } finally {
//       setSaving(s => ({ ...s, [key]: false }));
//     }
//   };

//   /* ── Save emergency contact ─────────────────────────────────────────────── */
//   const saveEmergencyContact = async () => {
//     setEcError('');
//     if (!f.ecName.trim()) { setEcError('Contact person name is required'); return; }
//     if (!f.ecPhone.trim()) { setEcError('Emergency phone number is required'); return; }
//     if (!f.ecRelation.trim()) { setEcError('Relationship is required'); return; }
//     if (!/^[6-9]\d{9}$/.test(f.ecPhone)) { setEcError('Enter a valid 10-digit Indian mobile number'); return; }
//     if (f.ecPhone === f.phone) { setEcError('Emergency contact number cannot be the same as your own mobile number'); return; }
//     if (/^(\d)\1{9}$/.test(f.ecPhone)) { setEcError('Please enter a real phone number'); return; }
//     await savePersonal('emergencyContact', {
//       emergencyContact: { name: f.ecName.trim(), phone: f.ecPhone, relation: f.ecRelation.trim() },
//     });
//     setEcError('');
//   };

//   const saveLabour = async (key, extra = {}) => {
//     setSaving(s => ({ ...s, [key]: true }));
//     const sanitized = {
//       ...lf, skills, ...extra,
//       dailyWageMin:  lf.dailyWageMin  === '' ? 0 : Number(lf.dailyWageMin)  || 0,
//       dailyWageMax:  lf.dailyWageMax  === '' ? 0 : Number(lf.dailyWageMax)  || 0,
//       experience:    lf.experience    === '' ? 0 : Number(lf.experience)    || 0,
//       workingRadius: lf.workingRadius === '' ? 20 : Number(lf.workingRadius) || 20,
//     };
//     try {
//       await userService.updateLabourProfile(sanitized);
//       await refetchUser();
//       setEditing(e => ({ ...e, [key]: false }));
//       toast.success('Saved!');
//     } catch (err) {
//       toast.error(err?.response?.data?.message || err.message || 'Save failed');
//     } finally {
//       setSaving(s => ({ ...s, [key]: false }));
//     }
//   };

//   const saveClient = async (key) => {
//     setSaving(s => ({ ...s, [key]: true }));
//     try {
//       await userService.updateClientProfile(cf);
//       await refetchUser();
//       setEditing(e => ({ ...e, [key]: false }));
//       toast.success('Saved!');
//     } catch (err) {
//       toast.error(err?.response?.data?.message || err.message || 'Save failed');
//     } finally {
//       setSaving(s => ({ ...s, [key]: false }));
//     }
//   };

//   const avatarMut = useMutation({
//     mutationFn: (file) => { const fd = new FormData(); fd.append('avatar', file); return userService.uploadAvatar(fd); },
//     onSuccess: async () => { await refetchUser(); toast.success('Photo updated!'); },
//     onError: () => toast.error('Upload failed'),
//   });

//   const aadhaarMut = useMutation({
//     mutationFn: (file) => { const fd = new FormData(); fd.append('aadhaar', file); return userService.uploadAadhaar(fd); },
//     onSuccess: async () => { await refetchUser(); toast.success('Aadhaar uploaded! Pending review.'); },
//     onError: () => toast.error('Upload failed'),
//   });

//   const clientAadhaarMut = useMutation({
//     mutationFn: (file) => { const fd = new FormData(); fd.append('aadhaar', file); return userService.uploadClientAadhaar(fd); },
//     onSuccess: async () => { await refetchUser(); toast.success('Document uploaded! Pending admin review.'); },
//     onError: () => toast.error('Upload failed'),
//   });

//   const clientAadhaarStatus = role === 'client' ? (profile?.verificationStatus || null) : null;
//   const aadhaarStatus        = profile?.aadhaarDoc?.status || null;

//   const addSkill    = (name) => {
//     const n = (name || skillInput).trim();
//     if (!n || skills.find(s => s.name.toLowerCase() === n.toLowerCase())) return;
//     setSkills(prev => [...prev, { name: n, yearsOfExp: 0, proficiency: 'intermediate' }]);
//     setSkillInput('');
//   };
//   const removeSkill  = (n) => setSkills(skills.filter(s => s.name !== n));
//   const toggleSkill  = (n) => skills.find(s => s.name === n) ? removeSkill(n) : addSkill(n);
//   const isSkillAdded = (n) => !!skills.find(s => s.name === n);

//   const open   = (key) => setEditing(e => ({ ...e, [key]: true }));
//   const cancel = (key) => setEditing(e => ({ ...e, [key]: false }));

//   const dobDisplay  = f.dob ? new Date(f.dob + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : null;
//   const wageDisplay = lf.dailyWageMin && lf.dailyWageMax ? `₹${lf.dailyWageMin} – ₹${lf.dailyWageMax} / day` : null;

//   return (
//     <div className="space-y-1 animate-fade-in">

//       {/* ── PROFILE BANNER ── */}
//       <div className="bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 rounded-2xl p-5 mb-5 relative overflow-hidden shadow-lg shadow-orange-200">
//         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%,#fff 0%,transparent 50%)' }} />
//         <div className="relative z-10 flex items-center gap-5">
//           <div className="relative flex-shrink-0">
//             <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl" style={{ border: '3px solid rgba(255,255,255,0.3)' }}>
//               <img src={user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=f97316&color=fff&size=96`}
//                 alt={user?.name} className="w-full h-full object-cover" />
//             </div>
//             <button onClick={() => avatarRef.current?.click()} disabled={avatarMut.isPending}
//               className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
//               {avatarMut.isPending ? <Loader2 className="w-4 h-4 text-orange-500 animate-spin" /> : <Camera className="w-4 h-4 text-orange-500" />}
//             </button>
//             <input ref={avatarRef} type="file" accept="image/*" className="hidden"
//               onChange={e => e.target.files[0] && avatarMut.mutate(e.target.files[0])} />
//           </div>
//           <div className="flex-1 min-w-0">
//             <h2 className="font-display font-bold text-xl text-white truncate">{f.name || user?.name}</h2>
//             <p className="text-orange-100 text-sm mt-0.5 truncate">{user?.email}</p>
//             <div className="flex flex-wrap items-center gap-2 mt-2.5">
//               <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 text-white capitalize">
//                 {role === 'labour' ? <HardHat className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />} {role}
//               </span>
//               {user?.isVerified
//                 ? <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-green-400/25 text-green-100"><CheckCircle className="w-3 h-3" /> Verified</span>
//                 : <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-400/25 text-yellow-100"><AlertTriangle className="w-3 h-3" /> Unverified</span>
//               }
//               {role === 'labour' && (
//                 <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${lf.isAvailable ? 'bg-green-400/25 text-green-100' : 'bg-white/15 text-orange-100'}`}>
//                   <span className={`w-2 h-2 rounded-full ${lf.isAvailable ? 'bg-green-300' : 'bg-gray-400'}`} />
//                   {lf.isAvailable ? 'Available' : 'Unavailable'}
//                 </span>
//               )}
//               {role === 'labour' && aadhaarStatus === 'approved' && (
//                 <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-400/25 text-blue-100"><Shield className="w-3 h-3" /> Aadhaar ✓</span>
//               )}
//               {role === 'client' && clientAadhaarStatus === 'approved' && (
//                 <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-400/25 text-blue-100"><Shield className="w-3 h-3" /> Verified ✓</span>
//               )}
//               {role === 'client' && clientAadhaarStatus === 'pending' && (
//                 <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400/25 text-amber-100"><Clock className="w-3 h-3" /> Pending</span>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ── PERSONAL INFORMATION ── */}
//       <Card icon={User} title="Personal Information" accent="orange">
//         <Row label="Full Name" display={f.name} saving={saving.name}
//           open={editing.name} onOpen={() => open('name')} onCancel={() => cancel('name')}
//           onSave={() => savePersonal('name', { name: f.name })}>
//           <input value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} className={field()} placeholder="Your full name" autoFocus />
//         </Row>
//         <Row label="Phone Number" display={f.phone} saving={saving.phone}
//           open={editing.phone} onOpen={() => open('phone')} onCancel={() => cancel('phone')}
//           onSave={() => savePersonal('phone', { phone: f.phone })}>
//           <input value={f.phone} onChange={e => setF(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))} className={field()} maxLength={10} placeholder="10-digit mobile" autoFocus />
//         </Row>
//         <Row label="Date of Birth" display={dobDisplay} saving={saving.dob}
//           open={editing.dob} onOpen={() => open('dob')} onCancel={() => cancel('dob')}
//           onSave={() => savePersonal('dob', { dob: f.dob })}>
//           <input type="date" value={f.dob} onChange={e => setF(p => ({ ...p, dob: e.target.value }))} className={field()} max={new Date().toISOString().split('T')[0]} autoFocus />
//         </Row>
//         <Row label="Gender" display={f.gender} saving={saving.gender}
//           open={editing.gender} onOpen={() => open('gender')} onCancel={() => cancel('gender')}
//           onSave={() => savePersonal('gender', { gender: f.gender })}>
//           <select value={f.gender} onChange={e => setF(p => ({ ...p, gender: e.target.value }))} className={field()}>
//             <option value="">Select gender</option>
//             {['Male', 'Female', 'Other', 'Prefer not to say'].map(g => <option key={g}>{g}</option>)}
//           </select>
//         </Row>
//       </Card>

//       {/* ── EMERGENCY CONTACT (Labour only) ── */}
//       {isLabour && (
//         <Card icon={Phone} title="Emergency Contact" accent="red">
//           {/* Info banner */}
//           <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-2xl mb-4">
//             <Heart className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
//             <div>
//               <p className="text-xs font-bold text-red-800">Required for Labour Safety</p>
//               <p className="text-xs text-red-600 mt-0.5">
//                 In case of workplace injury, admin will contact this person immediately.
//                 This number must be different from your own mobile number.
//               </p>
//             </div>
//           </div>

//           {/* Status indicator */}
//           {f.ecPhone && f.ecName ? (
//             <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl mb-3">
//               <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
//               <div className="flex-1 min-w-0">
//                 <p className="text-xs font-bold text-green-800">{f.ecName} ({f.ecRelation || 'Contact'})</p>
//                 <p className="text-xs text-green-600">+91 {f.ecPhone} · Emergency contact saved</p>
//               </div>
//               <UserCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
//             </div>
//           ) : (
//             <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl mb-3">
//               <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
//               <p className="text-xs font-semibold text-amber-800">Emergency contact not set — please add one</p>
//             </div>
//           )}

//           {/* Form fields */}
//           <div className="space-y-3">
//             {/* Contact name */}
//             <div>
//               <label className="text-xs font-bold text-gray-600 mb-1.5 block">
//                 Contact Person Name <span className="text-red-500">*</span>
//               </label>
//               <input
//                 value={f.ecName}
//                 onChange={e => { setF(p => ({ ...p, ecName: e.target.value })); setEcError(''); }}
//                 className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
//                 placeholder="e.g. Ramesh Kumar"
//               />
//             </div>

//             {/* Relation */}
//             <div>
//               <label className="text-xs font-bold text-gray-600 mb-1.5 block">
//                 Relationship <span className="text-red-500">*</span>
//               </label>
//               <select
//                 value={f.ecRelation}
//                 onChange={e => { setF(p => ({ ...p, ecRelation: e.target.value })); setEcError(''); }}
//                 className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all bg-white"
//               >
//                 <option value="">Select relationship</option>
//                 {['Father','Mother','Spouse / Wife','Spouse / Husband','Brother','Sister','Son','Daughter','Friend','Neighbour','Other'].map(r => (
//                   <option key={r} value={r}>{r}</option>
//                 ))}
//               </select>
//             </div>

//             {/* Emergency phone */}
//             <div>
//               <label className="text-xs font-bold text-gray-600 mb-1.5 block">
//                 Emergency Phone Number <span className="text-red-500">*</span>
//               </label>
//               <div className="relative">
//                 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">+91</span>
//                 <input
//                   value={f.ecPhone}
//                   onChange={e => {
//                     const val = e.target.value.replace(/\D/g, '').slice(0, 10);
//                     setF(p => ({ ...p, ecPhone: val }));
//                     setEcError('');
//                   }}
//                   className={`w-full pl-12 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
//                     ecError
//                       ? 'border-red-400 focus:border-red-400 focus:ring-red-100 bg-red-50'
//                       : f.ecPhone && f.ecPhone === f.phone
//                         ? 'border-red-400 focus:border-red-400 focus:ring-red-100 bg-red-50'
//                         : f.ecPhone?.length === 10 && f.ecPhone !== f.phone
//                           ? 'border-green-400 focus:border-green-400 focus:ring-green-100 bg-green-50'
//                           : 'border-gray-200 focus:border-red-400 focus:ring-red-100'
//                   }`}
//                   placeholder="10-digit mobile number"
//                   maxLength={10}
//                 />
//                 {/* Live validation indicator */}
//                 {(f.ecPhone?.length ?? 0) === 10 && (
//                   <div className="absolute right-3 top-1/2 -translate-y-1/2">
//                     {f.ecPhone === f.phone
//                       ? <X className="w-4 h-4 text-red-500" />
//                       : <Check className="w-4 h-4 text-green-500" />
//                     }
//                   </div>
//                 )}
//               </div>

//               {/* Live comparison hint */}
//               {(f.ecPhone?.length ?? 0) > 0 && f.ecPhone === f.phone && (
//                 <p className="flex items-center gap-1 text-xs text-red-600 font-semibold mt-1.5">
//                   <X className="w-3 h-3" />
//                   This is the same as your own number — use a different number
//                 </p>
//               )}
//               {(f.ecPhone?.length ?? 0) === 10 && f.ecPhone !== f.phone && /^[6-9]\d{9}$/.test(f.ecPhone) && (
//                 <p className="flex items-center gap-1 text-xs text-green-600 font-semibold mt-1.5">
//                   <Check className="w-3 h-3" />
//                   Valid emergency contact number
//                 </p>
//               )}
//             </div>

//             {/* Error message */}
//             {ecError && (
//               <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
//                 <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
//                 <p className="text-xs font-semibold text-red-700">{ecError}</p>
//               </div>
//             )}

//             {/* Save button */}
//             <button
//               onClick={saveEmergencyContact}
//               disabled={!!saving.emergencyContact}
//               className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white text-sm font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-md shadow-red-200 disabled:opacity-60"
//             >
//               {saving.emergencyContact
//                 ? <Loader2 className="w-4 h-4 animate-spin" />
//                 : <Heart className="w-4 h-4" />
//               }
//               {saving.emergencyContact ? 'Saving…' : 'Save Emergency Contact'}
//             </button>
//           </div>
//         </Card>
//       )}

//       {/* ── LOCATION ── */}
//       <Card icon={MapPin} title="Location & Address" accent="blue">
//         <Row label="Street / Landmark" display={f.address} saving={saving.address}
//           open={editing.address} onOpen={() => open('address')} onCancel={() => cancel('address')}
//           onSave={() => savePersonal('address', { ...(f.address && {address: f.address}), ...(f.city && {city: f.city}), ...(f.state && {state: f.state}), ...(f.pincode && {pincode: f.pincode}) })}>
//           <input value={f.address} onChange={e => setF(p => ({ ...p, address: e.target.value }))} className={field()} placeholder="Building / Street / Landmark" autoFocus />
//         </Row>
//         <Row label="State" display={f.state} saving={saving.state}
//           open={editing.state} onOpen={() => open('state')} onCancel={() => cancel('state')}
//           onSave={() => savePersonal('state', { state: f.state, ...(f.city && {city: f.city}) })}>
//           <StateSelect value={f.state} onChange={v => setF(p => ({ ...p, state: v, city: '' }))} />
//         </Row>
//         <Row label="City" display={f.city} saving={saving.city}
//           open={editing.city} onOpen={() => open('city')} onCancel={() => cancel('city')}
//           onSave={() => savePersonal('city', { city: f.city, ...(f.state && {state: f.state}) })}>
//           <CitySelect value={f.city} onChange={v => setF(p => ({ ...p, city: v }))} stateVal={f.state} />
//         </Row>
//         <Row label="Pincode" display={f.pincode} saving={saving.pincode}
//           open={editing.pincode} onOpen={() => open('pincode')} onCancel={() => cancel('pincode')}
//           onSave={() => savePersonal('pincode', { pincode: f.pincode })}>
//           <input value={f.pincode} onChange={e => setF(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '') }))} className={field()} maxLength={6} placeholder="6-digit pincode" autoFocus />
//         </Row>
//       </Card>

//       {/* ══ LABOUR SECTION ══ */}
//       {role === 'labour' && (
//         <>
//           <Card icon={CheckCircle} title="Work Availability" accent="green">
//             <div className="flex items-center justify-between py-2">
//               <div className="flex-1">
//                 <p className="font-semibold text-gray-800 text-sm flex items-center gap-2">
//                   <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${lf.isAvailable ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
//                   {lf.isAvailable ? 'Available for Work' : 'Currently Unavailable'}
//                 </p>
//                 <p className="text-xs text-gray-400 mt-1">
//                   {lf.isAvailable ? 'Clients can find you and send job offers.' : 'Your profile is hidden from client search.'}
//                 </p>
//               </div>
//               <button
//                 onClick={() => { setLf(p => ({ ...p, isAvailable: !p.isAvailable })); setTimeout(() => saveLabour('isAvailable', { isAvailable: !lf.isAvailable }), 0); }}
//                 disabled={saving.isAvailable}
//                 className={`relative flex-shrink-0 rounded-full transition-all duration-300 ${lf.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}
//                 style={{ width: 52, height: 28 }}
//               >
//                 {saving.isAvailable
//                   ? <span className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-4 h-4 text-white animate-spin" /></span>
//                   : <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${lf.isAvailable ? 'left-7' : 'left-1'}`} />
//                 }
//               </button>
//             </div>
//           </Card>

//           <Card icon={Briefcase} title="Professional Details" accent="green">
//             <Row label="About You / Bio" display={lf.bio} saving={saving.bio}
//               open={editing.bio} onOpen={() => open('bio')} onCancel={() => cancel('bio')}
//               onSave={() => saveLabour('bio')}>
//               <textarea value={lf.bio} onChange={e => setLf(p => ({ ...p, bio: e.target.value }))}
//                 className={field('resize-none')} rows={3} placeholder="Describe your experience…" maxLength={500} autoFocus />
//               <p className="text-xs text-gray-400 text-right">{lf.bio.length}/500</p>
//             </Row>
//             <Row label="Years of Experience" display={lf.experience ? `${lf.experience} year${lf.experience !== 1 ? 's' : ''}` : null} saving={saving.experience}
//               open={editing.experience} onOpen={() => open('experience')} onCancel={() => cancel('experience')}
//               onSave={() => saveLabour('experience')}>
//               <input type="number" value={lf.experience} min={0} max={50}
//                 onChange={e => setLf(p => ({ ...p, experience: Math.max(0, +e.target.value) }))} className={field()} autoFocus />
//             </Row>
//             <Row label="Daily Wage Range" display={wageDisplay} saving={saving.wage}
//               open={editing.wage} onOpen={() => open('wage')} onCancel={() => cancel('wage')}
//               onSave={() => saveLabour('wage')}>
//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <p className="text-xs text-gray-500 mb-1">Minimum (₹)</p>
//                   <input type="number" value={lf.dailyWageMin} onChange={e => setLf(p => ({ ...p, dailyWageMin: e.target.value }))} className={field()} placeholder="Min ₹" autoFocus min={0} />
//                 </div>
//                 <div>
//                   <p className="text-xs text-gray-500 mb-1">Maximum (₹)</p>
//                   <input type="number" value={lf.dailyWageMax} onChange={e => setLf(p => ({ ...p, dailyWageMax: e.target.value }))} className={field()} placeholder="Max ₹" min={0} />
//                 </div>
//               </div>
//             </Row>
//             <Row label="Working Radius" display={lf.workingRadius ? `${lf.workingRadius} km from my location` : null} saving={saving.workingRadius}
//               open={editing.workingRadius} onOpen={() => open('workingRadius')} onCancel={() => cancel('workingRadius')}
//               onSave={() => saveLabour('workingRadius')}>
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between text-xs text-gray-500">
//                   <span>5 km</span>
//                   <span className="font-bold text-orange-600 text-base">{lf.workingRadius} km</span>
//                   <span>100 km</span>
//                 </div>
//                 <input type="range" min={5} max={100} step={5} value={lf.workingRadius}
//                   onChange={e => setLf(p => ({ ...p, workingRadius: +e.target.value }))}
//                   className="w-full accent-orange-500 h-2 cursor-pointer" />
//               </div>
//             </Row>
//             <Row label="Preferred Shift" display={lf.preferredShift ? lf.preferredShift.charAt(0).toUpperCase() + lf.preferredShift.slice(1) : null} saving={saving.preferredShift}
//               open={editing.preferredShift} onOpen={() => open('preferredShift')} onCancel={() => cancel('preferredShift')}
//               onSave={() => saveLabour('preferredShift')}>
//               <div className="grid grid-cols-2 gap-2">
//                 {['morning','evening','night','flexible'].map(s => (
//                   <button key={s} type="button" onClick={() => setLf(p => ({ ...p, preferredShift: s }))}
//                     className={`py-2.5 rounded-xl text-xs font-semibold capitalize border-2 transition-all ${lf.preferredShift === s ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50'}`}>
//                     {s==='morning'?'🌅':s==='evening'?'🌇':s==='night'?'🌙':'⏰'} {s}
//                   </button>
//                 ))}
//               </div>
//             </Row>
//             <Row label="Preferred Job Categories"
//               display={lf.preferredCategories?.length ? lf.preferredCategories.slice(0,3).join(', ')+(lf.preferredCategories.length>3?` +${lf.preferredCategories.length-3}`:'') : null}
//               saving={saving.preferredCategories}
//               open={editing.preferredCategories} onOpen={() => open('preferredCategories')} onCancel={() => cancel('preferredCategories')}
//               onSave={() => saveLabour('preferredCategories')}>
//               <div className="flex flex-wrap gap-2">
//                 {JOB_CATEGORIES.map(cat => {
//                   const sel = lf.preferredCategories?.includes(cat.value);
//                   return (
//                     <button key={cat.value} type="button"
//                       onClick={() => setLf(p => ({ ...p, preferredCategories: sel ? p.preferredCategories.filter(c => c !== cat.value) : [...(p.preferredCategories||[]), cat.value] }))}
//                       className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${sel ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50'}`}>
//                       {sel && <span className="mr-1">✓</span>}{cat.label}
//                     </button>
//                   );
//                 })}
//               </div>
//             </Row>
//           </Card>

//           <Card icon={Star} title="Skills" accent="amber">
//             <div className="space-y-4">
//               {SKILL_CATS.map(({ cat, color, skills: catSkills }) => {
//                 const anyAdded = catSkills.some(s => isSkillAdded(s));
//                 return (
//                   <div key={cat}>
//                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
//                       {cat}
//                       {anyAdded && <span className="normal-case font-semibold text-green-600 text-[10px]">• some added</span>}
//                     </p>
//                     <div className="flex flex-wrap gap-1.5">
//                       {catSkills.map(s => {
//                         const added = isSkillAdded(s);
//                         return (
//                           <button key={s} type="button" onClick={() => toggleSkill(s)}
//                             className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${added ? 'bg-primary-100 border-primary-400 text-primary-700 shadow-sm' : CLR[color]||CLR.slate}`}>
//                             {added ? <Check style={{width:10,height:10}} /> : <Plus style={{width:10,height:10}} />} {s}
//                           </button>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 );
//               })}
//               <div className="flex gap-2 pt-3 border-t border-gray-100">
//                 <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
//                   onKeyDown={e => e.key==='Enter' && (e.preventDefault(), addSkill())}
//                   className={field('flex-1')} placeholder="Type a custom skill and press Add…" />
//                 <button type="button" onClick={() => addSkill()}
//                   className="px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors flex items-center gap-1.5">
//                   <Plus className="w-4 h-4" /> Add
//                 </button>
//               </div>
//               {skills.length > 0 && (
//                 <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
//                   <div className="flex items-center justify-between mb-2">
//                     <p className="text-xs font-bold text-primary-700">✓ {skills.length} skill{skills.length!==1?'s':''} on your profile</p>
//                     <button onClick={() => saveLabour('skills')} disabled={saving.skills}
//                       className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors disabled:opacity-60">
//                       {saving.skills ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save Skills
//                     </button>
//                   </div>
//                   <div className="flex flex-wrap gap-1.5">
//                     {skills.map(s => (
//                       <span key={s.name} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-primary-200 text-xs font-medium text-primary-700">
//                         {s.name}
//                         <button type="button" onClick={() => removeSkill(s.name)} className="hover:text-red-500 ml-0.5 transition-colors">
//                           <X style={{width:10,height:10}} />
//                         </button>
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </Card>

//           <Card icon={Shield} title="Identity Verification (Aadhaar)" accent="indigo">
//             {aadhaarStatus === 'approved' && (
//               <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
//                 <CheckCircle className="w-7 h-7 text-green-600 flex-shrink-0" />
//                 <div>
//                   <p className="font-bold text-green-800 text-sm">Aadhaar Verified ✓</p>
//                   <p className="text-xs text-green-600 mt-0.5">Your identity has been confirmed. Verified badge is active on your profile.</p>
//                 </div>
//               </div>
//             )}
//             {aadhaarStatus === 'pending' && (
//               <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
//                 <Clock className="w-7 h-7 text-amber-600 flex-shrink-0" />
//                 <div>
//                   <p className="font-bold text-amber-800 text-sm">Under Review</p>
//                   <p className="text-xs text-amber-600 mt-0.5">Your document is being reviewed. Usually takes 24 hours.</p>
//                 </div>
//               </div>
//             )}
//             {aadhaarStatus === 'rejected' && (
//               <div className="space-y-3">
//                 <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
//                   <AlertTriangle className="w-7 h-7 text-red-600 flex-shrink-0" />
//                   <div>
//                     <p className="font-bold text-red-800 text-sm">Not Approved — Please Re-upload</p>
//                     <p className="text-xs text-red-600 mt-0.5">Upload a clearer, well-lit photo of your Aadhaar card.</p>
//                   </div>
//                 </div>
//                 <button onClick={() => aadhaarRef.current?.click()} disabled={aadhaarMut.isPending}
//                   className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-60 shadow-sm">
//                   {aadhaarMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Re-upload Aadhaar
//                 </button>
//               </div>
//             )}
//             {!aadhaarStatus && (
//               <div className="space-y-4">
//                 <p className="text-sm text-gray-600 leading-relaxed">
//                   Upload your <strong>Aadhaar card (front side)</strong> to get the Verified badge. Verified workers get <strong>3x more job offers</strong>.
//                 </p>
//                 <ul className="text-xs text-gray-500 space-y-1">
//                   <li>✓ Accepted: JPG, PNG, PDF</li>
//                   <li>✓ Photo must be clear and well-lit</li>
//                   <li>✓ All 4 corners must be visible</li>
//                 </ul>
//                 <button onClick={() => aadhaarRef.current?.click()} disabled={aadhaarMut.isPending}
//                   className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-60 shadow-sm">
//                   {aadhaarMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload Aadhaar Card
//                 </button>
//               </div>
//             )}
//             <input ref={aadhaarRef} type="file" accept="image/*,application/pdf" className="hidden"
//               onChange={e => e.target.files[0] && aadhaarMut.mutate(e.target.files[0])} />
//           </Card>
//         </>
//       )}

//       {/* ══ CLIENT SECTION ══ */}
//       {role === 'client' && (
//         <>
//           <Card icon={Shield} title="Identity Verification (Aadhaar)" accent="indigo">
//             {clientAadhaarStatus === 'approved' && (
//               <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-2xl">
//                 <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
//                   <CheckCircle className="w-6 h-6 text-green-600" />
//                 </div>
//                 <div>
//                   <p className="font-bold text-green-800 text-sm">Identity Verified ✓</p>
//                   <p className="text-xs text-green-600 mt-0.5">Your Aadhaar has been verified. Verified badge is active on your profile.</p>
//                 </div>
//               </div>
//             )}
//             {clientAadhaarStatus === 'pending' && (
//               <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
//                 <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
//                   <Clock className="w-6 h-6 text-amber-600" />
//                 </div>
//                 <div>
//                   <p className="font-bold text-amber-800 text-sm">Document Under Review</p>
//                   <p className="text-xs text-amber-600 mt-0.5">Our admin team is reviewing your document. Usually takes 24 hours.</p>
//                 </div>
//               </div>
//             )}
//             {clientAadhaarStatus === 'rejected' && (
//               <div className="space-y-3">
//                 <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
//                   <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
//                     <AlertTriangle className="w-6 h-6 text-red-600" />
//                   </div>
//                   <div>
//                     <p className="font-bold text-red-800 text-sm">Not Approved — Please Re-upload</p>
//                     <p className="text-xs text-red-600 mt-0.5">Upload a clearer, well-lit photo of your Aadhaar card.</p>
//                   </div>
//                 </div>
//                 <button onClick={() => clientAadhaarRef.current?.click()} disabled={clientAadhaarMut.isPending}
//                   className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-60">
//                   {clientAadhaarMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Re-upload Aadhaar
//                 </button>
//               </div>
//             )}
//             {(clientAadhaarStatus === 'not_submitted' || !clientAadhaarStatus) && (
//               <div className="space-y-4">
//                 <p className="text-sm text-gray-600 leading-relaxed">
//                   Upload your <strong>Aadhaar card (front side)</strong> to get the Verified badge and build trust with workers.
//                 </p>
//                 <ul className="text-xs text-gray-500 space-y-1.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
//                   <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Accepted formats: JPG, PNG</li>
//                   <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Photo must be clear and well-lit</li>
//                   <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> All 4 corners of the card must be visible</li>
//                 </ul>
//                 <button onClick={() => clientAadhaarRef.current?.click()} disabled={clientAadhaarMut.isPending}
//                   className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-60 shadow-sm">
//                   {clientAadhaarMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload Aadhaar Card
//                 </button>
//               </div>
//             )}
//             <input ref={clientAadhaarRef} type="file" accept="image/*" className="hidden"
//               onChange={e => e.target.files[0] && clientAadhaarMut.mutate(e.target.files[0])} />
//           </Card>

//           <Card icon={Building2} title="Business Details" accent="blue">
//             <Row label="Company Name" display={cf.companyName} saving={saving.companyName}
//               open={editing.companyName} onOpen={() => open('companyName')} onCancel={() => cancel('companyName')}
//               onSave={() => saveClient('companyName')}>
//               <input value={cf.companyName} onChange={e => setCf(p => ({ ...p, companyName: e.target.value }))} className={field()} placeholder="Your company name" autoFocus />
//             </Row>
//             <Row label="Company Type" display={cf.companyType?.replace('_',' ')} saving={saving.companyType}
//               open={editing.companyType} onOpen={() => open('companyType')} onCancel={() => cancel('companyType')}
//               onSave={() => saveClient('companyType')}>
//               <select value={cf.companyType} onChange={e => setCf(p => ({ ...p, companyType: e.target.value }))} className={field()}>
//                 {['individual','small_business','contractor','enterprise'].map(t => (
//                   <option key={t} value={t}>{t.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>
//                 ))}
//               </select>
//             </Row>
//             <Row label="Industry" display={cf.industryType} saving={saving.industryType}
//               open={editing.industryType} onOpen={() => open('industryType')} onCancel={() => cancel('industryType')}
//               onSave={() => saveClient('industryType')}>
//               <input value={cf.industryType} onChange={e => setCf(p => ({ ...p, industryType: e.target.value }))} className={field()} placeholder="e.g. Construction, Real Estate" autoFocus />
//             </Row>
//             <Row label="GST Number" display={cf.gstNumber} saving={saving.gstNumber}
//               open={editing.gstNumber} onOpen={() => open('gstNumber')} onCancel={() => cancel('gstNumber')}
//               onSave={() => saveClient('gstNumber')}>
//               <input value={cf.gstNumber} onChange={e => setCf(p => ({ ...p, gstNumber: e.target.value }))} className={field()} placeholder="Optional" autoFocus />
//             </Row>
//             <Row label="Website" display={cf.websiteUrl} saving={saving.websiteUrl}
//               open={editing.websiteUrl} onOpen={() => open('websiteUrl')} onCancel={() => cancel('websiteUrl')}
//               onSave={() => saveClient('websiteUrl')}>
//               <input value={cf.websiteUrl} onChange={e => setCf(p => ({ ...p, websiteUrl: e.target.value }))} className={field()} placeholder="https://yourcompany.com" autoFocus />
//             </Row>
//             <Row label="Preferred Payment Mode" display={cf.preferredPaymentMode?.replace('_',' ')} saving={saving.preferredPaymentMode}
//               open={editing.preferredPaymentMode} onOpen={() => open('preferredPaymentMode')} onCancel={() => cancel('preferredPaymentMode')}
//               onSave={() => saveClient('preferredPaymentMode')}>
//               <div className="grid grid-cols-2 gap-2">
//                 {['cash','upi','bank_transfer','cheque'].map(m => (
//                   <button key={m} type="button" onClick={() => setCf(p => ({ ...p, preferredPaymentMode: m }))}
//                     className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${cf.preferredPaymentMode===m ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50'}`}>
//                     {m.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
//                   </button>
//                 ))}
//               </div>
//             </Row>
//           </Card>
//         </>
//       )}

//     </div>
//   );
// }

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, Check, X, Edit2, Loader2, ChevronDown,
  MapPin, User, Briefcase, Shield, Star, Plus,
  Upload, CheckCircle, AlertTriangle, HardHat,
  Building2, IndianRupee, Clock, ToggleLeft,
  ToggleRight, Save, Phone, Heart, UserCheck,
  ShieldAlert, XCircle, Info
} from 'lucide-react';
import { useAuth }                     from '@/context/AuthContext';
import { useSocket }                   from '@/context/SocketContext';
import { useMutation }                 from '@tanstack/react-query';
import userService                     from '@/services/userService';
import { INDIA_STATES }                from '@/utils/indiaData';
import { JOB_CATEGORIES }             from '@/utils/helpers';
import toast                           from 'react-hot-toast';
import api                             from '@/services/api';

const SKILL_CATS = [
  { cat:'Construction & Civil',    color:'orange', skills:['Masonry','Bricklaying','Plastering','Concrete Work','Tiling','Waterproofing','Scaffolding','Demolition'] },
  { cat:'Electrical',              color:'yellow', skills:['Electrical Wiring','Switchboard Fitting','MCB / Fuse Box','Fan Installation','AC Installation','Solar Panel','CCTV Fitting','Inverter Setup'] },
  { cat:'Plumbing & Sanitation',   color:'blue',   skills:['Pipe Fitting','Tap Repair','Bathroom Fitting','Drainage Work','Water Tank Cleaning','Geyser Repair','RO Fitting','Overhead Tank'] },
  { cat:'Painting & Finishing',    color:'pink',   skills:['Wall Painting','Texture Painting','Waterproof Coating','Putty Work','Polishing','Wood Painting','Spray Painting','Stencil Work'] },
  { cat:'Carpentry & Woodwork',    color:'amber',  skills:['Furniture Making','Door & Window Fitting','Modular Kitchen','False Ceiling','Wood Polish','Almirah Making','Bed Making','Cabinet Work'] },
  { cat:'Welding & Fabrication',   color:'red',    skills:['Arc Welding','MIG Welding','Gate Making','Railing Work','Steel Fabrication','Grill Work','Pipe Welding','Sheet Metal'] },
  { cat:'Cleaning & Housekeeping', color:'teal',   skills:['House Cleaning','Sofa Cleaning','Carpet Cleaning','Kitchen Cleaning','Office Cleaning','Glass Cleaning','Pest Control','Sanitisation'] },
  { cat:'Other Services',          color:'slate',  skills:['Gardening','Driving','Security Guard','Cook / Helper','Moving & Packing','AC Service','Appliance Repair','CCTV Maintenance'] },
];

const CLR = {
  orange:'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
  yellow:'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100',
  blue:  'bg-blue-50  border-blue-200  text-blue-700  hover:bg-blue-100',
  pink:  'bg-pink-50  border-pink-200  text-pink-700  hover:bg-pink-100',
  amber: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
  red:   'bg-red-50   border-red-200   text-red-700   hover:bg-red-100',
  teal:  'bg-teal-50  border-teal-200  text-teal-700  hover:bg-teal-100',
  slate: 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100',
};

const field = (extra='') =>
  `w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white text-gray-800 placeholder-gray-400 transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${extra}`;

/* ─── Age Calculation Helper ─────────────────────────────────────────────── */
const calculateAge = (dobString) => {
  if (!dobString) return null;
  const dob = new Date(dobString + 'T00:00:00');
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

const MIN_AGE = 18;

/* ─── Underage Popup Modal ───────────────────────────────────────────────── */
const UnderageModal = ({ age, onClose }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    style={{ backdropFilter: 'blur(10px)', background: 'rgba(15,23,42,0.6)' }}
    onClick={onClose}
  >
    <div
      className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
      style={{ animation: 'scaleIn .3s cubic-bezier(.34,1.4,.64,1) both' }}
      onClick={e => e.stopPropagation()}
    >
      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-red-500 via-red-600 to-orange-600 px-8 pt-8 pb-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff 0%, transparent 50%)' }} />
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-xl text-white">Age Verification Failed</h3>
          <p className="text-red-100 text-sm mt-1">Minimum Age Requirement Not Met</p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-7 space-y-5">
        {/* Aadhaar Notice */}
        <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-blue-800">Important Notice</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Please ensure all your details are entered exactly as per your <strong>Aadhaar Card</strong>. 
              Any mismatch may lead to verification failure.
            </p>
          </div>
        </div>

        {/* Age Alert Box */}
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-7 h-7 text-red-600" />
          </div>
          <h4 className="font-bold text-red-800 text-lg">Not Eligible to Register</h4>
          <p className="text-sm text-red-600 mt-2 leading-relaxed">
            As per government regulations and our platform policy, the minimum age to register 
            on <strong>Labour Connect</strong> is <strong>{MIN_AGE} years</strong>.
          </p>
          {age !== null && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-100 rounded-xl">
              <span className="text-xs font-bold text-red-700">Your Age:</span>
              <span className="text-lg font-extrabold text-red-800">{age} years</span>
            </div>
          )}
        </div>

        {/* Formal Message */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong>Dear User,</strong><br /><br />
            We regret to inform you that you are <strong>not eligible</strong> to register on Labour Connect 
            at this time. As per the <strong>Child Labour (Prohibition and Regulation) Act</strong> and our 
            platform's safety policies, all users must be at least <strong>18 years of age</strong> to create 
            an account and access our services.
            <br /><br />
            We appreciate your interest and encourage you to register once you meet the age requirement. 
            For any queries, please contact our support team.
          </p>
        </div>

        {/* Restrictions Info */}
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">Form Restricted</p>
            <p className="text-xs text-amber-600 mt-0.5">
              All other profile fields have been disabled. You cannot save or update your profile until you meet the minimum age requirement.
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white text-sm font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-200 active:scale-[0.98]"
        >
          <Check className="w-4 h-4" /> I Understand
        </button>

        <p className="text-[10px] text-gray-400 text-center">
          If you believe this is an error, please contact <strong>support@labourconnect.in</strong>
        </p>
      </div>
    </div>
  </div>
);

/* ─── Underage Blocking Banner (persistent) ──────────────────────────────── */
const UnderageBanner = ({ age }) => (
  <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 mb-5 shadow-sm">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
        <ShieldAlert className="w-6 h-6 text-red-600" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-red-800 text-sm">Profile Editing Blocked — Age Below {MIN_AGE}</h3>
          <span className="px-2.5 py-0.5 rounded-full bg-red-200 text-red-800 text-[10px] font-bold uppercase tracking-wider">
            Restricted
          </span>
        </div>
        <p className="text-xs text-red-600 mt-1.5 leading-relaxed">
          Your date of birth indicates you are <strong>{age} years old</strong>. The minimum age to use Labour Connect is 
          <strong> {MIN_AGE} years</strong>. All form fields are currently disabled. Please update your date of birth if this is incorrect, 
          or contact support for assistance.
        </p>
      </div>
    </div>
  </div>
);

const Card = ({ icon: Icon, title, accent='orange', children, disabled = false }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden relative ${disabled ? 'opacity-50 pointer-events-none select-none' : ''}`}>
    {disabled && (
      <div className="absolute inset-0 z-20 bg-gray-100/30 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-red-100 border border-red-300 rounded-xl shadow-sm">
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <span className="text-xs font-bold text-red-700">Blocked — Age below {MIN_AGE}</span>
        </div>
      </div>
    )}
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
      <div className={`w-8 h-8 rounded-xl bg-${accent}-100 flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 text-${accent}-600`} />
      </div>
      <h3 className="font-semibold text-sm text-gray-800">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Row = ({ label, display, saving, open, onOpen, onCancel, onSave, children, disabled = false }) => (
  <div className="py-3.5 border-b border-gray-50 last:border-0">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        {!open && (
          <p className="text-sm font-medium text-gray-800 break-words">
            {display || <span className="text-gray-400 italic text-xs">Not set — click Edit to add</span>}
          </p>
        )}
      </div>
      {!open && (
        <button onClick={onOpen} disabled={disabled}
          className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 transition-all mt-0.5 ${
            disabled
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50'
          }`}>
          <Edit2 className="w-3 h-3" /> Edit
        </button>
      )}
    </div>
    {open && (
      <div className="mt-2 space-y-2">
        {children}
        <div className="flex gap-2 pt-1">
          <button onClick={onSave} disabled={saving || disabled}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 disabled:opacity-60 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save
          </button>
          <button onClick={onCancel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      </div>
    )}
  </div>
);

const StateSelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [q,    setQ]    = useState('');
  const ref = useRef();
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);
  const list = INDIA_STATES.filter(s => s.state.toLowerCase().includes(q.toLowerCase()));
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`${field()} flex items-center justify-between cursor-pointer`}>
        <span className={value ? '' : 'text-gray-400 italic text-xs'}>{value || 'Select state'}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input value={q} onChange={e => setQ(e.target.value)} autoFocus placeholder="Search state…"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-orange-400" />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {list.map(s => (
              <button key={s.state} type="button"
                onClick={() => { onChange(s.state); setOpen(false); setQ(''); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === s.state ? 'bg-orange-50 text-orange-700 font-semibold' : 'hover:bg-orange-50 hover:text-orange-700'}`}>
                {s.state}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CitySelect = ({ value, onChange, stateVal }) => {
  const [open, setOpen] = useState(false);
  const [q,    setQ]    = useState('');
  const ref = useRef();
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);
  const cities = (INDIA_STATES.find(s => s.state === stateVal)?.cities || []).filter(c => c.toLowerCase().includes(q.toLowerCase()));
  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={!stateVal} onClick={() => stateVal && setOpen(o => !o)}
        className={`${field()} flex items-center justify-between ${!stateVal ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
        <span className={value ? '' : 'text-gray-400 italic text-xs'}>{value || (stateVal ? 'Select city' : 'Select state first')}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && stateVal && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input value={q} onChange={e => setQ(e.target.value)} autoFocus placeholder="Search city…"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-orange-400" />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {cities.map(c => (
              <button key={c} type="button"
                onClick={() => { onChange(c); setOpen(false); setQ(''); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === c ? 'bg-orange-50 text-orange-700 font-semibold' : 'hover:bg-orange-50 hover:text-orange-700'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════════ */
export default function GeneralSection() {
  const { user, updateUser } = useAuth();
  const { on }  = useSocket();
  const role     = user?.role || 'labour';
  const isLabour = role === 'labour';
  const isClient = role === 'client';
  const profile  = isLabour ? (user?.labourProfile || {}) : (user?.clientProfile || {});

  // ─── Age-gate state ─────────────────────────────────────────────────────
  const [showUnderageModal, setShowUnderageModal] = useState(false);
  const [isUnderage, setIsUnderage]               = useState(false);
  const [currentAge, setCurrentAge]               = useState(null);

  // Real-time: update verified status when admin approves/rejects
  useEffect(() => {
    const off = on('verification:updated', ({ status, isVerified }) => {
      updateUser({ ...user, isVerified: isVerified ?? (status === 'approved') });
      refetchUser();
    });
    return () => off?.();
  }, [on, user, updateUser]);

  const avatarRef        = useRef();
  const aadhaarRef       = useRef();
  const clientAadhaarRef = useRef();

  const [f, setF] = useState({
    name:    user?.name              || '',
    phone:   user?.phone             || '',
    dob:     user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
    gender:  user?.gender            || '',
    address: user?.location?.address || '',
    state:   user?.location?.state   || '',
    city:    user?.location?.city    || '',
    pincode: user?.location?.pincode || '',
    ecName:     user?.emergencyContact?.name     || '',
    ecPhone:    user?.emergencyContact?.phone    || '',
    ecRelation: user?.emergencyContact?.relation || '',
  });

  // Emergency contact local error state
  const [ecError, setEcError] = useState('');

  useEffect(() => {
    setF({
      name:    user?.name              || '',
      phone:   user?.phone             || '',
      dob:     user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
      gender:  user?.gender            || '',
      address: user?.location?.address || '',
      state:   user?.location?.state   || '',
      city:    user?.location?.city    || '',
      pincode: user?.location?.pincode || '',
      ecName:     user?.emergencyContact?.name     || '',
      ecPhone:    user?.emergencyContact?.phone    || '',
      ecRelation: user?.emergencyContact?.relation || '',
    });
  }, [user?.name, user?.phone, user?.dob, user?.gender,
      user?.location?.address, user?.location?.state,
      user?.location?.city, user?.location?.pincode,
      user?.emergencyContact?.name, user?.emergencyContact?.phone,
      user?.emergencyContact?.relation]);

  // ─── Check age whenever DOB changes ────────────────────────────────────
  useEffect(() => {
    if (f.dob) {
      const age = calculateAge(f.dob);
      setCurrentAge(age);
      if (age !== null && age < MIN_AGE) {
        setIsUnderage(true);
        setShowUnderageModal(true);
      } else {
        setIsUnderage(false);
      }
    } else {
      setCurrentAge(null);
      setIsUnderage(false);
    }
  }, [f.dob]);

  const [lf, setLf] = useState({
    bio:                  profile.bio                  || '',
    experience:           profile.experience           || 0,
    dailyWageMin:         profile.dailyWageMin         || '',
    dailyWageMax:         profile.dailyWageMax         || '',
    workingRadius:        profile.workingRadius        || 20,
    preferredShift:       profile.preferredShift       || 'flexible',
    isAvailable:          profile.isAvailable          ?? true,
    preferredCategories:  profile.preferredCategories  || [],
  });

  const [cf, setCf] = useState({
    companyName:          profile.companyName          || '',
    companyType:          profile.companyType          || 'individual',
    industryType:         profile.industryType         || '',
    gstNumber:            profile.gstNumber            || '',
    websiteUrl:           profile.websiteUrl           || '',
    preferredPaymentMode: profile.preferredPaymentMode || 'upi',
  });

  const [skills,     setSkills]     = useState(profile.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [saving,     setSaving]     = useState({});
  const [editing,    setEditing]    = useState({});

  const refetchUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const u   = res.data.data;
      updateUser({ ...u, location: u.location || {} });
      const p = u.role === 'labour' ? (u.labourProfile || {}) : (u.clientProfile || {});
      setF({
        name:       u.name              || '',
        phone:      u.phone             || '',
        dob:        u.dob ? new Date(u.dob).toISOString().split('T')[0] : '',
        gender:     u.gender            || '',
        address:    u.location?.address || '',
        state:      u.location?.state   || '',
        city:       u.location?.city    || '',
        pincode:    u.location?.pincode || '',
        ecName:     u.emergencyContact?.name     || '',
        ecPhone:    u.emergencyContact?.phone    || '',
        ecRelation: u.emergencyContact?.relation || '',
      });
      setLf(prev => ({
        ...prev,
        bio:                 p.bio                  ?? prev.bio,
        experience:          p.experience           ?? prev.experience,
        dailyWageMin:        p.dailyWageMin         ?? prev.dailyWageMin,
        dailyWageMax:        p.dailyWageMax         ?? prev.dailyWageMax,
        workingRadius:       p.workingRadius        ?? prev.workingRadius,
        preferredShift:      p.preferredShift       ?? prev.preferredShift,
        isAvailable:         p.isAvailable          ?? prev.isAvailable,
        preferredCategories: p.preferredCategories  ?? prev.preferredCategories,
      }));
      setSkills(p.skills || []);
      setCf(prev => ({
        companyName:          p.companyName          || prev.companyName,
        companyType:          p.companyType          || prev.companyType,
        industryType:         p.industryType         || prev.industryType,
        gstNumber:            p.gstNumber            || prev.gstNumber,
        websiteUrl:           p.websiteUrl           || prev.websiteUrl,
        preferredPaymentMode: p.preferredPaymentMode || prev.preferredPaymentMode,
      }));
    } catch (_) {}
  }, [updateUser]);

  const savePersonal = async (key, payload) => {
    // ─── Block save if underage (except DOB itself) ───
    if (isUnderage && key !== 'dob') {
      toast.error('Profile editing is blocked. Minimum age is 18 years.');
      return;
    }
    setSaving(s => ({ ...s, [key]: true }));
    try {
      const res = await userService.updateProfile(payload);
      const updatedUser = res?.data?.data;
      if (updatedUser) {
        updateUser(updatedUser);
        setF({
          name:    updatedUser.name              || '',
          phone:   updatedUser.phone             || '',
          dob:     updatedUser.dob ? new Date(updatedUser.dob).toISOString().split('T')[0] : '',
          gender:  updatedUser.gender            || '',
          address: updatedUser.location?.address || '',
          state:   updatedUser.location?.state   || '',
          city:    updatedUser.location?.city    || '',
          pincode: updatedUser.location?.pincode || '',
          ecName:     updatedUser.emergencyContact?.name     || '',
          ecPhone:    updatedUser.emergencyContact?.phone    || '',
          ecRelation: updatedUser.emergencyContact?.relation || '',
        });
      } else {
        await refetchUser();
      }
      setEditing(e => ({ ...e, [key]: false }));
      toast.success('Saved!');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Save failed');
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  /* ── Save emergency contact ─────────────────────────────────────────────── */
  const saveEmergencyContact = async () => {
    if (isUnderage) {
      toast.error('Profile editing is blocked. Minimum age is 18 years.');
      return;
    }
    setEcError('');
    if (!f.ecName.trim()) { setEcError('Contact person name is required'); return; }
    if (!f.ecPhone.trim()) { setEcError('Emergency phone number is required'); return; }
    if (!f.ecRelation.trim()) { setEcError('Relationship is required'); return; }
    if (!/^[6-9]\d{9}$/.test(f.ecPhone)) { setEcError('Enter a valid 10-digit Indian mobile number'); return; }
    if (f.ecPhone === f.phone) { setEcError('Emergency contact number cannot be the same as your own mobile number'); return; }
    if (/^(\d)\1{9}$/.test(f.ecPhone)) { setEcError('Please enter a real phone number'); return; }
    await savePersonal('emergencyContact', {
      emergencyContact: { name: f.ecName.trim(), phone: f.ecPhone, relation: f.ecRelation.trim() },
    });
    setEcError('');
  };

  const saveLabour = async (key, extra = {}) => {
    if (isUnderage) {
      toast.error('Profile editing is blocked. Minimum age is 18 years.');
      return;
    }
    setSaving(s => ({ ...s, [key]: true }));
    const sanitized = {
      ...lf, skills, ...extra,
      dailyWageMin:  lf.dailyWageMin  === '' ? 0 : Number(lf.dailyWageMin)  || 0,
      dailyWageMax:  lf.dailyWageMax  === '' ? 0 : Number(lf.dailyWageMax)  || 0,
      experience:    lf.experience    === '' ? 0 : Number(lf.experience)    || 0,
      workingRadius: lf.workingRadius === '' ? 20 : Number(lf.workingRadius) || 20,
    };
    try {
      await userService.updateLabourProfile(sanitized);
      await refetchUser();
      setEditing(e => ({ ...e, [key]: false }));
      toast.success('Saved!');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Save failed');
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  const saveClient = async (key) => {
    if (isUnderage) {
      toast.error('Profile editing is blocked. Minimum age is 18 years.');
      return;
    }
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await userService.updateClientProfile(cf);
      await refetchUser();
      setEditing(e => ({ ...e, [key]: false }));
      toast.success('Saved!');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Save failed');
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  const avatarMut = useMutation({
    mutationFn: (file) => {
      if (isUnderage) throw new Error('Profile editing is blocked. Minimum age is 18 years.');
      const fd = new FormData(); fd.append('avatar', file); return userService.uploadAvatar(fd);
    },
    onSuccess: async () => { await refetchUser(); toast.success('Photo updated!'); },
    onError: (err) => toast.error(err.message || 'Upload failed'),
  });

  const aadhaarMut = useMutation({
    mutationFn: (file) => {
      if (isUnderage) throw new Error('Profile editing is blocked. Minimum age is 18 years.');
      const fd = new FormData(); fd.append('aadhaar', file); return userService.uploadAadhaar(fd);
    },
    onSuccess: async () => { await refetchUser(); toast.success('Aadhaar uploaded! Pending review.'); },
    onError: (err) => toast.error(err.message || 'Upload failed'),
  });

  const clientAadhaarMut = useMutation({
    mutationFn: (file) => {
      if (isUnderage) throw new Error('Profile editing is blocked. Minimum age is 18 years.');
      const fd = new FormData(); fd.append('aadhaar', file); return userService.uploadClientAadhaar(fd);
    },
    onSuccess: async () => { await refetchUser(); toast.success('Document uploaded! Pending admin review.'); },
    onError: (err) => toast.error(err.message || 'Upload failed'),
  });

  const clientAadhaarStatus = role === 'client' ? (profile?.verificationStatus || null) : null;
  const aadhaarStatus        = profile?.aadhaarDoc?.status || null;

  const addSkill    = (name) => {
    if (isUnderage) return;
    const n = (name || skillInput).trim();
    if (!n || skills.find(s => s.name.toLowerCase() === n.toLowerCase())) return;
    setSkills(prev => [...prev, { name: n, yearsOfExp: 0, proficiency: 'intermediate' }]);
    setSkillInput('');
  };
  const removeSkill  = (n) => { if (isUnderage) return; setSkills(skills.filter(s => s.name !== n)); };
  const toggleSkill  = (n) => skills.find(s => s.name === n) ? removeSkill(n) : addSkill(n);
  const isSkillAdded = (n) => !!skills.find(s => s.name === n);

  const open   = (key) => {
    if (isUnderage && key !== 'dob') {
      setShowUnderageModal(true);
      return;
    }
    setEditing(e => ({ ...e, [key]: true }));
  };
  const cancel = (key) => setEditing(e => ({ ...e, [key]: false }));

  const dobDisplay  = f.dob ? new Date(f.dob + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : null;
  const wageDisplay = lf.dailyWageMin && lf.dailyWageMax ? `₹${lf.dailyWageMin} – ₹${lf.dailyWageMax} / day` : null;

  return (
    <div className="space-y-1 animate-fade-in">

      {/* ── Underage Modal ── */}
      {showUnderageModal && (
        <UnderageModal age={currentAge} onClose={() => setShowUnderageModal(false)} />
      )}

      {/* ── Aadhaar Notice Banner (Always visible at top) ── */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl mb-5 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Info className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-blue-800">📋 Add All Details as per Your Aadhaar Card</p>
          <p className="text-xs text-blue-600 mt-1 leading-relaxed">
            To ensure smooth verification and avoid rejection, please fill in your <strong>Full Name</strong>, 
            <strong> Date of Birth</strong>, <strong>Gender</strong>, and <strong>Address</strong> exactly as 
            printed on your Aadhaar Card. Any mismatch may cause delays in account verification.
          </p>
        </div>
      </div>

      {/* ── Underage Persistent Banner ── */}
      {isUnderage && <UnderageBanner age={currentAge} />}

      {/* ── PROFILE BANNER ── */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 rounded-2xl p-5 mb-5 relative overflow-hidden shadow-lg shadow-orange-200">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%,#fff 0%,transparent 50%)' }} />
        <div className="relative z-10 flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl" style={{ border: '3px solid rgba(255,255,255,0.3)' }}>
              <img src={user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=f97316&color=fff&size=96`}
                alt={user?.name} className="w-full h-full object-cover" />
            </div>
            <button onClick={() => { if (isUnderage) { setShowUnderageModal(true); return; } avatarRef.current?.click(); }} disabled={avatarMut.isPending}
              className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
              {avatarMut.isPending ? <Loader2 className="w-4 h-4 text-orange-500 animate-spin" /> : <Camera className="w-4 h-4 text-orange-500" />}
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files[0] && avatarMut.mutate(e.target.files[0])} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-xl text-white truncate">{f.name || user?.name}</h2>
            <p className="text-orange-100 text-sm mt-0.5 truncate">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 text-white capitalize">
                {role === 'labour' ? <HardHat className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />} {role}
              </span>
              {user?.isVerified
                ? <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-green-400/25 text-green-100"><CheckCircle className="w-3 h-3" /> Verified</span>
                : <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-400/25 text-yellow-100"><AlertTriangle className="w-3 h-3" /> Unverified</span>
              }
              {isUnderage && (
                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-400/30 text-red-100">
                  <ShieldAlert className="w-3 h-3" /> Under {MIN_AGE}
                </span>
              )}
              {role === 'labour' && !isUnderage && (
                <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${lf.isAvailable ? 'bg-green-400/25 text-green-100' : 'bg-white/15 text-orange-100'}`}>
                  <span className={`w-2 h-2 rounded-full ${lf.isAvailable ? 'bg-green-300' : 'bg-gray-400'}`} />
                  {lf.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              )}
              {role === 'labour' && aadhaarStatus === 'approved' && (
                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-400/25 text-blue-100"><Shield className="w-3 h-3" /> Aadhaar ✓</span>
              )}
              {role === 'client' && clientAadhaarStatus === 'approved' && (
                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-400/25 text-blue-100"><Shield className="w-3 h-3" /> Verified ✓</span>
              )}
              {role === 'client' && clientAadhaarStatus === 'pending' && (
                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400/25 text-amber-100"><Clock className="w-3 h-3" /> Pending</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── PERSONAL INFORMATION ── */}
      <Card icon={User} title="Personal Information" accent="orange">
        <Row label="Full Name" display={f.name} saving={saving.name}
          open={editing.name} onOpen={() => open('name')} onCancel={() => cancel('name')}
          onSave={() => savePersonal('name', { name: f.name })}
          disabled={isUnderage}>
          <input value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} className={field()} placeholder="Your full name (as per Aadhaar)" autoFocus />
        </Row>
        <Row label="Phone Number" display={f.phone} saving={saving.phone}
          open={editing.phone} onOpen={() => open('phone')} onCancel={() => cancel('phone')}
          onSave={() => savePersonal('phone', { phone: f.phone })}
          disabled={isUnderage}>
          <input value={f.phone} onChange={e => setF(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))} className={field()} maxLength={10} placeholder="10-digit mobile" autoFocus />
        </Row>

        {/* ── DOB Row with Age Validation ── */}
        <div className="py-3.5 border-b border-gray-50 last:border-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Date of Birth</p>
              {!editing.dob && (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800 break-words">
                    {dobDisplay || <span className="text-gray-400 italic text-xs">Not set — click Edit to add</span>}
                  </p>
                  {currentAge !== null && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isUnderage
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'bg-green-100 text-green-700 border border-green-300'
                    }`}>
                      {currentAge} yrs {isUnderage ? '⚠️' : '✓'}
                    </span>
                  )}
                </div>
              )}
            </div>
            {!editing.dob && (
              <button onClick={() => open('dob')}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all mt-0.5">
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            )}
          </div>
          {editing.dob && (
            <div className="mt-2 space-y-2">
              <input type="date" value={f.dob}
                onChange={e => {
                  const newDob = e.target.value;
                  setF(p => ({ ...p, dob: newDob }));
                }}
                className={field(isUnderage ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : '')}
                max={new Date().toISOString().split('T')[0]} autoFocus />

              {/* Inline age feedback */}
              {f.dob && currentAge !== null && (
                <div className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold ${
                  isUnderage
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-green-50 border-green-200 text-green-700'
                }`}>
                  {isUnderage
                    ? <><XCircle className="w-4 h-4 text-red-500" /> Age {currentAge} — Below minimum age of {MIN_AGE}. Form will be restricted.</>
                    : <><CheckCircle className="w-4 h-4 text-green-500" /> Age {currentAge} — Eligible ✓</>
                  }
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={() => savePersonal('dob', { dob: f.dob })} disabled={saving.dob}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 disabled:opacity-60 transition-colors">
                  {saving.dob ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save
                </button>
                <button onClick={() => cancel('dob')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <Row label="Gender" display={f.gender} saving={saving.gender}
          open={editing.gender} onOpen={() => open('gender')} onCancel={() => cancel('gender')}
          onSave={() => savePersonal('gender', { gender: f.gender })}
          disabled={isUnderage}>
          <select value={f.gender} onChange={e => setF(p => ({ ...p, gender: e.target.value }))} className={field()}>
            <option value="">Select gender</option>
            {['Male', 'Female', 'Other', 'Prefer not to say'].map(g => <option key={g}>{g}</option>)}
          </select>
        </Row>
      </Card>

      {/* ── EMERGENCY CONTACT (Labour only) ── */}
      {isLabour && (
        <Card icon={Phone} title="Emergency Contact" accent="red" disabled={isUnderage}>
          {/* Info banner */}
          <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-2xl mb-4">
            <Heart className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-800">Required for Labour Safety</p>
              <p className="text-xs text-red-600 mt-0.5">
                In case of workplace injury, admin will contact this person immediately.
                This number must be different from your own mobile number.
              </p>
            </div>
          </div>

          {/* Status indicator */}
          {f.ecPhone && f.ecName ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl mb-3">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-green-800">{f.ecName} ({f.ecRelation || 'Contact'})</p>
                <p className="text-xs text-green-600">+91 {f.ecPhone} · Emergency contact saved</p>
              </div>
              <UserCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs font-semibold text-amber-800">Emergency contact not set — please add one</p>
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                Contact Person Name <span className="text-red-500">*</span>
              </label>
              <input
                value={f.ecName}
                onChange={e => { setF(p => ({ ...p, ecName: e.target.value })); setEcError(''); }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                placeholder="e.g. Ramesh Kumar"
                disabled={isUnderage}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                Relationship <span className="text-red-500">*</span>
              </label>
              <select
                value={f.ecRelation}
                onChange={e => { setF(p => ({ ...p, ecRelation: e.target.value })); setEcError(''); }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all bg-white"
                disabled={isUnderage}
              >
                <option value="">Select relationship</option>
                {['Father','Mother','Spouse / Wife','Spouse / Husband','Brother','Sister','Son','Daughter','Friend','Neighbour','Other'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                Emergency Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">+91</span>
                <input
                  value={f.ecPhone}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setF(p => ({ ...p, ecPhone: val }));
                    setEcError('');
                  }}
                  className={`w-full pl-12 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                    ecError
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-100 bg-red-50'
                      : f.ecPhone && f.ecPhone === f.phone
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-100 bg-red-50'
                        : f.ecPhone?.length === 10 && f.ecPhone !== f.phone
                          ? 'border-green-400 focus:border-green-400 focus:ring-green-100 bg-green-50'
                          : 'border-gray-200 focus:border-red-400 focus:ring-red-100'
                  }`}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  disabled={isUnderage}
                />
                {(f.ecPhone?.length ?? 0) === 10 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {f.ecPhone === f.phone
                      ? <X className="w-4 h-4 text-red-500" />
                      : <Check className="w-4 h-4 text-green-500" />
                    }
                  </div>
                )}
              </div>
              {(f.ecPhone?.length ?? 0) > 0 && f.ecPhone === f.phone && (
                <p className="flex items-center gap-1 text-xs text-red-600 font-semibold mt-1.5">
                  <X className="w-3 h-3" />
                  This is the same as your own number — use a different number
                </p>
              )}
              {(f.ecPhone?.length ?? 0) === 10 && f.ecPhone !== f.phone && /^[6-9]\d{9}$/.test(f.ecPhone) && (
                <p className="flex items-center gap-1 text-xs text-green-600 font-semibold mt-1.5">
                  <Check className="w-3 h-3" />
                  Valid emergency contact number
                </p>
              )}
            </div>
            {ecError && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-red-700">{ecError}</p>
              </div>
            )}
            <button
              onClick={saveEmergencyContact}
              disabled={!!saving.emergencyContact || isUnderage}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white text-sm font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-md shadow-red-200 disabled:opacity-60"
            >
              {saving.emergencyContact
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Heart className="w-4 h-4" />
              }
              {saving.emergencyContact ? 'Saving…' : 'Save Emergency Contact'}
            </button>
          </div>
        </Card>
      )}

      {/* ── LOCATION ── */}
      <Card icon={MapPin} title="Location & Address" accent="blue" disabled={isUnderage}>
        <Row label="Street / Landmark" display={f.address} saving={saving.address}
          open={editing.address} onOpen={() => open('address')} onCancel={() => cancel('address')}
          onSave={() => savePersonal('address', { ...(f.address && {address: f.address}), ...(f.city && {city: f.city}), ...(f.state && {state: f.state}), ...(f.pincode && {pincode: f.pincode}) })}
          disabled={isUnderage}>
          <input value={f.address} onChange={e => setF(p => ({ ...p, address: e.target.value }))} className={field()} placeholder="Building / Street / Landmark (as per Aadhaar)" autoFocus />
        </Row>
        <Row label="State" display={f.state} saving={saving.state}
          open={editing.state} onOpen={() => open('state')} onCancel={() => cancel('state')}
          onSave={() => savePersonal('state', { state: f.state, ...(f.city && {city: f.city}) })}
          disabled={isUnderage}>
          <StateSelect value={f.state} onChange={v => setF(p => ({ ...p, state: v, city: '' }))} />
        </Row>
        <Row label="City" display={f.city} saving={saving.city}
          open={editing.city} onOpen={() => open('city')} onCancel={() => cancel('city')}
          onSave={() => savePersonal('city', { city: f.city, ...(f.state && {state: f.state}) })}
          disabled={isUnderage}>
          <CitySelect value={f.city} onChange={v => setF(p => ({ ...p, city: v }))} stateVal={f.state} />
        </Row>
        <Row label="Pincode" display={f.pincode} saving={saving.pincode}
          open={editing.pincode} onOpen={() => open('pincode')} onCancel={() => cancel('pincode')}
          onSave={() => savePersonal('pincode', { pincode: f.pincode })}
          disabled={isUnderage}>
          <input value={f.pincode} onChange={e => setF(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '') }))} className={field()} maxLength={6} placeholder="6-digit pincode" autoFocus />
        </Row>
      </Card>

      {/* ══ LABOUR SECTION ══ */}
      {role === 'labour' && (
        <>
          <Card icon={CheckCircle} title="Work Availability" accent="green" disabled={isUnderage}>
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${lf.isAvailable ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  {lf.isAvailable ? 'Available for Work' : 'Currently Unavailable'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {lf.isAvailable ? 'Clients can find you and send job offers.' : 'Your profile is hidden from client search.'}
                </p>
              </div>
              <button
                onClick={() => {
                  if (isUnderage) { setShowUnderageModal(true); return; }
                  setLf(p => ({ ...p, isAvailable: !p.isAvailable }));
                  setTimeout(() => saveLabour('isAvailable', { isAvailable: !lf.isAvailable }), 0);
                }}
                disabled={saving.isAvailable || isUnderage}
                className={`relative flex-shrink-0 rounded-full transition-all duration-300 ${lf.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}
                style={{ width: 52, height: 28 }}
              >
                {saving.isAvailable
                  ? <span className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-4 h-4 text-white animate-spin" /></span>
                  : <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${lf.isAvailable ? 'left-7' : 'left-1'}`} />
                }
              </button>
            </div>
          </Card>

          <Card icon={Briefcase} title="Professional Details" accent="green" disabled={isUnderage}>
            <Row label="About You / Bio" display={lf.bio} saving={saving.bio}
              open={editing.bio} onOpen={() => open('bio')} onCancel={() => cancel('bio')}
              onSave={() => saveLabour('bio')} disabled={isUnderage}>
              <textarea value={lf.bio} onChange={e => setLf(p => ({ ...p, bio: e.target.value }))}
                className={field('resize-none')} rows={3} placeholder="Describe your experience…" maxLength={500} autoFocus />
              <p className="text-xs text-gray-400 text-right">{lf.bio.length}/500</p>
            </Row>
            <Row label="Years of Experience" display={lf.experience ? `${lf.experience} year${lf.experience !== 1 ? 's' : ''}` : null} saving={saving.experience}
              open={editing.experience} onOpen={() => open('experience')} onCancel={() => cancel('experience')}
              onSave={() => saveLabour('experience')} disabled={isUnderage}>
              <input type="number" value={lf.experience} min={0} max={50}
                onChange={e => setLf(p => ({ ...p, experience: Math.max(0, +e.target.value) }))} className={field()} autoFocus />
            </Row>
            <Row label="Daily Wage Range" display={wageDisplay} saving={saving.wage}
              open={editing.wage} onOpen={() => open('wage')} onCancel={() => cancel('wage')}
              onSave={() => saveLabour('wage')} disabled={isUnderage}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Minimum (₹)</p>
                  <input type="number" value={lf.dailyWageMin} onChange={e => setLf(p => ({ ...p, dailyWageMin: e.target.value }))} className={field()} placeholder="Min ₹" autoFocus min={0} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Maximum (₹)</p>
                  <input type="number" value={lf.dailyWageMax} onChange={e => setLf(p => ({ ...p, dailyWageMax: e.target.value }))} className={field()} placeholder="Max ₹" min={0} />
                </div>
              </div>
            </Row>
            <Row label="Working Radius" display={lf.workingRadius ? `${lf.workingRadius} km from my location` : null} saving={saving.workingRadius}
              open={editing.workingRadius} onOpen={() => open('workingRadius')} onCancel={() => cancel('workingRadius')}
              onSave={() => saveLabour('workingRadius')} disabled={isUnderage}>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>5 km</span>
                  <span className="font-bold text-orange-600 text-base">{lf.workingRadius} km</span>
                  <span>100 km</span>
                </div>
                <input type="range" min={5} max={100} step={5} value={lf.workingRadius}
                  onChange={e => setLf(p => ({ ...p, workingRadius: +e.target.value }))}
                  className="w-full accent-orange-500 h-2 cursor-pointer" />
              </div>
            </Row>
            <Row label="Preferred Shift" display={lf.preferredShift ? lf.preferredShift.charAt(0).toUpperCase() + lf.preferredShift.slice(1) : null} saving={saving.preferredShift}
              open={editing.preferredShift} onOpen={() => open('preferredShift')} onCancel={() => cancel('preferredShift')}
              onSave={() => saveLabour('preferredShift')} disabled={isUnderage}>
              <div className="grid grid-cols-2 gap-2">
                {['morning','evening','night','flexible'].map(s => (
                  <button key={s} type="button" onClick={() => setLf(p => ({ ...p, preferredShift: s }))}
                    className={`py-2.5 rounded-xl text-xs font-semibold capitalize border-2 transition-all ${lf.preferredShift === s ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50'}`}>
                    {s==='morning'?'🌅':s==='evening'?'🌇':s==='night'?'🌙':'⏰'} {s}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="Preferred Job Categories"
              display={lf.preferredCategories?.length ? lf.preferredCategories.slice(0,3).join(', ')+(lf.preferredCategories.length>3?` +${lf.preferredCategories.length-3}`:'') : null}
              saving={saving.preferredCategories}
              open={editing.preferredCategories} onOpen={() => open('preferredCategories')} onCancel={() => cancel('preferredCategories')}
              onSave={() => saveLabour('preferredCategories')} disabled={isUnderage}>
              <div className="flex flex-wrap gap-2">
                {JOB_CATEGORIES.map(cat => {
                  const sel = lf.preferredCategories?.includes(cat.value);
                  return (
                    <button key={cat.value} type="button"
                      onClick={() => setLf(p => ({ ...p, preferredCategories: sel ? p.preferredCategories.filter(c => c !== cat.value) : [...(p.preferredCategories||[]), cat.value] }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${sel ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50'}`}>
                      {sel && <span className="mr-1">✓</span>}{cat.label}
                    </button>
                  );
                })}
              </div>
            </Row>
          </Card>

          <Card icon={Star} title="Skills" accent="amber" disabled={isUnderage}>
            <div className="space-y-4">
              {SKILL_CATS.map(({ cat, color, skills: catSkills }) => {
                const anyAdded = catSkills.some(s => isSkillAdded(s));
                return (
                  <div key={cat}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      {cat}
                      {anyAdded && <span className="normal-case font-semibold text-green-600 text-[10px]">• some added</span>}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {catSkills.map(s => {
                        const added = isSkillAdded(s);
                        return (
                          <button key={s} type="button" onClick={() => toggleSkill(s)} disabled={isUnderage}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${added ? 'bg-primary-100 border-primary-400 text-primary-700 shadow-sm' : CLR[color]||CLR.slate}`}>
                            {added ? <Check style={{width:10,height:10}} /> : <Plus style={{width:10,height:10}} />} {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && (e.preventDefault(), addSkill())}
                  className={field('flex-1')} placeholder="Type a custom skill and press Add…" disabled={isUnderage} />
                <button type="button" onClick={() => addSkill()} disabled={isUnderage}
                  className="px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors flex items-center gap-1.5 disabled:opacity-60">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {skills.length > 0 && (
                <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-primary-700">✓ {skills.length} skill{skills.length!==1?'s':''} on your profile</p>
                    <button onClick={() => saveLabour('skills')} disabled={saving.skills || isUnderage}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors disabled:opacity-60">
                      {saving.skills ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save Skills
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map(s => (
                      <span key={s.name} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-primary-200 text-xs font-medium text-primary-700">
                        {s.name}
                        <button type="button" onClick={() => removeSkill(s.name)} disabled={isUnderage} className="hover:text-red-500 ml-0.5 transition-colors disabled:opacity-40">
                          <X style={{width:10,height:10}} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card icon={Shield} title="Identity Verification (Aadhaar)" accent="indigo" disabled={isUnderage}>
            {aadhaarStatus === 'approved' && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="w-7 h-7 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-green-800 text-sm">Aadhaar Verified ✓</p>
                  <p className="text-xs text-green-600 mt-0.5">Your identity has been confirmed. Verified badge is active on your profile.</p>
                </div>
              </div>
            )}
            {aadhaarStatus === 'pending' && (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <Clock className="w-7 h-7 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-amber-800 text-sm">Under Review</p>
                  <p className="text-xs text-amber-600 mt-0.5">Your document is being reviewed. Usually takes 24 hours.</p>
                </div>
              </div>
            )}
            {aadhaarStatus === 'rejected' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertTriangle className="w-7 h-7 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-red-800 text-sm">Not Approved — Please Re-upload</p>
                    <p className="text-xs text-red-600 mt-0.5">Upload a clearer, well-lit photo of your Aadhaar card.</p>
                  </div>
                </div>
                <button onClick={() => { if (isUnderage) { setShowUnderageModal(true); return; } aadhaarRef.current?.click(); }} disabled={aadhaarMut.isPending || isUnderage}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-60 shadow-sm">
                  {aadhaarMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Re-upload Aadhaar
                </button>
              </div>
            )}
            {!aadhaarStatus && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Upload your <strong>Aadhaar card (front side)</strong> to get the Verified badge. Verified workers get <strong>3x more job offers</strong>.
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>✓ Accepted: JPG, PNG, PDF</li>
                  <li>✓ Photo must be clear and well-lit</li>
                  <li>✓ All 4 corners must be visible</li>
                </ul>
                <button onClick={() => { if (isUnderage) { setShowUnderageModal(true); return; } aadhaarRef.current?.click(); }} disabled={aadhaarMut.isPending || isUnderage}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-60 shadow-sm">
                  {aadhaarMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload Aadhaar Card
                </button>
              </div>
            )}
            <input ref={aadhaarRef} type="file" accept="image/*,application/pdf" className="hidden"
              onChange={e => e.target.files[0] && aadhaarMut.mutate(e.target.files[0])} />
          </Card>
        </>
      )}

      {/* ══ CLIENT SECTION ══ */}
      {role === 'client' && (
        <>
          <Card icon={Shield} title="Identity Verification (Aadhaar)" accent="indigo" disabled={isUnderage}>
            {clientAadhaarStatus === 'approved' && (
              <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-green-800 text-sm">Identity Verified ✓</p>
                  <p className="text-xs text-green-600 mt-0.5">Your Aadhaar has been verified. Verified badge is active on your profile.</p>
                </div>
              </div>
            )}
            {clientAadhaarStatus === 'pending' && (
              <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-amber-800 text-sm">Document Under Review</p>
                  <p className="text-xs text-amber-600 mt-0.5">Our admin team is reviewing your document. Usually takes 24 hours.</p>
                </div>
              </div>
            )}
            {clientAadhaarStatus === 'rejected' && (
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-bold text-red-800 text-sm">Not Approved — Please Re-upload</p>
                    <p className="text-xs text-red-600 mt-0.5">Upload a clearer, well-lit photo of your Aadhaar card.</p>
                  </div>
                </div>
                <button onClick={() => { if (isUnderage) { setShowUnderageModal(true); return; } clientAadhaarRef.current?.click(); }} disabled={clientAadhaarMut.isPending || isUnderage}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-60">
                  {clientAadhaarMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Re-upload Aadhaar
                </button>
              </div>
            )}
            {(clientAadhaarStatus === 'not_submitted' || !clientAadhaarStatus) && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Upload your <strong>Aadhaar card (front side)</strong> to get the Verified badge and build trust with workers.
                </p>
                <ul className="text-xs text-gray-500 space-y-1.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Accepted formats: JPG, PNG</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Photo must be clear and well-lit</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> All 4 corners of the card must be visible</li>
                </ul>
                <button onClick={() => { if (isUnderage) { setShowUnderageModal(true); return; } clientAadhaarRef.current?.click(); }} disabled={clientAadhaarMut.isPending || isUnderage}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-60 shadow-sm">
                  {clientAadhaarMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload Aadhaar Card
                </button>
              </div>
            )}
            <input ref={clientAadhaarRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files[0] && clientAadhaarMut.mutate(e.target.files[0])} />
          </Card>

          <Card icon={Building2} title="Business Details" accent="blue" disabled={isUnderage}>
            <Row label="Company Name" display={cf.companyName} saving={saving.companyName}
              open={editing.companyName} onOpen={() => open('companyName')} onCancel={() => cancel('companyName')}
              onSave={() => saveClient('companyName')} disabled={isUnderage}>
              <input value={cf.companyName} onChange={e => setCf(p => ({ ...p, companyName: e.target.value }))} className={field()} placeholder="Your company name" autoFocus />
            </Row>
            <Row label="Company Type" display={cf.companyType?.replace('_',' ')} saving={saving.companyType}
              open={editing.companyType} onOpen={() => open('companyType')} onCancel={() => cancel('companyType')}
              onSave={() => saveClient('companyType')} disabled={isUnderage}>
              <select value={cf.companyType} onChange={e => setCf(p => ({ ...p, companyType: e.target.value }))} className={field()}>
                {['individual','small_business','contractor','enterprise'].map(t => (
                  <option key={t} value={t}>{t.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>
                ))}
              </select>
            </Row>
            <Row label="Industry" display={cf.industryType} saving={saving.industryType}
              open={editing.industryType} onOpen={() => open('industryType')} onCancel={() => cancel('industryType')}
              onSave={() => saveClient('industryType')} disabled={isUnderage}>
              <input value={cf.industryType} onChange={e => setCf(p => ({ ...p, industryType: e.target.value }))} className={field()} placeholder="e.g. Construction, Real Estate" autoFocus />
            </Row>
            <Row label="GST Number" display={cf.gstNumber} saving={saving.gstNumber}
              open={editing.gstNumber} onOpen={() => open('gstNumber')} onCancel={() => cancel('gstNumber')}
              onSave={() => saveClient('gstNumber')} disabled={isUnderage}>
              <input value={cf.gstNumber} onChange={e => setCf(p => ({ ...p, gstNumber: e.target.value }))} className={field()} placeholder="Optional" autoFocus />
            </Row>
            <Row label="Website" display={cf.websiteUrl} saving={saving.websiteUrl}
              open={editing.websiteUrl} onOpen={() => open('websiteUrl')} onCancel={() => cancel('websiteUrl')}
              onSave={() => saveClient('websiteUrl')} disabled={isUnderage}>
              <input value={cf.websiteUrl} onChange={e => setCf(p => ({ ...p, websiteUrl: e.target.value }))} className={field()} placeholder="https://yourcompany.com" autoFocus />
            </Row>
            <Row label="Preferred Payment Mode" display={cf.preferredPaymentMode?.replace('_',' ')} saving={saving.preferredPaymentMode}
              open={editing.preferredPaymentMode} onOpen={() => open('preferredPaymentMode')} onCancel={() => cancel('preferredPaymentMode')}
              onSave={() => saveClient('preferredPaymentMode')} disabled={isUnderage}>
              <div className="grid grid-cols-2 gap-2">
                {['cash','upi','bank_transfer','cheque'].map(m => (
                  <button key={m} type="button" onClick={() => setCf(p => ({ ...p, preferredPaymentMode: m }))}
                    className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${cf.preferredPaymentMode===m ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50'}`}>
                    {m.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
                  </button>
                ))}
              </div>
            </Row>
          </Card>
        </>
      )}

    </div>
  );
}