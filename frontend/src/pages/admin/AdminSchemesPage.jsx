import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, X, Edit2, Trash2, Eye, EyeOff,
  Star, StarOff, BookOpen, Filter, RefreshCw,
  AlertTriangle, CheckCircle, Globe, Youtube,
  BarChart2, TrendingUp,
} from 'lucide-react';
import schemeService from '@/services/schemeService';
import { useDebounce } from '@/hooks/useHooks';
import toast from 'react-hot-toast';

/* ── category config (same as SchemesPage) ─────────────────────────────── */
const CAT_CONFIG = {
  pension:           { label: 'Pension',         color: 'bg-purple-100 text-purple-700', icon: '🏦' },
  insurance:         { label: 'Insurance',        color: 'bg-blue-100 text-blue-700',    icon: '🛡️' },
  housing:           { label: 'Housing',          color: 'bg-orange-100 text-orange-700', icon: '🏠' },
  skill_development: { label: 'Skill Training',   color: 'bg-green-100 text-green-700',  icon: '📚' },
  healthcare:        { label: 'Healthcare',       color: 'bg-red-100 text-red-700',      icon: '🏥' },
  social_security:   { label: 'Social Security',  color: 'bg-indigo-100 text-indigo-700', icon: '🔐' },
  financial_aid:     { label: 'Financial Aid',    color: 'bg-emerald-100 text-emerald-700', icon: '💰' },
  labour_welfare:    { label: 'Labour Welfare',   color: 'bg-amber-100 text-amber-700',  icon: '👷' },
  women_empowerment: { label: "Women's Welfare",  color: 'bg-pink-100 text-pink-700',    icon: '👩' },
  other:             { label: 'Other',            color: 'bg-gray-100 text-gray-600',    icon: '📋' },
};

const AdminSchemesPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search,      setSearch]      = useState('');
  const [catFilter,   setCatFilter]   = useState('');
  const [activeFilter,setActiveFilter]= useState('');
  const [featFilter,  setFeatFilter]  = useState('');
  const [page,        setPage]        = useState(1);
  const [confirmDel,  setConfirmDel]  = useState(null);

  const dSearch = useDebounce(search, 400);

  /* ── fetch all schemes (admin — includes inactive) ─────────────────────── */
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-schemes', { dSearch, catFilter, activeFilter, featFilter, page }],
    queryFn: () => schemeService.getAllSchemesAdmin({
      search:     dSearch      || undefined,
      category:   catFilter    || undefined,
      isActive:   activeFilter !== '' ? activeFilter : undefined,
      isFeatured: featFilter   !== '' ? featFilter   : undefined,
      page,
      limit: 15,
    }),
    keepPreviousData: true,
  });

  const schemes    = data?.data        || [];
  const total      = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  /* ── stats from current data ────────────────────────────────────────────── */
  const statsQuery = useQuery({
    queryKey: ['admin-schemes-stats'],
    queryFn: () => schemeService.getAllSchemesAdmin({ limit: 1000 }),
    staleTime: 5 * 60 * 1000,
  });
  const allSchemes = statsQuery.data?.data || [];
  const stats = {
    total:    allSchemes.length,
    active:   allSchemes.filter(s => s.isActive).length,
    featured: allSchemes.filter(s => s.isFeatured).length,
    byCat:    Object.keys(CAT_CONFIG).map(k => ({
      key: k,
      label: CAT_CONFIG[k].label,
      count: allSchemes.filter(s => s.category === k).length,
    })).filter(c => c.count > 0),
  };

  /* ── mutations ──────────────────────────────────────────────────────────── */
  const toggleActiveMut = useMutation({
    mutationFn: (id) => schemeService.toggleActive(id),
    onSuccess: () => { qc.invalidateQueries(['admin-schemes']); qc.invalidateQueries(['admin-schemes-stats']); qc.invalidateQueries(['schemes']); },
    onError: (e) => toast.error(e.message || 'Failed to update'),
  });

  const toggleFeatMut = useMutation({
    mutationFn: (id) => schemeService.toggleFeatured(id),
    onSuccess: () => { qc.invalidateQueries(['admin-schemes']); qc.invalidateQueries(['admin-schemes-stats']); qc.invalidateQueries(['schemes']); },
    onError: (e) => toast.error(e.message || 'Failed to update'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => schemeService.deleteScheme(id),
    onSuccess: () => {
      qc.invalidateQueries(['admin-schemes']);
      qc.invalidateQueries(['admin-schemes-stats']);
      qc.invalidateQueries(['schemes']);
      toast.success('Scheme deleted');
      setConfirmDel(null);
    },
    onError: (e) => toast.error(e.message || 'Failed to delete'),
  });

  const clearFilters = useCallback(() => {
    setSearch(''); setCatFilter(''); setActiveFilter(''); setFeatFilter(''); setPage(1);
  }, []);

  const activeFilterCount = [dSearch, catFilter, activeFilter, featFilter].filter(Boolean).length;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-orange-500" />
            Government Schemes
          </h1>
          <p className="text-slate-500 mt-1 text-sm">{total} schemes • manage, create, and publish welfare schemes</p>
        </div>
        <button
          onClick={() => navigate('/admin/schemes/new')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold text-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-md shadow-orange-200"
        >
          <Plus className="w-4 h-4" />
          Create Scheme
        </button>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Schemes', value: stats.total,    icon: BookOpen,    color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Active',        value: stats.active,   icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Featured',      value: stats.featured, icon: Star,        color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Inactive',      value: stats.total - stats.active, icon: EyeOff, color: 'text-gray-500', bg: 'bg-gray-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card card-body flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Category breakdown ──────────────────────────────────────────── */}
      {stats.byCat.length > 0 && (
        <div className="card card-body">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" /> Schemes by Category
          </p>
          <div className="flex flex-wrap gap-2">
            {stats.byCat.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => { setCatFilter(catFilter === key ? '' : key); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  catFilter === key
                    ? 'bg-orange-500 text-white border-orange-500'
                    : `${CAT_CONFIG[key]?.color} border-transparent hover:border-current`
                }`}
              >
                <span>{CAT_CONFIG[key]?.icon}</span>
                {label}
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  catFilter === key ? 'bg-white/20 text-white' : 'bg-black/10'
                }`}>{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search by name…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>
        <select className="input w-auto text-sm" value={catFilter}
          onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {Object.entries(CAT_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>
        <select className="input w-auto text-sm" value={activeFilter}
          onChange={e => { setActiveFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select className="input w-auto text-sm" value={featFilter}
          onChange={e => { setFeatFilter(e.target.value); setPage(1); }}>
          <option value="">All</option>
          <option value="true">Featured</option>
          <option value="false">Not Featured</option>
        </select>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear ({activeFilterCount})
          </button>
        )}
        <button
          onClick={() => { qc.invalidateQueries(['admin-schemes']); qc.invalidateQueries(['admin-schemes-stats']); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : schemes.length === 0 ? (
        <div className="card card-body flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">No schemes found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting filters or create a new scheme</p>
          <button
            onClick={() => navigate('/admin/schemes/new')}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create First Scheme
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Scheme</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden md:table-cell">State</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">Featured</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {schemes.map(scheme => {
                  const cat = CAT_CONFIG[scheme.category] || CAT_CONFIG.other;
                  return (
                    <tr key={scheme._id} className={`hover:bg-surface-50 transition-colors ${!scheme.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <span className="text-xl flex-shrink-0 mt-0.5">{cat.icon}</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm leading-snug line-clamp-1">{scheme.name_en}</p>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{scheme.name_hi}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {scheme.benefitAmount && (
                                <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                                  {scheme.benefitAmount}
                                </span>
                              )}
                              {scheme.youtubeVideoId && (
                                <span className="text-[10px] text-red-500 flex items-center gap-0.5">
                                  <Youtube className="w-3 h-3" /> Video
                                </span>
                              )}
                              {scheme.officialLink && (
                                <span className="text-[10px] text-blue-500 flex items-center gap-0.5">
                                  <Globe className="w-3 h-3" /> Link
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>
                          {cat.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-slate-500">
                          {scheme.state || 'National'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            toggleActiveMut.mutate(scheme._id);
                            toast.success(scheme.isActive ? 'Deactivating…' : 'Activating…');
                          }}
                          disabled={toggleActiveMut.isPending}
                          title={scheme.isActive ? 'Click to deactivate' : 'Click to activate'}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 ${
                            scheme.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {scheme.isActive ? <><CheckCircle className="w-3 h-3" /> Active</> : <><EyeOff className="w-3 h-3" /> Inactive</>}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleFeatMut.mutate(scheme._id)}
                          disabled={toggleFeatMut.isPending}
                          title={scheme.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                          className={`p-1.5 rounded-lg transition-all hover:scale-110 ${
                            scheme.isFeatured
                              ? 'text-orange-500 bg-orange-50 hover:bg-orange-100'
                              : 'text-gray-300 hover:text-orange-400 hover:bg-orange-50'
                          }`}
                        >
                          {scheme.isFeatured ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/admin/schemes/${scheme._id}/edit`)}
                            title="Edit scheme"
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDel(scheme)}
                            title="Delete scheme"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100">
              <p className="text-xs text-slate-500">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Delete confirm modal ─────────────────────────────────────────── */}
      {confirmDel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setConfirmDel(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-lg">Delete Scheme?</h3>
              <p className="text-slate-500 text-sm mt-1">
                "<span className="font-semibold">{confirmDel.name_en}</span>" will be permanently deleted.
                All saved bookmarks for this scheme will also be removed.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDel(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMut.mutate(confirmDel._id)}
                disabled={deleteMut.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleteMut.isPending
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Trash2 className="w-4 h-4" /> Delete</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSchemesPage;