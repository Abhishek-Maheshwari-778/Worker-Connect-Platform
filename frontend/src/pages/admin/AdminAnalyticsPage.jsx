/**
 * Admin Analytics Dashboard
 * Pure SVG + Tailwind charts — no external chart library needed.
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, Users, Briefcase,
  IndianRupee, Star, Target, Activity, Zap,
  RefreshCw, Loader2, MapPin, BarChart2,
  CheckCircle, Clock, Calendar, AlertTriangle, ArrowUpRight,
  Shield, Heart, Award
} from 'lucide-react';
import adminService from '@/services/adminService';

/* ══════════════════════════════════════════════════════════════════════════════
   CHART PRIMITIVES — Pure SVG
══════════════════════════════════════════════════════════════════════════════ */

/** Line + area chart */
const LineChart = ({ data, color = '#f97316', fillColor = '#fff7ed', height = 120, label = '', valueFn = d => d.count || 0 }) => {
  if (!data?.length) return <div style={{ height }} className="flex items-center justify-center text-xs text-gray-400">No data</div>;
  const vals   = data.map(valueFn);
  const max    = Math.max(...vals, 1);
  const min    = Math.min(...vals, 0);
  const range  = max - min || 1;
  const W = 400; const H = height;
  const pad = 8;
  const pts = vals.map((v, i) => ({
    x: pad + (i / Math.max(vals.length - 1, 1)) * (W - pad * 2),
    y: H - pad - ((v - min) / range) * (H - pad * 2),
    v,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length-1].x.toFixed(1)},${H-pad} L${pts[0].x.toFixed(1)},${H-pad} Z`;
  const lastVal = vals[vals.length - 1];
  const prevVal = vals[vals.length - 2] || lastVal;
  const trend   = lastVal >= prevVal;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
        {/* Grid lines */}
        {[0.25,0.5,0.75,1].map(t => (
          <line key={t} x1={pad} x2={W-pad} y1={H-pad-(t*(H-pad*2))} y2={H-pad-(t*(H-pad*2))} stroke="#f3f4f6" strokeWidth="1" />
        ))}
        {/* Area fill */}
        <path d={area} fill={fillColor} fillOpacity="0.8" />
        {/* Line */}
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke="white" strokeWidth="2">
            <title>{`${data[i]?._id || ''}: ${p.v}`}</title>
          </circle>
        ))}
      </svg>
      <div className="flex items-center justify-between text-xs text-gray-500 mt-1 px-1">
        <span>{data[0]?._id?.slice(5) || ''}</span>
        <span className={`flex items-center gap-0.5 font-bold ${trend ? 'text-green-600' : 'text-red-500'}`}>
          {trend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {lastVal}
        </span>
        <span>{data[data.length-1]?._id?.slice(5) || ''}</span>
      </div>
    </div>
  );
};

/** Bar chart */
const BarChart = ({ data, color = '#f97316', height = 140, keyFn = d => d._id, valueFn = d => d.count || d.total || 0, maxBars = 12 }) => {
  const sliced = data?.slice(0, maxBars) || [];
  if (!sliced.length) return <div style={{ height }} className="flex items-center justify-center text-xs text-gray-400">No data</div>;
  const vals = sliced.map(valueFn);
  const max  = Math.max(...vals, 1);
  return (
    <div className="flex items-end gap-1.5 px-2" style={{ height }}>
      {sliced.map((d, i) => {
        const pct = (vals[i] / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[9px] font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">{vals[i]}</span>
            <div
              className="w-full rounded-t-xl transition-all duration-500"
              style={{ height: `${Math.max(pct * (height - 24) / 100, 4)}px`, backgroundColor: color, opacity: 0.7 + (i/sliced.length) * 0.3 }}
              title={`${keyFn(d)}: ${vals[i]}`}
            />
            <span className="text-[9px] text-gray-400 truncate w-full text-center">{String(keyFn(d)).slice(0,6)}</span>
          </div>
        );
      })}
    </div>
  );
};

/** Multi-bar chart */
const MultiBarChart = ({ data, height = 140, keys = [], colors = [] }) => {
  if (!data?.length) return <div style={{ height }} className="flex items-center justify-center text-xs text-gray-400">No data</div>;
  const maxVal = Math.max(...data.flatMap(d => keys.map(k => d[k] || 0)), 1);
  return (
    <div className="flex items-end gap-2 px-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex items-end gap-0.5 group">
          {keys.map((k, ki) => {
            const val = d[k] || 0;
            const h = Math.max((val / maxVal) * (height - 20), 2);
            return (
              <div key={k} className="flex-1 rounded-t-lg transition-all duration-500"
                style={{ height: h, backgroundColor: colors[ki] || '#f97316', opacity: 0.85 }}
                title={`${d._id || ''} ${k}: ${val}`} />
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** Donut chart */
const DonutChart = ({ segments = [], size = 100 }) => {
  const total = segments.reduce((s, seg) => s + (seg.value || 0), 0) || 1;
  let offset  = 0;
  const r = 38; const cx = 50; const cy = 50; const circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="flex-shrink-0">
      {segments.map((seg, i) => {
        const pct  = seg.value / total;
        const dash = pct * circ;
        const el   = (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={seg.color}
            strokeWidth="16"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          >
            <title>{seg.label}: {seg.value}</title>
          </circle>
        );
        offset += dash;
        return el;
      })}
      <circle cx={cx} cy={cy} r="28" fill="white" />
      <text x={cx} y={cy-4} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1f2937">{total}</text>
      <text x={cx} y={cy+8} textAnchor="middle" fontSize="6" fill="#9ca3af">total</text>
    </svg>
  );
};

/** Horizontal bar */
const HBar = ({ label, value, max, color = '#f97316', suffix = '' }) => (
  <div className="space-y-0.5">
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-600 font-medium truncate max-w-[120px]">{label}</span>
      <span className="font-bold text-gray-800 flex-shrink-0 ml-2">{value}{suffix}</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, (value / (max || 1)) * 100)}%`, backgroundColor: color }} />
    </div>
  </div>
);

/** Funnel */
const FunnelChart = ({ steps = [] }) => {
  const max = steps[0]?.value || 1;
  return (
    <div className="space-y-1.5">
      {steps.map((s, i) => {
        const pct = Math.round((s.value / max) * 100);
        const w   = 40 + (pct * 0.6);
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ backgroundColor: s.color + '20', color: s.color }}>
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-gray-700">{s.label}</span>
                <span className="text-xs font-black" style={{ color: s.color }}>{s.value.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000 flex items-center justify-end pr-1"
                  style={{ width: `${pct}%`, backgroundColor: s.color }}>
                  <span className="text-[8px] text-white font-black">{pct}%</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   REUSABLE CARD COMPONENTS
══════════════════════════════════════════════════════════════════════════════ */

const Card = ({ title, subtitle, icon: Icon, iconColor = 'text-orange-500', iconBg = 'bg-orange-100', children, className = '' }) => (
  <div className={`bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm ${className}`}>
    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">{title}</p>
          {subtitle && <p className="text-[10px] text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const KpiCard = ({ label, value, sub, icon: Icon, color, bg, trend, trendValue, prefix = '' }) => (
  <div className={`${bg} rounded-2xl border border-gray-100 p-4 relative overflow-hidden`}>
    <div className="absolute top-3 right-3">
      <div className={`w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
    </div>
    <p className="text-[11px] font-semibold text-gray-500 mb-1">{label}</p>
    <p className={`font-display font-black text-2xl ${color}`}>{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</p>
    {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    {trendValue !== undefined && (
      <div className={`flex items-center gap-1 mt-1.5 text-[11px] font-bold ${trend ? 'text-green-600' : 'text-red-500'}`}>
        {trend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {trendValue}
      </div>
    )}
  </div>
);

/* ── Health score gauge ────────────────────────────────────────────────────── */
const HealthGauge = ({ score }) => {
  const r = 52; const cx = 70; const cy = 70;
  const circ = Math.PI * r; // semicircle
  const filled = (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Attention';
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 140 80" width="180">
        {/* Background arc */}
        <path d={`M ${cx-r},${cy} A ${r},${r} 0 0,1 ${cx+r},${cy}`}
          fill="none" stroke="#f3f4f6" strokeWidth="12" strokeLinecap="round" />
        {/* Filled arc */}
        <path d={`M ${cx-r},${cy} A ${r},${r} 0 0,1 ${cx+r},${cy}`}
          fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`} />
        <text x={cx} y={cy-5} textAnchor="middle" fontSize="22" fontWeight="900" fill={color}>{score}</text>
        <text x={cx} y={cy+10} textAnchor="middle" fontSize="8" fill="#9ca3af">HEALTH SCORE</text>
      </svg>
      <span className="text-sm font-bold" style={{ color }}>{label}</span>
    </div>
  );
};

/* ── Day of week labels ────────────────────────────────────────────────────── */
const DOW = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState('30');

  const { data: raw, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['admin-analytics', period],
    queryFn:  () => adminService.getAnalytics({ period }).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 min
  });

  const d     = raw || {};
  const ov    = d.overview || {};
  const ch    = d.charts   || {};
  const fn    = d.funnels  || {};
  const top   = d.topCities || [];

  // Build combined daily trend data
  const dailyMap = useMemo(() => {
    const map = {};
    (ch.usersByDay   || []).forEach(r => { if (!map[r._id]) map[r._id] = {}; map[r._id].users   = r.total || 0; map[r._id].labour = r.labour || 0; map[r._id].client = r.client || 0; });
    (ch.jobsByDay    || []).forEach(r => { if (!map[r._id]) map[r._id] = {}; map[r._id].jobs    = r.count || 0; });
    (ch.appsByDay    || []).forEach(r => { if (!map[r._id]) map[r._id] = {}; map[r._id].apps    = r.count || 0; });
    (ch.revenueByDay || []).forEach(r => { if (!map[r._id]) map[r._id] = {}; map[r._id].revenue = r.revenue || 0; });
    (ch.completionsByDay||[]).forEach(r => { if (!map[r._id]) map[r._id] = {}; map[r._id].completions = r.count || 0; });
    return Object.entries(map).sort(([a],[b]) => a.localeCompare(b)).map(([date, vals]) => ({ _id: date, ...vals }));
  }, [ch]);

  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '';

  if (isLoading) return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-56 bg-white rounded-3xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-blue-600" />
            </div>
            <h1 className="page-title">Analytics Dashboard</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Real-time platform insights · Last updated {lastUpdate}
            {isFetching && <Loader2 className="w-3 h-3 animate-spin inline ml-2" />}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex rounded-2xl border border-gray-200 overflow-hidden bg-white">
            {[['7','7D'],['30','30D'],['90','90D'],['365','1Y']].map(([v,l]) => (
              <button key={v} onClick={() => setPeriod(v)}
                className={`px-3 py-1.5 text-xs font-bold transition-all ${period === v ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Total Users"      value={ov.totalUsers  || 0}   icon={Users}        color="text-blue-700"   bg="bg-blue-50"    sub={`${ov.activeThisWeek||0} active this week`} />
        <KpiCard label="Total Jobs"       value={ov.totalJobs   || 0}   icon={Briefcase}    color="text-orange-700" bg="bg-orange-50"  sub={`${ov.openJobs||0} open now`} />
        <KpiCard label="Success Rate"     value={`${ov.successRate||0}%`} icon={Target}      color="text-green-700"  bg="bg-green-50"   sub={`${ov.totalHired||0} hired`} />
        <KpiCard label="Revenue Potential" value={`₹${((ov.totalRevenue||0)/100000).toFixed(1)}L`} icon={IndianRupee} color="text-emerald-700" bg="bg-emerald-50" sub="total agreed wages" />
        <KpiCard label="Avg Rating"       value={ov.avgRating   || 0}   icon={Star}         color="text-amber-700"  bg="bg-amber-50"   sub="platform average" />
        <KpiCard label="Verified Labour"  value={`${ov.verifiedRate||0}%`} icon={Shield}    color="text-purple-700" bg="bg-purple-50"  sub={`of ${ov.totalLabour||0} workers`} />
      </div>

      {/* ── Health score + Retention + Disputes ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-gray-100 p-5 flex flex-col items-center justify-center shadow-sm">
          <p className="font-bold text-gray-800 text-sm mb-3">Platform Health</p>
          <HealthGauge score={ov.healthScore || 0} />
          <div className="grid grid-cols-2 gap-2 mt-4 w-full">
            {[
              { label: 'Completion', value: `${ov.completionRate||0}%` },
              { label: 'Hire Rate',  value: `${ov.successRate||0}%`   },
              { label: 'Verified',   value: `${ov.verifiedRate||0}%`  },
              { label: 'Avg Rating', value: ov.avgRating || 0         },
            ].map(s => (
              <div key={s.label} className="text-center p-2 bg-gray-50 rounded-xl">
                <p className="font-black text-gray-900 text-base">{s.value}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
          <p className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" /> User Retention
          </p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">7-day retention</span>
                <span className="font-black text-blue-700">{ov.retentionRate7||0}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${ov.retentionRate7||0}%` }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">{ov.activeThisWeek||0} of {ov.totalUsers||0} active</p>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">30-day retention</span>
                <span className="font-black text-indigo-700">{ov.retentionRate30||0}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                  style={{ width: `${ov.retentionRate30||0}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="font-black text-blue-700 text-lg">{ov.totalLabour||0}</p>
                <p className="text-[10px] text-gray-400">Workers</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <p className="font-black text-orange-700 text-lg">{ov.totalClients||0}</p>
                <p className="text-[10px] text-gray-400">Clients</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
          <p className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Dispute Overview
          </p>
          <div className="space-y-3">
            <DonutChart segments={[
              { value: ov.resolvedDisputes || 0, color: '#22c55e', label: 'Resolved' },
              { value: (ov.totalDisputes||0) - (ov.resolvedDisputes||0), color: '#f97316', label: 'Open' },
            ]} size={90} />
            <div className="space-y-2">
              <HBar label="Resolved" value={ov.resolvedDisputes||0} max={ov.totalDisputes||1} color="#22c55e" />
              <HBar label="Open" value={(ov.totalDisputes||0)-(ov.resolvedDisputes||0)} max={ov.totalDisputes||1} color="#f97316" />
            </div>
            <p className="text-xs text-center text-gray-400">{ov.totalDisputes||0} total disputes</p>
          </div>
        </div>
      </div>

      {/* ── Trend charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="User Registrations" subtitle={`Last ${period} days`} icon={Users} iconColor="text-blue-600" iconBg="bg-blue-100">
          {dailyMap.length > 0 ? (
            <>
              <MultiBarChart data={dailyMap} keys={['labour','client']} colors={['#f97316','#3b82f6']} height={140} />
              <div className="flex items-center gap-4 mt-2 justify-center">
                <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" />Labour</span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" />Client</span>
              </div>
            </>
          ) : <div className="text-center py-8 text-gray-400 text-sm">No registration data</div>}
        </Card>

        <Card title="Job Posting Trend" subtitle={`Last ${period} days`} icon={Briefcase} iconColor="text-orange-600" iconBg="bg-orange-100">
          <LineChart data={dailyMap} color="#f97316" fillColor="#fff7ed" height={140} valueFn={d => d.jobs || 0} />
        </Card>

        <Card title="Application Volume" subtitle="Applications received per day" icon={Target} iconColor="text-green-600" iconBg="bg-green-100">
          <LineChart data={dailyMap} color="#22c55e" fillColor="#f0fdf4" height={140} valueFn={d => d.apps || 0} />
        </Card>

        <Card title="Revenue Potential" subtitle="Agreed wages from completed jobs (₹)" icon={IndianRupee} iconColor="text-emerald-600" iconBg="bg-emerald-100">
          <LineChart data={dailyMap} color="#10b981" fillColor="#ecfdf5" height={140} valueFn={d => Math.round((d.revenue || 0) / 1000)} />
          <p className="text-[10px] text-gray-400 text-right mt-1">Values in ₹000s · Total: ₹{((ov.totalRevenue||0)/100000).toFixed(2)}L</p>
        </Card>
      </div>

      {/* ── Funnels ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Application Funnel" subtitle="Conversion through hiring" icon={TrendingUp} iconColor="text-indigo-600" iconBg="bg-indigo-100">
          <FunnelChart steps={[
            { label: 'Applications', value: fn.applicationFunnel?.applied || 0,      color: '#6366f1' },
            { label: 'Shortlisted',  value: fn.applicationFunnel?.shortlisted || 0,  color: '#8b5cf6' },
            { label: 'Hired',        value: fn.applicationFunnel?.accepted || 0,     color: '#22c55e' },
          ]} />
        </Card>

        <Card title="Job Status Funnel" subtitle="Job lifecycle distribution" icon={Briefcase} iconColor="text-orange-600" iconBg="bg-orange-100">
          <FunnelChart steps={[
            { label: 'Open',        value: fn.jobStatus?.open || 0,        color: '#3b82f6' },
            { label: 'In Progress', value: fn.jobStatus?.inProgress || 0,  color: '#f97316' },
            { label: 'Completed',   value: fn.jobStatus?.completed || 0,   color: '#22c55e' },
            { label: 'Cancelled',   value: fn.jobStatus?.cancelled || 0,   color: '#ef4444' },
          ]} />
        </Card>

        <Card title="Verification Funnel" subtitle="Labour Aadhaar verification" icon={Shield} iconColor="text-purple-600" iconBg="bg-purple-100">
          <FunnelChart steps={[
            { label: 'Total Labour',    value: ov.totalLabour || 0,                          color: '#6366f1' },
            { label: 'Submitted',       value: (fn.verification?.pending || 0) + (fn.verification?.approved || 0) + (fn.verification?.rejected || 0), color: '#8b5cf6' },
            { label: 'Pending Review',  value: fn.verification?.pending   || 0,              color: '#f59e0b' },
            { label: 'Verified',        value: fn.verification?.approved  || 0,              color: '#22c55e' },
          ]} />
        </Card>
      </div>

      {/* ── Category + Skills + Patterns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Job Category Breakdown" subtitle={`Last ${period} days`} icon={BarChart2} iconColor="text-purple-600" iconBg="bg-purple-100">
          {(ch.categoryBreakdown || []).length > 0 ? (
            <div className="space-y-2.5">
              {(ch.categoryBreakdown || []).slice(0,8).map((c, i) => (
                <HBar key={c._id} label={c._id?.charAt(0).toUpperCase() + c._id?.slice(1)}
                  value={c.total} max={ch.categoryBreakdown[0]?.total || 1}
                  color={['#f97316','#3b82f6','#22c55e','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899'][i % 8]}
                  suffix=" jobs"
                />
              ))}
            </div>
          ) : <div className="text-center py-6 text-gray-400 text-sm">No category data</div>}
        </Card>

        <Card title="Skill Demand" subtitle="Most requested skills" icon={Award} iconColor="text-amber-600" iconBg="bg-amber-100">
          {(ch.skillDemand || []).length > 0 ? (
            <div className="space-y-2.5">
              {(ch.skillDemand || []).slice(0,8).map((s, i) => (
                <HBar key={s._id} label={s._id}
                  value={s.count} max={ch.skillDemand[0]?.count || 1}
                  color={['#f97316','#22c55e','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899'][i % 8]}
                  suffix=" jobs"
                />
              ))}
            </div>
          ) : <div className="text-center py-6 text-gray-400 text-sm">No skill data</div>}
        </Card>
      </div>

      {/* ── Activity patterns ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Day-of-Week Activity" subtitle="When jobs get posted (by day)" icon={Calendar} iconColor="text-teal-600" iconBg="bg-teal-100">
          {(ch.weeklyPattern || []).length > 0 ? (
            <div className="flex items-end gap-2 h-28">
              {(ch.weeklyPattern || []).map((d) => {
                const max = Math.max(...(ch.weeklyPattern||[]).map(x => x.count), 1);
                const h = Math.max((d.count / max) * 100, 4);
                const today = new Date().getDay() + 1;
                return (
                  <div key={d._id} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-gray-500">{d.count}</span>
                    <div className="w-full rounded-t-xl transition-all duration-700"
                      style={{ height: `${h}%`, backgroundColor: d._id === today ? '#f97316' : '#e0e7ff' }} title={`${DOW[d._id]}: ${d.count} jobs`} />
                    <span className="text-[9px] text-gray-500">{DOW[d._id] || ''}</span>
                  </div>
                );
              })}
            </div>
          ) : <div className="text-center py-6 text-gray-400 text-sm">No pattern data</div>}
        </Card>

        <Card title="Hourly Activity" subtitle="UTC hour when jobs are posted" icon={Clock} iconColor="text-blue-600" iconBg="bg-blue-100">
          {(ch.hourlyPattern || []).length > 0 ? (
            <div className="flex items-end gap-0.5 h-28">
              {Array.from({ length: 24 }, (_, hr) => {
                const found = (ch.hourlyPattern||[]).find(h => h._id === hr);
                const count = found?.count || 0;
                const max = Math.max(...(ch.hourlyPattern||[]).map(h => h.count), 1);
                const h = Math.max((count / max) * 100, 2);
                const isNow = new Date().getUTCHours() === hr;
                return (
                  <div key={hr} className="flex-1 flex flex-col items-center">
                    <div className="w-full rounded-t-sm"
                      style={{ height: `${h}%`, backgroundColor: isNow ? '#f97316' : count > 0 ? '#bfdbfe' : '#f9fafb' }}
                      title={`${hr}:00 UTC — ${count} jobs`} />
                    {hr % 6 === 0 && <span className="text-[8px] text-gray-400 mt-0.5">{hr}h</span>}
                  </div>
                );
              })}
            </div>
          ) : <div className="text-center py-6 text-gray-400 text-sm">No pattern data</div>}
        </Card>
      </div>

      {/* ── Geographic ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Top Cities by Activity" subtitle="Job postings per city" icon={MapPin} iconColor="text-rose-600" iconBg="bg-rose-100">
          {(ch.cityActivity || []).length > 0 ? (
            <div className="space-y-2.5">
              {(ch.cityActivity || []).slice(0,8).map((c, i) => (
                <div key={c._id} className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                    i === 0 ? 'bg-orange-100 text-orange-700' : i === 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>#{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-gray-800 truncate">{c._id}</span>
                      <span className="text-xs font-black text-gray-700 ml-2">{c.jobs}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-rose-400"
                        style={{ width: `${(c.jobs / ((ch.cityActivity||[])[0]?.jobs || 1)) * 100}%` }} />
                    </div>
                  </div>
                  {c.state && <span className="text-[10px] text-gray-400 flex-shrink-0">{c.state?.slice(0,3)}</span>}
                </div>
              ))}
            </div>
          ) : <div className="text-center py-6 text-gray-400 text-sm">No geographic data</div>}
        </Card>

        <Card title="State Distribution" subtitle="Jobs by state" icon={MapPin} iconColor="text-indigo-600" iconBg="bg-indigo-100">
          {(ch.stateActivity || []).length > 0 ? (
            <div className="space-y-2.5">
              {(ch.stateActivity || []).slice(0,8).map((s, i) => (
                <HBar key={s._id} label={s._id || 'Unknown'}
                  value={s.jobs}
                  max={(ch.stateActivity||[])[0]?.jobs || 1}
                  color={['#6366f1','#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'][i % 8]}
                  suffix=" jobs"
                />
              ))}
            </div>
          ) : <div className="text-center py-6 text-gray-400 text-sm">No state data</div>}
        </Card>
      </div>

      {/* ── Category deep dive ── */}
      {(ch.categoryBreakdown || []).length > 0 && (
        <Card title="Category Performance Deep Dive" subtitle="Completion rate and average budget per category" icon={BarChart2} iconColor="text-blue-600" iconBg="bg-blue-100">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 font-bold text-gray-500">Category</th>
                  <th className="text-right py-2 px-3 font-bold text-gray-500">Total Jobs</th>
                  <th className="text-right py-2 px-3 font-bold text-gray-500">Open</th>
                  <th className="text-right py-2 px-3 font-bold text-gray-500">Completed</th>
                  <th className="text-right py-2 px-3 font-bold text-gray-500">Completion %</th>
                  <th className="text-right py-2 px-3 font-bold text-gray-500">Avg Budget</th>
                </tr>
              </thead>
              <tbody>
                {(ch.categoryBreakdown || []).map((c, i) => {
                  const compRate = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0;
                  return (
                    <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-gray-800 capitalize">{c._id}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-700">{c.total}</td>
                      <td className="py-2.5 px-3 text-right text-blue-600 font-semibold">{c.open}</td>
                      <td className="py-2.5 px-3 text-right text-green-600 font-semibold">{c.completed}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`font-black ${compRate >= 70 ? 'text-green-600' : compRate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                          {compRate}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-orange-600 font-semibold">
                        ₹{Math.round(c.avgBudget || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Key Insights ── */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-lg">Key Insights</h3>
          <span className="text-xs text-slate-400 ml-auto">Auto-generated · {period}-day window</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            ov.successRate > 50
              ? { icon: '✅', text: `Strong hiring — ${ov.successRate}% of applicants get hired`, color: 'bg-green-900/30 border-green-700/30' }
              : { icon: '⚠️', text: `Low hiring rate — only ${ov.successRate}% of applicants get hired`, color: 'bg-amber-900/30 border-amber-700/30' },
            ov.completionRate > 70
              ? { icon: '🚀', text: `High job completion — ${ov.completionRate}% of jobs are completed`, color: 'bg-green-900/30 border-green-700/30' }
              : { icon: '📉', text: `Low completion — ${ov.completionRate}% completion rate needs attention`, color: 'bg-red-900/30 border-red-700/30' },
            { icon: '💰', text: `₹${((ov.totalRevenue||0)/100000).toFixed(1)}L in agreed wages — platform creating real economic value`, color: 'bg-blue-900/30 border-blue-700/30' },
            { icon: '🏙️', text: `Top city: ${(ch.cityActivity||[])[0]?._id || 'N/A'} with ${(ch.cityActivity||[])[0]?.jobs || 0} active jobs`, color: 'bg-indigo-900/30 border-indigo-700/30' },
            ov.verifiedRate < 50
              ? { icon: '🔐', text: `Only ${ov.verifiedRate}% workers verified — push verification adoption`, color: 'bg-amber-900/30 border-amber-700/30' }
              : { icon: '🛡️', text: `${ov.verifiedRate}% of workers are Aadhaar verified`, color: 'bg-green-900/30 border-green-700/30' },
            { icon: '📊', text: `Top skill in demand: ${(ch.skillDemand||[])[0]?._id || 'N/A'} (${(ch.skillDemand||[])[0]?.count || 0} jobs)`, color: 'bg-purple-900/30 border-purple-700/30' },
          ].filter(Boolean).map((ins, i) => (
            <div key={i} className={`flex items-start gap-2.5 p-3 rounded-2xl border ${ins.color}`}>
              <span className="text-lg flex-shrink-0">{ins.icon}</span>
              <p className="text-xs text-slate-200 leading-relaxed">{ins.text}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}