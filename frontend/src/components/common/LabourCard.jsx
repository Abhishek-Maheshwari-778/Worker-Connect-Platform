import { Link } from 'react-router-dom';
import { MapPin, Star, Briefcase, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
import Avatar from './Avatar';
import { Badge, RatingStars } from './UIComponents';

const LabourCard = ({ labour, onHire }) => {
  const profile = labour?.labourProfile;
  if (!labour || !profile) return null;

  const topSkills = (profile.skills || []).slice(0, 3);
  const topBadges = (profile.badges || []).slice(0, 2);

  return (
    <Link to={`/labourers/${labour._id}`} className="card-hover block group">
      <div className="card-body space-y-3">
        {/* ── Header ── */}
        <div className="flex items-start gap-3">
          <Avatar
            src={labour.avatar?.url}
            name={labour.name}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors truncate">
                {labour.name}
              </h3>
              {labour.isVerified && (
                <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {profile.experience > 0 ? `${profile.experience} yr${profile.experience > 1 ? 's' : ''} experience` : 'New'}
            </p>
            <RatingStars rating={profile.averageRating} size="sm" />
          </div>

          {/* Availability dot */}
          <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${profile.isAvailable ? 'bg-green-400' : 'bg-slate-300'}`}
            title={profile.isAvailable ? 'Available' : 'Unavailable'}
          />
        </div>

        {/* ── Bio ── */}
        {profile.bio && (
          <p className="text-sm text-slate-600 line-clamp-2">{profile.bio}</p>
        )}

        {/* ── Skills ── */}
        {topSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topSkills.map((s) => (
              <span key={s.name} className="badge-blue badge text-[11px]">{s.name}</span>
            ))}
            {profile.skills?.length > 3 && (
              <span className="badge-gray badge text-[11px]">+{profile.skills.length - 3}</span>
            )}
          </div>
        )}

        {/* ── Badges ── */}
        {topBadges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topBadges.map((b) => <Badge key={b.type} type={b.type} />)}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pt-1 border-t border-surface-100">
          <div className="space-y-0.5">
            {labour.location?.city && (
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{labour.location.city}
              </p>
            )}
            <p className="text-xs text-primary font-semibold">
              {formatCurrency(profile.dailyWageMin)} – {formatCurrency(profile.dailyWageMax)}/day
            </p>
          </div>

          <div className="text-right text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              {profile.completedJobs || 0} jobs
            </div>
          </div>
        </div>

        {onHire && (
          <button
            className="btn-primary btn w-full"
            onClick={(e) => { e.preventDefault(); onHire(labour); }}
          >
            Contact
          </button>
        )}
      </div>
    </Link>
  );
};

export default LabourCard;
