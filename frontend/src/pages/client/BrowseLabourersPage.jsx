import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search, Users, Shield, Star, MapPin,
  IndianRupee, Briefcase, MessageCircle,
  X, SlidersHorizontal, CheckCircle, Zap
} from 'lucide-react';
import userService  from '@/services/userService';
import chatService  from '@/services/chatService';
import { useProfileGate } from '@/hooks/useProfileGate';
import ProfileGateBanner from '@/components/common/ProfileGateBanner';
import BadgeChip, { BadgeList, BADGE_CONFIG } from '@/components/common/BadgeChip';
import { EmptyState, Pagination } from '@/components/common/UIComponents';
import { useDebounce } from '@/hooks/useHooks';
import { JOB_CATEGORIES, formatCurrency } from '@/utils/helpers';
import toast from 'react-hot-toast';

/* ── Labour card ────────────────────────────────────────────────────────────── */
const LabourCard = ({ labour, onMessage, canMessage = true }) => {
  const navigate  = useNavigate();
  const profile   = labour?.labourProfile;
  if (!labour || !profile) return null;

  const skills     = (profile.skills || []).slice(0, 3);
  const isVerified = profile.aadhaarDoc?.status === 'approved' || labour.isVerified;
  const avgRating  = profile.averageRating || 0;
  const badges     = (profile.badges || []).slice(0, 2);
  const trustScore = profile.trustScore || 0;
  const level      = profile.level || 1;

  const trustColor = trustScore >= 80 ? 'text-green-600 bg-green-50 border-green-200'
                   : trustScore >= 60 ? 'text-amber-600 bg-amber-50 border-amber-200'
                   : trustScore > 0   ? 'text-gray-500 bg-gray-50 border-gray-200' : '';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group hover:-translate-y-0.5">
      {/* Top availability bar */}
      <div className={`h-1 w-full ${profile.isAvailable ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gray-200'}`} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0 cursor-pointer" onClick={() => navigate(`/labourers/${labour._id}`)}>
            <img
              src={labour.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(labour.name||'U')}&background=f97316&color=fff&size=56`}
              alt={labour.name}
              className="w-14 h-14 rounded-2xl object-cover hover:opacity-90 transition-opacity"
            />
            {/* Level badge on avatar */}
            {level > 1 && (
              <span className="absolute -bottom-1 -left-1 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-orange-500 text-white border border-white">
                L{level}
              </span>
            )}
            {profile.isAvailable && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white animate-pulse" />
            )}
          </div>

          {/* Name + rating */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/labourers/${labour._id}`)}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-gray-900 text-sm group-hover:text-orange-600 transition-colors truncate">
                {labour.name}
              </h3>
              {isVerified && <Shield className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" title="Aadhaar Verified" />}
            </div>

            {avgRating > 0 ? (
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-2.5 h-2.5 ${s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                  ))}
                </div>
                <span className="text-xs font-bold text-amber-600">{avgRating.toFixed(1)}</span>
                {profile.totalRatings > 0 && <span className="text-[10px] text-gray-400">({profile.totalRatings})</span>}
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 mt-0.5">New worker</p>
            )}

            {labour.location?.city && (
              <p className="text-[10px] text-gray-500 flex items-center gap-0.5 mt-0.5">
                <MapPin className="w-2.5 h-2.5" />
                {labour.location.city}{labour.location.state ? `, ${labour.location.state}` : ''}
              </p>
            )}
          </div>

          {/* Trust score chip */}
          {trustScore > 0 && (
            <div className={`flex-shrink-0 text-center px-2 py-1 rounded-xl border text-[10px] font-black ${trustColor}`}>
              <p>{trustScore}</p>
              <p className="font-medium opacity-70" style={{fontSize:'8px'}}>TRUST</p>
            </div>
          )}
        </div>

        {/* Badges row — top 2 */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {badges.map(b => <BadgeChip key={b.type} type={b.type} size="sm" />)}
            {(profile.badges?.length || 0) > 2 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                +{profile.badges.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {skills.map(s => (
              <span key={s.name} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700">
                {s.name}
              </span>
            ))}
            {(profile.skills?.length || 0) > 3 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                +{profile.skills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-3 pt-2 border-t border-gray-50">
          <span className="flex items-center gap-0.5 font-semibold text-gray-700">
            <IndianRupee className="w-3 h-3 text-orange-400" />
            {profile.dailyWageMin && profile.dailyWageMax ? `₹${profile.dailyWageMin}–₹${profile.dailyWageMax}` : 'Negotiable'}
          </span>
          <span className="flex items-center gap-0.5">
            <Briefcase className="w-3 h-3" /> {profile.completedJobs || 0} jobs
          </span>
          {profile.completionRate > 0 && (
            <span className="flex items-center gap-0.5 text-green-600 font-semibold">
              ✓ {profile.completionRate}%
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => navigate(`/labourers/${labour._id}`)}
            className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all">
            View Profile
          </button>
          <button
            onClick={() => canMessage && onMessage && onMessage(labour._id)}
            disabled={!canMessage}
            title={!canMessage ? 'Verify your Aadhaar to message workers' : ''}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              canMessage
                ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-sm shadow-orange-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
            }`}>
            <MessageCircle className="w-3.5 h-3.5" />
            {canMessage ? 'Message' : '🔒 Verify'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
const BrowseLabourersPage = () => {
  const navigate = useNavigate();
  const { canAct } = useProfileGate();

  const [skill,    setSkill]    = useState('');
  const [city,     setCity]     = useState('');
  const [minRating,setMinRating]= useState('');
  const [maxWage,  setMaxWage]  = useState('');
  const [verified, setVerified] = useState(false);
  const [available,setAvailable]= useState(true);
  const [page,     setPage]     = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const dSkill = useDebounce(skill, 400);
  const dCity  = useDebounce(city,  400);

  const { data, isLoading } = useQuery({
    queryKey: ['labourers', { dSkill, dCity, minRating, maxWage, verified, available, page }],
    queryFn:  () => userService.browseLabourers({
      skill:              dSkill    || undefined,
      city:               dCity     || undefined,
      minRating:          minRating || undefined,
      maxWage:            maxWage   || undefined,
      verificationStatus: verified  ? 'approved' : undefined,
      isAvailable:        available ? true : undefined,
      page, limit: 12,
    }).then(r => r.data),
    keepPreviousData: true,
  });

  /* Chat mutation */
  const chatMut = useMutation({
    mutationFn: (participantId) => chatService.getOrCreateConversation({ participantId }),
    onSuccess:  (res) => navigate(`/client/chat/${res.data.data._id}`),
    onError:    (err) => toast.error(err.message || 'Failed to start chat'),
  });

  const labourers  = data?.data          || [];
  const totalPages = data?.meta?.totalPages || 1;
  const total      = data?.meta?.total   || 0;

  const hasFilters = skill || city || minRating || maxWage || verified;

  const clearFilters = () => {
    setSkill(''); setCity(''); setMinRating('');
    setMaxWage(''); setVerified(false); setPage(1);
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Browse Workers</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {total > 0 ? `${total} worker${total !== 1 ? 's' : ''} found` : 'Find skilled workers for your jobs'}
          </p>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 shadow-sm">
        {/* Main search row */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-10 text-sm w-full"
              placeholder="Search by skill (e.g. Plumbing, Electrician…)"
              value={skill}
              onChange={e => { setSkill(e.target.value); setPage(1); }}
            />
          </div>
          <div className="relative w-44">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-10 text-sm w-full"
              placeholder="City"
              value={city}
              onChange={e => { setCity(e.target.value); setPage(1); }}
            />
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${filtersOpen || hasFilters ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters {hasFilters && '•'}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition-colors">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        {/* Advanced filters */}
        {filtersOpen && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Max Wage (₹/day)</label>
              <input type="number" className="input text-sm w-full" placeholder="e.g. 1000"
                value={maxWage} onChange={e => { setMaxWage(e.target.value); setPage(1); }} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Min Rating</label>
              <select className="input text-sm w-full" value={minRating}
                onChange={e => { setMinRating(e.target.value); setPage(1); }}>
                <option value="">Any Rating</option>
                <option value="4">4★ and above</option>
                <option value="4.5">4.5★ and above</option>
                <option value="3">3★ and above</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 pt-5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div onClick={() => { setVerified(!verified); setPage(1); }}
                  className={`relative w-10 h-5 rounded-full transition-all ${verified ? 'bg-orange-500' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${verified ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">Verified only</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div onClick={() => { setAvailable(!available); setPage(1); }}
                  className={`relative w-10 h-5 rounded-full transition-all ${available ? 'bg-orange-500' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${available ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">Available only</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Quick filter pills */}
      <div className="flex gap-2 flex-wrap">
        {['Masonry','Plumbing','Electrician','Painting','Carpentry','Welding','Cleaning'].map(s => (
          <button key={s}
            onClick={() => { setSkill(skill === s ? '' : s); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${skill === s ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Gate banner */}
      {!canAct && (
        <ProfileGateBanner action="chat" className="mb-2" />
      )}

      {/* Worker grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 skeleton rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : labourers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {labourers.map(l => (
              <LabourCard
                key={l._id}
                labour={l}
                onMessage={canAct ? (id => chatMut.mutate(id)) : null}
                canMessage={canAct}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState
          icon={Users}
          title="No workers found"
          description={hasFilters ? 'Try clearing some filters to see more results.' : 'No available workers at the moment. Check back soon!'}
          action={hasFilters ? <button onClick={clearFilters} className="btn-outline btn">Clear Filters</button> : null}
        />
      )}
    </div>
  );
};

export default BrowseLabourersPage;