import { useEffect } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import { Link } from 'react-router-dom';
import { ArrowRight, HardHat, Target, Heart, Users, Lightbulb, Globe, CheckCircle, ShieldCheck } from 'lucide-react';

const STYLES = `
@keyframes fadeUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
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

const TEAM = [
  { name: 'Arjun Mehta',     role: 'CEO & Co-Founder',        init: 'A', color: 'from-orange-500 to-red-500' },
  { name: 'Priya Sharma',    role: 'CTO & Co-Founder',        init: 'P', color: 'from-blue-500 to-indigo-600' },
  { name: 'Ravi Kumar',      role: 'Head of Product',         init: 'R', color: 'from-green-500 to-teal-500' },
  { name: 'Anita Patel',     role: 'Head of Operations',      init: 'A', color: 'from-purple-500 to-pink-500' },
];

const VALUES = [
  { icon: Heart,       title: 'Worker First',     desc: 'Every feature is designed keeping the daily wage worker in mind — their dignity, safety and livelihood.' },
  { icon: ShieldCheck, title: 'Trust & Safety',   desc: 'Aadhaar verification, dual ratings and admin oversight ensure every interaction is safe and fair.' },
  { icon: Lightbulb,   title: 'Innovation',       desc: 'We use AI and machine learning to solve real problems — not for novelty, but for genuine impact.' },
  { icon: Globe,       title: 'India at Heart',   desc: 'Built specifically for the Indian context — multiple languages, mobile-first, offline-resilient.' },
];

export default function AboutPage() {
  useReveal();

  return (
    <PublicLayout>
      <style>{STYLES}</style>


      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(circle at 50% 50%,rgba(249,115,22,.1) 0%,transparent 60%)'}} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-widest mb-6">Our Story</span>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight" style={{animation:'fadeUp .8s ease both'}}>
            We are building the<br/><span className="text-orange-500">missing infrastructure</span><br/>for India's workforce
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed max-w-2xl mx-auto" style={{animation:'fadeUp .8s ease .2s both'}}>
            Labour Connect was born from a simple observation: millions of skilled daily wage workers struggle to find consistent work, while thousands of clients struggle to find reliable workers. We are fixing that.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="reveal-left">
              <span className="inline-block px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-widest mb-6">Our Mission</span>
              <h2 className="font-display text-4xl font-bold text-gray-900 mb-6">
                Dignified work for every skilled hand in India
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                India has over 400 million daily wage workers who contribute enormously to the economy but lack the tools and platforms that white-collar workers take for granted.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                LabourConnect ["ShramSetu Bharat"] gives these workers a professional digital identity — a verified profile, a ratings history, a portfolio, and access to jobs that match their skills and location. For clients, we make hiring trustworthy, fast, and completely transparent.
              </p>
              <div className="space-y-3">
                {['Built for Bharat — designed for India\'s unique labour market','Mobile-first for low-bandwidth environments','Available in multiple regional languages (coming soon)','Zero commission model for workers on basic tier'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="reveal-right grid grid-cols-2 gap-5">
              {[
                { val: '2024', label: 'Founded', sub: 'With a vision for change' },
                { val: '15+',  label: 'States',  sub: 'And growing every month' },
                { val: '400M', label: 'Workers', sub: 'We are here for them all' },
                { val: '100%', label: 'Committed',sub: 'To worker dignity & safety' },
              ].map(item => (
                <div key={item.label} className="card-hover-lift bg-orange-50 rounded-3xl p-6 border border-orange-100">
                  <div className="font-display text-3xl font-bold text-orange-600 mb-2">{item.val}</div>
                  <div className="font-semibold text-gray-800 text-sm">{item.label}</div>
                  <div className="text-gray-500 text-xs mt-1">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 reveal">
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-gray-500 max-w-xl mx-auto">The principles that guide every decision we make at Labour Connect.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <div key={v.title} className="reveal card-hover-lift bg-white rounded-3xl p-7 border border-gray-100 text-center" style={{transitionDelay:`${i*.08}s`}}>
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
                  <v.icon className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 reveal">
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">The Team Behind It</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Passionate builders with deep roots in India's labour and technology sectors.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TEAM.map((m, i) => (
              <div key={m.name} className="reveal card-hover-lift text-center" style={{transitionDelay:`${i*.08}s`}}>
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${m.color} flex items-center justify-center mx-auto mb-4 text-white font-display font-bold text-2xl shadow-lg`}>
                  {m.init}
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{m.name}</h3>
                <p className="text-gray-500 text-xs mt-1">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Submission Section */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Submitted By */}
            <div className="reveal-left bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="font-display text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                  <Users className="w-5 h-5" />
                </span>
                Submitted By
              </h2>
              <div className="space-y-4">
                {[
                  { name: 'Abhishek Maheshwari', id: '2310201023' },
                  { name: 'Mansi Rawat',        id: '2310201302' },
                  { name: 'Abhishek Verma',     id: '2310201028' },
                  { name: 'Akshat Rastogi',     id: '2310201050' },
                ].map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-orange-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-100">
                        {i+1}
                      </div>
                      <span className="font-semibold text-slate-800">{s.name}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-100">
                      ID: {s.id}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guidance */}
            <div className="reveal-right bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="font-display text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Target className="w-5 h-5" />
                </span>
                Under the Guidance of
              </h2>
              <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Target className="w-24 h-24 text-blue-600" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-slate-900">Mr. Akash Sanghi</h3>
                  <p className="text-blue-700 font-medium mt-1">Head of Department, FOCA</p>
                  <div className="mt-6 pt-6 border-t border-blue-200/50 space-y-1">
                    <p className="text-sm text-slate-600">Faculty of Computer Applications</p>
                    <p className="text-sm font-bold text-slate-800">Invertis University, Bareilly</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <Globe className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Academic Year</p>
                  <p className="text-sm font-bold text-slate-800">2023 - 2024</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-red-500 text-white text-center">
        <div className="max-w-2xl mx-auto px-4 reveal">
          <h2 className="font-display text-4xl font-bold mb-4">Join us in building a better future for India's workers</h2>
          <p className="text-orange-100 mb-8">Together we can give every skilled hand the dignity and opportunity it deserves.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-orange-600 font-bold hover:bg-orange-50 transition-colors shadow-xl">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}