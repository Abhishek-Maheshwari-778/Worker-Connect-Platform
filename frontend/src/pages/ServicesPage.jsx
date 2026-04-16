import { useEffect } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, HardHat, Building2, Bot, ShieldCheck, Star, BarChart3, Zap, Users, MessageCircle, BookOpen } from 'lucide-react';

const STYLES = `
.reveal { opacity:0; transform:translateY(30px); transition:opacity .7s ease, transform .7s ease }
.reveal.visible { opacity:1; transform:translateY(0) }
.reveal-left { opacity:0; transform:translateX(-40px); transition:opacity .7s ease, transform .7s ease }
.reveal-left.visible { opacity:1; transform:translateX(0) }
.reveal-right { opacity:0; transform:translateX(40px); transition:opacity .7s ease, transform .7s ease }
.reveal-right.visible { opacity:1; transform:translateX(0) }
.card-hover-lift { transition:transform .3s ease, box-shadow .3s ease }
.card-hover-lift:hover { transform:translateY(-6px); box-shadow:0 20px 40px rgba(0,0,0,.1) }
`;

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal,.reveal-left,.reveal-right');
    const io  = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const WORKER_SERVICES = [
  { icon: HardHat,       title: 'Free Worker Profile',       desc: 'Create a verified digital identity with skills, portfolio, and ratings completely free.' },
  { icon: Bot,           title: 'AI Job Matching',           desc: 'Get matched to relevant jobs based on your skills, location, and wage expectations automatically.' },
  { icon: ShieldCheck,   title: 'Aadhaar Verification',      desc: 'Get the Verified badge that makes clients trust you instantly — boosting your hire rate.' },
  { icon: Star,          title: 'Reputation Building',       desc: 'Collect ratings, badges (Top Rated, Fast Responder, Experienced) that follow you permanently.' },
  { icon: MessageCircle, title: 'Direct Client Chat',        desc: 'Communicate in real-time with clients before, during and after job completion.' },
  { icon: BookOpen,      title: 'Government Schemes Access', desc: 'Discover welfare programs, insurance schemes, and subsidies you are eligible for.' },
];

const CLIENT_SERVICES = [
  { icon: Zap,         title: 'Instant Job Posting',        desc: 'Post a job in under 2 minutes. Set budget, location, skills needed, and start receiving applications.' },
  { icon: Bot,         title: 'AI Candidate Screening',     desc: 'Our AI calls and screens candidates overnight, delivering a qualified shortlist by morning.' },
  { icon: Users,       title: 'Group / Team Hiring',        desc: 'Hire entire teams for large projects. Post group jobs needing multiple skill types simultaneously.' },
  { icon: ShieldCheck, title: 'Verified Worker Database',   desc: 'Access only Aadhaar-verified, rated workers. No fake profiles. No unverified applicants.' },
  { icon: BarChart3,   title: 'Application Management',     desc: 'Manage all applicants in one dashboard — shortlist, chat, accept, reject with full tracking.' },
  { icon: Star,        title: 'Post-Job Rating',            desc: 'Rate workers after completion. Build community trust that benefits every future hire.' },
];

const PLANS = [
  {
    name: 'Worker — Free',
    price: '₹0',
    period: 'forever',
    color: 'border-gray-200',
    badge: '',
    features: ['Free profile creation','AI job recommendations','Up to 10 applications/month','Basic chat','Govt. scheme discovery'],
    cta: 'Create Worker Profile',
    ctaColor: 'bg-gray-900 text-white hover:bg-gray-800',
  },
  {
    name: 'Client — Starter',
    price: '₹0',
    period: 'during launch',
    color: 'border-orange-500 shadow-2xl',
    badge: 'Most Popular',
    features: ['Unlimited job postings','AI screening agent (5 jobs/mo)','Browse verified workers','Real-time chat','Basic analytics'],
    cta: 'Start Hiring Free',
    ctaColor: 'bg-orange-500 text-white hover:bg-orange-600',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    color: 'border-blue-200',
    badge: 'For Large Teams',
    features: ['Unlimited AI screening','Priority verified candidates','Dedicated account manager','API access','Custom integrations'],
    cta: 'Talk to Sales',
    ctaColor: 'bg-blue-600 text-white hover:bg-blue-700',
  },
];

export default function ServicesPage() {
  useReveal();

  return (
    <PublicLayout>
      <style>{STYLES}</style>

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-950 py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(circle at 50% 50%,rgba(99,102,241,.15) 0%,transparent 60%)'}} />
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">Our Services</span>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-white mb-6">
            Everything your team needs<br/><span className="text-indigo-400">to hire or find work</span>
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">Complete set of tools for both workers and clients — from AI-powered matching to real-time communication.</p>
        </div>
      </section>

      {/* Worker Services */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 reveal">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4">For Workers</span>
            <h2 className="font-display text-4xl font-bold text-gray-900">Tools designed for daily wage workers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WORKER_SERVICES.map((s, i) => (
              <div key={s.title} className="reveal card-hover-lift bg-blue-50 rounded-3xl p-7 border border-blue-100" style={{transitionDelay:`${i*.08}s`}}>
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mb-5 shadow-md">
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Client Services */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 reveal">
            <span className="inline-block px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-widest mb-4">For Clients</span>
            <h2 className="font-display text-4xl font-bold text-gray-900">Hire with confidence and speed</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CLIENT_SERVICES.map((s, i) => (
              <div key={s.title} className="reveal card-hover-lift bg-white rounded-3xl p-7 border border-gray-100" style={{transitionDelay:`${i*.08}s`}}>
                <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center mb-5 shadow-md">
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 reveal">
            <span className="inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-600 text-xs font-bold uppercase tracking-widest mb-4">Pricing</span>
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-500">Start free. Scale when you need to.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PLANS.map((plan, i) => (
              <div key={plan.name} className={`reveal card-hover-lift rounded-3xl p-8 border-2 ${plan.color} bg-white relative`} style={{transitionDelay:`${i*.1}s`}}>
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-orange-500 text-white text-xs font-bold whitespace-nowrap">{plan.badge}</div>
                )}
                <h3 className="font-display font-bold text-gray-900 text-xl mb-2">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-1">
                  <span className="font-display text-4xl font-bold text-gray-900">{plan.price}</span>
                </div>
                <p className="text-gray-400 text-xs mb-7">{plan.period}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors ${plan.ctaColor}`}>
                  {plan.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}