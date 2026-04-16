import { useState } from 'react';
import { Star, X, Loader2, CheckCircle, Send } from 'lucide-react';
import ratingService from '@/services/ratingService';
import toast from 'react-hot-toast';

/* ── Star picker ───────────────────────────────────────────────────────────── */
const StarPicker = ({ value, onChange, size = 'lg' }) => {
  const [hover, setHover] = useState(0);
  const sz = size === 'lg' ? 'w-9 h-9' : 'w-6 h-6';

  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`${sz} transition-all duration-100 active:scale-90`}
        >
          <Star
            className={`w-full h-full transition-colors ${
              star <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-200 hover:fill-amber-200 hover:text-amber-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

/* ── Sub-rating row ────────────────────────────────────────────────────────── */
const SubRow = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-600">{label}</span>
    <StarPicker value={value} onChange={onChange} size="sm" />
  </div>
);

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

/* ═══════════════════════════════════════════════════════════════════════════
   RATING MODAL
   Props:
     job        — the completed job object
     ratedUser  — { _id, name, avatar, role } person being rated
     onClose    — close handler
     onSuccess  — called after successful submission
═══════════════════════════════════════════════════════════════════════════ */
const RatingModal = ({ job, ratedUser, onClose, onSuccess }) => {
  const isRatingLabour = ratedUser?.role === 'labour';

  const [overall,          setOverall]          = useState(0);
  const [review,           setReview]           = useState('');
  // Labour sub-ratings (client → labour)
  const [workQuality,      setWorkQuality]      = useState(0);
  const [punctuality,      setPunctuality]      = useState(0);
  const [behaviour,        setBehaviour]        = useState(0);
  const [communication,    setCommunication]    = useState(0);
  // Client sub-ratings (labour → client)
  const [paymentReliability, setPaymentReliability] = useState(0);
  const [workEnvironment,  setWorkEnvironment]  = useState(0);

  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  const handleSubmit = async () => {
    if (overall === 0) { toast.error('Please select an overall star rating'); return; }

    setLoading(true);
    try {
      await ratingService.submitRating({
        jobId:       job._id,
        ratedUserId: ratedUser._id,
        overallRating: overall,
        review:      review.trim() || undefined,
        ...(isRatingLabour && {
          workQuality:   workQuality   || undefined,
          punctuality:   punctuality   || undefined,
          behaviour:     behaviour     || undefined,
          communication: communication || undefined,
        }),
        ...(!isRatingLabour && {
          paymentReliability: paymentReliability || undefined,
          workEnvironment:    workEnvironment    || undefined,
        }),
      });

      setDone(true);
      toast.success(`Rating submitted for ${ratedUser.name}!`);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1800);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      toast.error(msg || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter:'blur(7px)', background:'rgba(15,23,42,0.55)' }}>
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 px-6 pt-6 pb-8">
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4">
            <img
              src={ratedUser?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(ratedUser?.name||'U')}&background=fff&color=f97316&size=56`}
              alt={ratedUser?.name}
              className="w-14 h-14 rounded-2xl object-cover border-3 border-white/40 shadow-lg"
              style={{ borderWidth: 3 }}
            />
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-0.5">
                Rate {isRatingLabour ? 'Worker' : 'Client'}
              </p>
              <h3 className="font-display font-bold text-xl text-white">{ratedUser?.name}</h3>
              <p className="text-white/70 text-xs mt-0.5 truncate max-w-[200px]">
                {job?.title}
              </p>
            </div>
          </div>
        </div>

        {done ? (
          /* Success state */
          <div className="flex flex-col items-center justify-center py-12 px-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="font-display font-bold text-gray-900 text-lg">Rating Submitted!</p>
            <p className="text-gray-500 text-sm text-center">
              Thank you for rating {ratedUser?.name}. Your feedback helps build trust.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">

            {/* Overall rating */}
            <div className="text-center">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Overall Rating *</p>
              <div className="flex justify-center mb-2">
                <StarPicker value={overall} onChange={setOverall} size="lg" />
              </div>
              {overall > 0 && (
                <p className="text-sm font-semibold text-amber-600">{STAR_LABELS[overall]}</p>
              )}
            </div>

            {/* Sub-ratings */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Detailed Ratings <span className="font-normal normal-case">(optional)</span>
              </p>
              {isRatingLabour ? (
                <>
                  <SubRow label="Work Quality"   value={workQuality}   onChange={setWorkQuality}   />
                  <SubRow label="Punctuality"     value={punctuality}   onChange={setPunctuality}   />
                  <SubRow label="Behaviour"       value={behaviour}     onChange={setBehaviour}     />
                  <SubRow label="Communication"   value={communication} onChange={setCommunication} />
                </>
              ) : (
                <>
                  <SubRow label="Payment Reliability" value={paymentReliability} onChange={setPaymentReliability} />
                  <SubRow label="Work Environment"     value={workEnvironment}    onChange={setWorkEnvironment}    />
                </>
              )}
            </div>

            {/* Review text */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Written Review <span className="font-normal normal-case">(optional)</span>
              </label>
              <textarea
                value={review}
                onChange={e => setReview(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={isRatingLabour
                  ? "Describe the quality of work, reliability, and overall experience…"
                  : "Describe how the client treated you, payment experience, work site conditions…"
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none bg-white"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{review.length}/500</p>
            </div>
          </div>
        )}

        {/* Footer */}
        {!done && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || overall === 0}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm font-bold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-orange-200"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
              Submit Rating
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingModal;