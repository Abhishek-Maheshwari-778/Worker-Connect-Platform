import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Search, X, Filter, ChevronDown, ChevronRight,
  ExternalLink, Play, CheckCircle, FileText, Globe,
  BookOpen, Loader2, MapPin, Star, RefreshCw, Languages,
  Bookmark, BookmarkCheck, Phone, AlertCircle, Youtube,
} from 'lucide-react';
import schemeService from '@/services/schemeService';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import LabourBot from '@/components/chat/LabourBot';

/* ══════════════════════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════════════════════ */

const LANG_KEY = 'lc_scheme_lang';

const CAT_CONFIG = {
  pension:           { label_en: 'Pension',          label_hi: 'पेंशन',          color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700', icon: '🏦' },
  insurance:         { label_en: 'Insurance',         label_hi: 'बीमा',            color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',          icon: '🛡️' },
  housing:           { label_en: 'Housing',           label_hi: 'आवास',            color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700', icon: '🏠' },
  skill_development: { label_en: 'Skill Training',    label_hi: 'कौशल प्रशिक्षण', color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',   icon: '📚' },
  healthcare:        { label_en: 'Healthcare',        label_hi: 'स्वास्थ्य',        color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',               icon: '🏥' },
  social_security:   { label_en: 'Social Security',   label_hi: 'सामाजिक सुरक्षा', color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700', icon: '🔐' },
  financial_aid:     { label_en: 'Financial Aid',     label_hi: 'वित्तीय सहायता',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700', icon: '💰' },
  labour_welfare:    { label_en: 'Labour Welfare',    label_hi: 'श्रम कल्याण',     color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',   icon: '👷' },
  women_empowerment: { label_en: "Women's Welfare",   label_hi: 'महिला कल्याण',    color: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700',         icon: '👩' },
  other:             { label_en: 'Other',             label_hi: 'अन्य',            color: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',            icon: '📋' },
};

const SKILL_LABELS = {
  unskilled:    { en: 'Unskilled',    hi: 'अकुशल'     },
  semi_skilled: { en: 'Semi-Skilled', hi: 'अर्ध-कुशल' },
  skilled:      { en: 'Skilled',      hi: 'कुशल'       },
};

const DEMOG_LABELS = {
  all:    { en: 'All',            hi: 'सभी'             },
  women:  { en: 'Women',          hi: 'महिलाएं'         },
  youth:  { en: 'Youth',          hi: 'युवा'            },
  senior: { en: 'Senior Citizen', hi: 'वरिष्ठ नागरिक'  },
  rural:  { en: 'Rural',          hi: 'ग्रामीण'         },
  urban:  { en: 'Urban',          hi: 'शहरी'            },
  tribal: { en: 'Tribal',         hi: 'जनजातीय'         },
};

const STATES = [
  'Uttar Pradesh','Maharashtra','Bihar','Rajasthan','Madhya Pradesh',
  'Gujarat','West Bengal','Tamil Nadu','Karnataka','Andhra Pradesh',
  'Telangana','Kerala','Punjab','Haryana','Odisha','Jharkhand',
];

const MODAL_TABS = [
  { id: 'overview',     icon: BookOpen,    label_en: 'Overview',     label_hi: 'अवलोकन'   },
  { id: 'eligibility',  icon: CheckCircle, label_en: 'Eligibility',  label_hi: 'पात्रता'   },
  { id: 'benefits',     icon: Star,        label_en: 'Benefits',     label_hi: 'लाभ'       },
  { id: 'documents',    icon: FileText,    label_en: 'Documents',    label_hi: 'दस्तावेज' },
  { id: 'steps',        icon: ChevronRight,label_en: 'How to Apply', label_hi: 'कैसे करें' },
  { id: 'video',        icon: Play,        label_en: 'Video',        label_hi: 'वीडियो'    },
];

/* ══════════════════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════════════════ */
const tl  = (obj, lang) => obj?.[lang] || obj?.en || '';
const catLabel = (cat, lang) =>
  lang === 'hi' ? (CAT_CONFIG[cat]?.label_hi || cat) : (CAT_CONFIG[cat]?.label_en || cat);

/* ══════════════════════════════════════════════════════════════════════════════
   SCHEME LOGO — shows official favicon or emoji fallback
══════════════════════════════════════════════════════════════════════════════ */
const SchemeLogo = ({ scheme, size = 'md' }) => {
  const [imgError, setImgError] = useState(false);
  const sizes = { sm: 'w-8 h-8 text-lg', md: 'w-10 h-10 text-2xl', lg: 'w-14 h-14 text-4xl' };
  const fallback = scheme.logoFallback || CAT_CONFIG[scheme.category]?.icon || '📋';

  if (scheme.logoUrl && !imgError) {
    return (
      <div className={`${sizes[size]} rounded-xl flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden flex-shrink-0 shadow-sm`}>
        <img
          src={scheme.logoUrl}
          alt=""
          className="w-full h-full object-contain p-1"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }
  return (
    <div className={`${sizes[size]} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <span>{fallback}</span>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   SAVE BUTTON
══════════════════════════════════════════════════════════════════════════════ */
const SaveButton = ({ schemeId, savedIds, onToggle, lang }) => {
  const saved = savedIds.has(schemeId);
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle(schemeId, saved); }}
      title={saved
        ? (lang === 'hi' ? 'सहेजा गया — हटाने के लिए क्लिक करें' : 'Saved — click to remove')
        : (lang === 'hi' ? 'बाद के लिए सहेजें' : 'Save for later')}
      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
        saved
          ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 hover:bg-orange-200'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-500'
      }`}
    >
      {saved
        ? <BookmarkCheck className="w-4 h-4" />
        : <Bookmark className="w-4 h-4" />
      }
    </button>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   YOUTUBE EMBED — fixed to use nocookie domain
══════════════════════════════════════════════════════════════════════════════ */
const YouTubeEmbed = ({ videoId, title }) => {
  const [playing, setPlaying] = useState(false);

  useEffect(() => { setPlaying(false); }, [videoId]);

  if (!videoId) {
    return (
      <div className="flex flex-col items-center justify-center py-10 bg-gray-50 dark:bg-gray-800 rounded-2xl text-center">
        <Youtube className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm text-gray-400">
          {title === 'hi' ? 'वीडियो उपलब्ध नहीं' : 'No video available for this scheme'}
        </p>
      </div>
    );
  }

  // youtube-nocookie.com avoids "Video unavailable" errors from embed restrictions
  const embedUrl  = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  const thumbUrl  = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const watchUrl  = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-md">
        {playing ? (
          <iframe
            key={videoId}
            src={embedUrl}
            title={title || 'How to apply'}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <div className="relative w-full h-full cursor-pointer group" onClick={() => setPlaying(true)}>
            <img
              src={thumbUrl}
              alt={title}
              className="w-full h-full object-cover"
              onError={e => {
                // Fallback to mqdefault if hqdefault unavailable
                e.target.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/45 transition-all">
              <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </div>
            </div>
            <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
              <Youtube className="w-3.5 h-3.5 text-red-400" />
              YouTube
            </div>
            {title && (
              <div className="absolute bottom-0 left-0 right-0 pb-2 pt-8 px-3 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-xs font-semibold line-clamp-1">{title}</p>
              </div>
            )}
          </div>
        )}
      </div>
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Open on YouTube
      </a>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   SCHEME CARD
══════════════════════════════════════════════════════════════════════════════ */
const SchemeCard = ({ scheme, lang, onClick, savedIds, onToggleSave, isAuthenticated }) => {
  const cat = CAT_CONFIG[scheme.category] || CAT_CONFIG.other;
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-700 hover:shadow-lg transition-all cursor-pointer group p-4 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <SchemeLogo scheme={scheme} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white text-sm leading-snug group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors line-clamp-2">
            {lang === 'hi' ? scheme.name_hi : scheme.name_en}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
            {lang === 'hi' ? scheme.ministry_hi : scheme.ministry_en}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {scheme.isFeatured && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-orange-500 text-white">★</span>
          )}
          {isAuthenticated && (
            <SaveButton schemeId={scheme._id} savedIds={savedIds} onToggle={onToggleSave} lang={lang} />
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
        {lang === 'hi' ? scheme.description_hi : scheme.description_en}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.color}`}>
          {catLabel(scheme.category, lang)}
        </span>
        {scheme.state && scheme.state !== 'National' && scheme.state !== 'All India' && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" />{scheme.state}
          </span>
        )}
        {scheme.skillLevel && scheme.skillLevel !== 'any' && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {SKILL_LABELS[scheme.skillLevel]?.[lang] || scheme.skillLevel}
          </span>
        )}
        {scheme.demographic && scheme.demographic !== 'all' && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-700">
            {DEMOG_LABELS[scheme.demographic]?.[lang] || scheme.demographic}
          </span>
        )}
        {scheme.benefitAmount && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700 ml-auto">
            {scheme.benefitAmount}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50 dark:border-gray-700">
        <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
          {scheme.youtubeVideoId && (
            <span className="flex items-center gap-1">
              <Play className="w-3 h-3 text-red-400 fill-red-400" />
              {lang === 'hi' ? 'वीडियो' : 'Video'}
            </span>
          )}
          {scheme.helplineNumber && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-green-500" />
              {scheme.helplineNumber}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 group-hover:gap-2 transition-all">
          {lang === 'hi' ? 'विवरण देखें' : 'View Details'}
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   SCHEME DETAIL MODAL
══════════════════════════════════════════════════════════════════════════════ */
const SchemeDetailModal = ({ scheme, onClose, lang, savedIds, onToggleSave, isAuthenticated }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const cat = CAT_CONFIG[scheme.category] || CAT_CONFIG.other;

  useEffect(() => { setActiveTab('overview'); }, [scheme._id]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const videoTitle = lang === 'hi'
    ? (scheme.youtubeTitle_hi || scheme.name_hi)
    : (scheme.youtubeTitle_en || scheme.name_en);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-up"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-start gap-3">
            <SchemeLogo scheme={scheme} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-gray-900 dark:text-white text-lg leading-snug">
                    {lang === 'hi' ? scheme.name_hi : scheme.name_en}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {lang === 'hi' ? scheme.ministry_hi : scheme.ministry_en}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isAuthenticated && (
                    <SaveButton schemeId={scheme._id} savedIds={savedIds} onToggle={onToggleSave} lang={lang} />
                  )}
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Meta badges */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.color}`}>
                  {cat.icon} {catLabel(scheme.category, lang)}
                </span>
                {scheme.state && scheme.state !== 'National' && scheme.state !== 'All India' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />{scheme.state}
                  </span>
                )}
                {scheme.benefitAmount && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700">
                    {scheme.benefitAmount}
                  </span>
                )}
                {scheme.helplineNumber && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5" />
                    {scheme.helplineNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 overflow-x-auto scrollbar-hide pb-1">
            {MODAL_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {lang === 'hi' ? tab.label_hi : tab.label_en}
              </button>
            ))}
          </div>
        </div>

        {/* Tab body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                {lang === 'hi' ? scheme.description_hi : scheme.description_en}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label_en: 'Category', label_hi: 'श्रेणी', value: catLabel(scheme.category, lang) },
                  { label_en: 'Coverage', label_hi: 'क्षेत्र', value: (scheme.state && scheme.state !== 'National' && scheme.state !== 'All India') ? scheme.state : (lang === 'hi' ? 'सम्पूर्ण भारत' : 'All India') },
                  scheme.skillLevel && scheme.skillLevel !== 'any' && { label_en: 'Skill Level', label_hi: 'कौशल स्तर', value: SKILL_LABELS[scheme.skillLevel]?.[lang] || scheme.skillLevel },
                  scheme.demographic && scheme.demographic !== 'all' && { label_en: 'Target Group', label_hi: 'लक्ष्य वर्ग', value: DEMOG_LABELS[scheme.demographic]?.[lang] || scheme.demographic },
                  (scheme.ageMin || scheme.ageMax) && { label_en: 'Age', label_hi: 'आयु', value: `${scheme.ageMin || 0}–${scheme.ageMax || 60} ${lang === 'hi' ? 'वर्ष' : 'yrs'}` },
                  scheme.benefitAmount && { label_en: 'Benefit', label_hi: 'लाभ राशि', value: scheme.benefitAmount },
                ].filter(Boolean).map((item, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {lang === 'hi' ? item.label_hi : item.label_en}
                    </p>
                    <p className="text-sm font-bold text-gray-800 dark:text-white mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ELIGIBILITY */}
          {activeTab === 'eligibility' && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {lang === 'hi' ? 'पात्रता मानदंड' : 'Eligibility Criteria'}
              </p>
              {(scheme.eligibilityCriteria || []).map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{tl(c, lang)}</p>
                </div>
              ))}
            </div>
          )}

          {/* BENEFITS */}
          {activeTab === 'benefits' && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {lang === 'hi' ? 'इस योजना के लाभ' : 'Benefits of this Scheme'}
              </p>
              {(scheme.benefits || []).map((b, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                  <Star className="w-4 h-4 text-blue-500 fill-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{tl(b, lang)}</p>
                </div>
              ))}
            </div>
          )}

          {/* DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {lang === 'hi' ? 'आवश्यक दस्तावेज' : 'Required Documents'}
              </p>
              {(scheme.documentsRequired || []).map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0 text-sm">✅</div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{tl(d, lang)}</p>
                </div>
              ))}
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl">
                <p className="text-xs text-orange-700 dark:text-orange-400">
                  💡 {lang === 'hi'
                    ? 'सभी दस्तावेज़ों की स्व-सत्यापित फोटोकॉपी साथ रखें।'
                    : 'Carry self-attested photocopies of all documents.'}
                </p>
              </div>
            </div>
          )}

          {/* STEPS */}
          {activeTab === 'steps' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {lang === 'hi' ? 'आवेदन प्रक्रिया' : 'Application Steps'}
              </p>
              {(scheme.applicationSteps || []).map((s, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-black flex-shrink-0">
                      {s.step || i + 1}
                    </div>
                    {i < (scheme.applicationSteps.length - 1) && (
                      <div className="w-px flex-1 bg-orange-200 dark:bg-orange-800 mt-1 mb-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl p-3.5">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{tl(s, lang)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIDEO */}
          {activeTab === 'video' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {lang === 'hi' ? 'आवेदन वीडियो गाइड' : 'How-to-Apply Video Guide'}
              </p>
              <YouTubeEmbed videoId={scheme.youtubeVideoId} title={videoTitle} />
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="flex-shrink-0 p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 space-y-2">
          {scheme.helplineNumber && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl">
              <Phone className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
                  {scheme.helplineLabel || (lang === 'hi' ? 'हेल्पलाइन' : 'Helpline')}: <span className="font-black">{scheme.helplineNumber}</span>
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <a
              href={scheme.officialLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold text-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-md shadow-orange-200"
            >
              <Globe className="w-4 h-4" />
              {lang === 'hi' ? 'आवेदन करें' : 'Apply Now'} → {scheme.portalName}
            </a>
            <button
              onClick={onClose}
              className="py-3 px-5 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {lang === 'hi' ? 'बंद करें' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   SAVED SCHEMES DRAWER
══════════════════════════════════════════════════════════════════════════════ */
const SavedDrawer = ({ open, onClose, lang, savedSchemes, onView, savedIds, onToggleSave, isAuthenticated }) => {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 h-full flex flex-col shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="font-display font-bold text-gray-900 dark:text-white">
              {lang === 'hi' ? 'सहेजी गई योजनाएं' : 'Saved Schemes'}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {savedSchemes.length} {lang === 'hi' ? 'योजनाएं सहेजी गई हैं' : 'schemes saved'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedSchemes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <BookmarkCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {lang === 'hi' ? 'कोई योजना सहेजी नहीं' : 'No saved schemes yet'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {lang === 'hi' ? 'योजना कार्ड पर 🔖 क्लिक करके सहेजें' : 'Click 🔖 on any scheme card to save it'}
              </p>
            </div>
          ) : (
            savedSchemes.map(scheme => (
              <SchemeCard
                key={scheme._id}
                scheme={scheme}
                lang={lang}
                onClick={() => { onView(scheme); onClose(); }}
                savedIds={savedIds}
                onToggleSave={onToggleSave}
                isAuthenticated={isAuthenticated}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function SchemesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'en');
  const [selected,    setSelected]    = useState(null);
  const [search,      setSearch]      = useState('');
  const [debSearch,   setDebSearch]   = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSaved,   setShowSaved]   = useState(false);
  const [page,        setPage]        = useState(1);
  const [filters, setFilters] = useState({
    category: '', state: '', skillLevel: '', demographic: '',
    socioEconomic: '', employmentStatus: '', featured: '',
  });

  const searchRef = useRef(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => { setDebSearch(search); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleLang = () => {
    const n = lang === 'en' ? 'hi' : 'en';
    setLang(n);
    localStorage.setItem(LANG_KEY, n);
  };

  const setFilter = useCallback((key, val) => {
    setFilters(f => ({ ...f, [key]: f[key] === val ? '' : val }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ category:'',state:'',skillLevel:'',demographic:'',socioEconomic:'',employmentStatus:'',featured:'' });
    setSearch('');
    setPage(1);
  }, []);

  // ── IMPORTANT: do NOT add .then(r => r.data) — schemeService already extracts data ──
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['schemes', { ...filters, search: debSearch, page }],
    queryFn: () => schemeService.getSchemes({
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      search: debSearch || undefined,
      page, limit: 12,
    }),
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000,
  });

  // schemeService returns: { success, data: [...], meta: { total, page, totalPages } }
  const schemes    = data?.data        || [];
  const total      = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  // Saved schemes
  const { data: savedData } = useQuery({
    queryKey: ['saved-schemes'],
    queryFn:  schemeService.getSavedSchemes,
    enabled:  isAuthenticated,
    staleTime: 60 * 1000,
  });
  const savedSchemes = savedData?.data || [];
  const savedIds     = new Set(savedSchemes.map(s => s._id?.toString()));

  // Save/unsave mutation
  const saveMut = useMutation({
    mutationFn: ({ id, isSaved }) => isSaved ? schemeService.unsaveScheme(id) : schemeService.saveScheme(id),
    onMutate: async ({ id, isSaved }) => {
      await qc.cancelQueries(['saved-schemes']);
      const prev = qc.getQueryData(['saved-schemes']);
      qc.setQueryData(['saved-schemes'], old => {
        if (!old) return old;
        const arr = old.data || [];
        return {
          ...old,
          data: isSaved ? arr.filter(s => s._id?.toString() !== id) : [...arr, schemes.find(s => s._id?.toString() === id)].filter(Boolean),
        };
      });
      return { prev };
    },
    onError: (err, vars, ctx) => {
      qc.setQueryData(['saved-schemes'], ctx.prev);
      toast.error(lang === 'hi' ? 'त्रुटि हुई, पुनः प्रयास करें' : 'Failed, please try again');
    },
    onSuccess: (_, { isSaved }) => {
      toast.success(
        isSaved
          ? (lang === 'hi' ? 'योजना हटाई गई' : 'Scheme removed from saved')
          : (lang === 'hi' ? 'योजना सहेजी गई ✓' : 'Scheme saved ✓'),
        { duration: 2000 }
      );
      qc.invalidateQueries(['saved-schemes']);
    },
  });

  const handleToggleSave = useCallback((id, isSaved) => {
    if (!isAuthenticated) {
      toast.error(lang === 'hi' ? 'सहेजने के लिए लॉगिन करें' : 'Please login to save schemes');
      return;
    }
    saveMut.mutate({ id, isSaved });
  }, [isAuthenticated, lang, saveMut]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const CAT_CHIPS = Object.entries(CAT_CONFIG).slice(0, 8);
  const DEMOGRAPHICS = Object.entries(DEMOG_LABELS).filter(([k]) => k !== 'all');
  const SKILL_LEVELS = Object.entries(SKILL_LABELS);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 dark:text-slate-100">

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">

          {/* Top bar */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-slate-300" />
            </button>

            <div className="flex-1">
              <h1 className="font-display font-bold text-lg text-gray-900 dark:text-white leading-tight">
                {lang === 'hi' ? 'सरकारी कल्याण योजनाएं' : 'Government Welfare Schemes'}
              </h1>
              <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
                {isLoading || isFetching
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> {lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}</>
                  : `${total} ${lang === 'hi' ? 'योजनाएं उपलब्ध' : 'schemes available'}`
                }
              </p>
            </div>

            {/* Saved icon */}
            {isAuthenticated && (
              <button
                onClick={() => setShowSaved(true)}
                className="relative w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 transition-colors text-gray-500 dark:text-slate-400"
                title={lang === 'hi' ? 'सहेजी गई योजनाएं' : 'Saved Schemes'}
              >
                <Bookmark className="w-4 h-4" />
                {savedIds.size > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center">
                    {savedIds.size > 9 ? '9+' : savedIds.size}
                  </span>
                )}
              </button>
            )}

            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
            >
              <Languages className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-black text-orange-700 dark:text-orange-400">
                {lang === 'en' ? 'हिंदी' : 'EN'}
              </span>
            </button>
          </div>

          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={lang === 'hi' ? 'योजना खोजें...' : 'Search schemes...'}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border-2 transition-all text-sm font-bold ${
                showFilters || activeFilterCount > 0
                  ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                  : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-orange-300'
              }`}
            >
              <Filter className="w-4 h-4" />
              {lang === 'hi' ? 'फ़िल्टर' : 'Filter'}
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Category chips */}
          <div className="flex gap-2 mt-2.5 overflow-x-auto scrollbar-hide pb-0.5">
            <button
              onClick={() => setFilter('featured', filters.featured ? '' : 'true')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all flex-shrink-0 ${
                filters.featured
                  ? 'border-orange-500 bg-orange-500 text-white'
                  : 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:border-orange-400'
              }`}
            >
              ★ {lang === 'hi' ? 'प्रमुख' : 'Featured'}
            </button>
            {CAT_CHIPS.map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setFilter('category', key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all flex-shrink-0 ${
                  filters.category === key
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:border-orange-300'
                }`}
              >
                {cfg.icon} {lang === 'hi' ? cfg.label_hi : cfg.label_en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Advanced Filters Panel ─────────────────────────────────────────── */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-700 dark:text-slate-200">
                {lang === 'hi' ? 'उन्नत फ़िल्टर' : 'Advanced Filters'}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  {lang === 'hi' ? 'सभी साफ करें' : 'Clear all'}
                </button>
              )}
            </div>

            {/* State */}
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 mb-2">{lang === 'hi' ? 'राज्य' : 'State'}</p>
              <div className="flex gap-2 flex-wrap">
                {STATES.map(s => (
                  <button key={s} onClick={() => setFilter('state', s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      filters.state === s
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-blue-300 bg-white dark:bg-slate-700'
                    }`}>{s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Skill Level */}
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 mb-2">{lang === 'hi' ? 'कौशल स्तर' : 'Skill Level'}</p>
                <div className="flex gap-2 flex-wrap">
                  {SKILL_LEVELS.map(([k, l]) => (
                    <button key={k} onClick={() => setFilter('skillLevel', k)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        filters.skillLevel === k
                          ? 'bg-green-500 text-white border-green-500'
                          : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-green-300 bg-white dark:bg-slate-700'
                      }`}>{l[lang] || l.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Demographic */}
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 mb-2">{lang === 'hi' ? 'लाभार्थी' : 'Beneficiary'}</p>
                <div className="flex gap-2 flex-wrap">
                  {DEMOGRAPHICS.map(([k, l]) => (
                    <button key={k} onClick={() => setFilter('demographic', k)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        filters.demographic === k
                          ? 'bg-pink-500 text-white border-pink-500'
                          : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-pink-300 bg-white dark:bg-slate-700'
                      }`}>{l[lang] || l.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Employment Status */}
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 mb-2">{lang === 'hi' ? 'रोजगार स्थिति' : 'Employment Status'}</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { k: 'unemployed',    en: 'Unemployed',     hi: 'बेरोजगार'    },
                    { k: 'daily_wage',    en: 'Daily Wage',     hi: 'दैनिक मजदूर' },
                    { k: 'self_employed', en: 'Self Employed',  hi: 'स्व-रोजगार'  },
                  ].map(({ k, en, hi }) => (
                    <button key={k} onClick={() => setFilter('employmentStatus', k)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        filters.employmentStatus === k
                          ? 'bg-indigo-500 text-white border-indigo-500'
                          : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-indigo-300 bg-white dark:bg-slate-700'
                      }`}>{lang === 'hi' ? hi : en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Socio-economic */}
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 mb-2">{lang === 'hi' ? 'आर्थिक वर्ग' : 'Economic Category'}</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { k: 'bpl',           en: 'BPL',          hi: 'BPL'          },
                    { k: 'low_income',    en: 'Low Income',   hi: 'कम आय'        },
                    { k: 'middle_income', en: 'Middle Income', hi: 'मध्यम आय'    },
                  ].map(({ k, en, hi }) => (
                    <button key={k} onClick={() => setFilter('socioEconomic', k)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        filters.socioEconomic === k
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-amber-300 bg-white dark:bg-slate-700'
                      }`}>{lang === 'hi' ? hi : en}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* Active filter pills */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400">
              {lang === 'hi' ? 'सक्रिय फ़िल्टर:' : 'Active:'}
            </span>
            {Object.entries(filters).filter(([, v]) => v).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                {v === 'true' ? '★ Featured' : v}
                <button onClick={() => setFilter(k, v)} className="hover:text-orange-900 dark:hover:text-orange-200">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-56 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 animate-pulse" />
            ))}
          </div>
        ) : schemes.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-bold text-gray-500 dark:text-slate-400 text-lg">
              {lang === 'hi' ? 'कोई योजना नहीं मिली' : 'No schemes found'}
            </p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-2 mb-5">
              {lang === 'hi' ? 'फ़िल्टर बदलने की कोशिश करें' : 'Try changing your filters or clear all'}
            </p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-colors">
                {lang === 'hi' ? 'फ़िल्टर साफ करें' : 'Clear Filters'}
              </button>
            )}
            {!activeFilterCount && !debSearch && (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mx-4 text-left">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>No data in database.</strong> Run:{' '}
                  <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded text-xs">node backend/data/seedSchemes.js</code>
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {schemes.map(s => (
                <SchemeCard
                  key={s._id}
                  scheme={s}
                  lang={lang}
                  onClick={() => setSelected(s)}
                  savedIds={savedIds}
                  onToggleSave={handleToggleSave}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-semibold text-gray-700 dark:text-slate-300 disabled:opacity-40 hover:border-orange-300 transition-all">
                  {lang === 'hi' ? '← पिछला' : '← Prev'}
                </button>
                <span className="text-sm text-gray-500 dark:text-slate-400">
                  {lang === 'hi' ? `पृष्ठ ${page} / ${totalPages}` : `Page ${page} of ${totalPages}`}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-semibold text-gray-700 dark:text-slate-300 disabled:opacity-40 hover:border-orange-300 transition-all">
                  {lang === 'hi' ? 'अगला →' : 'Next →'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Info footer */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-2xl p-5 text-center">
          <p className="text-sm font-bold text-orange-800 dark:text-orange-300 mb-1">
            {lang === 'hi' ? '💡 सहायता चाहिए?' : '💡 Need Help?'}
          </p>
          <p className="text-xs text-orange-700 dark:text-orange-400">
            {lang === 'hi'
              ? 'किसी भी योजना के लिए नजदीकी CSC (कॉमन सर्विस सेंटर) या ग्राम पंचायत से संपर्क करें।'
              : 'For any scheme, visit your nearest CSC (Common Service Centre) or Gram Panchayat for free assistance.'}
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mt-1">Helpline: 14555</p>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <SchemeDetailModal
          scheme={selected}
          onClose={() => setSelected(null)}
          lang={lang}
          savedIds={savedIds}
          onToggleSave={handleToggleSave}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Saved Drawer */}
      <SavedDrawer
        open={showSaved}
        onClose={() => setShowSaved(false)}
        lang={lang}
        savedSchemes={savedSchemes}
        onView={setSelected}
        savedIds={savedIds}
        onToggleSave={handleToggleSave}
        isAuthenticated={isAuthenticated}
      />
      <LabourBot context="schemes" lang={lang} />
    </div>
  );
}