import { useEffect, useState } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, User, Tag, Search } from 'lucide-react';

const STYLES = `
.reveal { opacity:0; transform:translateY(30px); transition:opacity .7s ease, transform .7s ease }
.reveal.visible { opacity:1; transform:translateY(0) }
.card-hover-lift { transition:transform .3s ease, box-shadow .3s ease }
.card-hover-lift:hover { transform:translateY(-6px); box-shadow:0 20px 40px rgba(0,0,0,.1) }
`;

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io  = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const POSTS = [
  { id:1, category:'Hiring Tips',  color:'bg-orange-100 text-orange-600',  title:'How to hire a reliable electrician in India: A complete guide for 2024', excerpt:'Finding trustworthy electrical workers is one of the biggest pain points for homeowners and small businesses. Here is what you need to verify before hiring.', author:'Arjun Mehta',    date:'Dec 15, 2024', read:'5 min read',  img:'from-orange-500 to-red-500' },
  { id:2, category:'Worker Guide', color:'bg-blue-100 text-blue-600',      title:'How to build a standout profile on Labour Connect and get hired faster', excerpt:'A complete guide for daily wage workers on creating a profile that gets noticed — covering everything from photos to skills and wage negotiation.', author:'Priya Sharma',   date:'Dec 12, 2024', read:'8 min read',  img:'from-blue-500 to-indigo-600' },
  { id:3, category:'Policy',       color:'bg-green-100 text-green-600',    title:'Government schemes every daily wage worker in India should know about in 2024', excerpt:'From PM Shram Yogi Maandhan to ESIC — a comprehensive breakdown of all the welfare schemes available to India\'s unorganised workforce.', author:'Ravi Kumar',      date:'Dec 10, 2024', read:'12 min read', img:'from-green-500 to-teal-500' },
  { id:4, category:'Technology',   color:'bg-purple-100 text-purple-600',  title:'How AI is transforming daily wage hiring in India — and what it means for workers', excerpt:'Artificial intelligence is automating candidate screening, reducing hire time from days to hours. We explore what this means for workers and employers.', author:'Anita Patel',    date:'Dec 8, 2024',  read:'6 min read',  img:'from-purple-500 to-pink-500' },
  { id:5, category:'Case Study',   color:'bg-amber-100 text-amber-600',    title:'How a Delhi construction firm hired 50 workers in one week using Labour Connect', excerpt:'A real-world case study on how a mid-sized construction company transformed their hiring process using AI screening and verified worker profiles.', author:'Arjun Mehta',    date:'Dec 5, 2024',  read:'7 min read',  img:'from-amber-500 to-orange-500' },
  { id:6, category:'Worker Guide', color:'bg-blue-100 text-blue-600',      title:'Aadhaar verification on Labour Connect: Why it matters and how to do it', excerpt:'Step-by-step guide on verifying your Aadhaar on Labour Connect and why the Verified badge dramatically increases your chances of being hired.', author:'Priya Sharma',   date:'Dec 2, 2024',  read:'4 min read',  img:'from-blue-600 to-cyan-500' },
];

const CATEGORIES = ['All','Hiring Tips','Worker Guide','Policy','Technology','Case Study'];

export default function BlogPage() {
  useReveal();
  const [search, setSearch] = useState('');
  const [cat,    setCat]    = useState('All');

  const filtered = POSTS.filter(p =>
    (cat === 'All' || p.category === cat) &&
    (p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <PublicLayout>
      <style>{STYLES}</style>

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-blue-950 py-20 relative overflow-hidden">
        <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(circle at 70% 30%,rgba(249,115,22,.12) 0%,transparent 50%)'}} />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-widest mb-6">Blog & Resources</span>
          <h1 className="font-display text-5xl font-bold text-white mb-4">Insights for Workers and Clients</h1>
          <p className="text-blue-200 text-lg mb-8">Hiring guides, worker tips, policy updates, and stories from India's daily wage community.</p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Search articles..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Filter tabs + Posts */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-10 reveal">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${cat === c ? 'bg-orange-500 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'}`}>
                {c}
              </button>
            ))}
            <span className="ml-auto text-sm text-gray-400 self-center">{filtered.length} article{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Featured post */}
          {filtered.length > 0 && (
            <div className="reveal mb-8 card-hover-lift bg-white rounded-3xl overflow-hidden border border-gray-100 cursor-pointer">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className={`h-64 md:h-auto bg-gradient-to-br ${filtered[0].img} flex items-center justify-center`}>
                  <div className="text-white/20 font-display font-bold text-6xl">LC</div>
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 w-fit ${filtered[0].color}`}>{filtered[0].category}</span>
                  <h2 className="font-display text-2xl font-bold text-gray-900 mb-3 leading-snug">{filtered[0].title}</h2>
                  <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-3">{filtered[0].excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{filtered[0].author}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{filtered[0].read}</span>
                    <span>{filtered[0].date}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.slice(1).map((post, i) => (
              <div key={post.id} className="reveal card-hover-lift bg-white rounded-3xl overflow-hidden border border-gray-100 cursor-pointer" style={{transitionDelay:`${i*.07}s`}}>
                <div className={`h-44 bg-gradient-to-br ${post.img} flex items-center justify-center`}>
                  <div className="text-white/20 font-display font-bold text-5xl">LC</div>
                </div>
                <div className="p-6">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${post.color}`}>{post.category}</span>
                  <h3 className="font-display font-bold text-gray-900 text-base leading-snug mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read}</span>
                    <span>{post.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-medium">No articles found</p>
              <p className="text-sm mt-1">Try a different search or category</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-indigo-900 text-white text-center">
        <div className="max-w-2xl mx-auto px-4 reveal">
          <h2 className="font-display text-3xl font-bold mb-3">Stay updated with the latest from Labour Connect</h2>
          <p className="text-blue-200 mb-8 text-sm">Get hiring tips, worker guides, and policy updates delivered to your inbox every week.</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" placeholder="Enter your email"
              className="flex-1 px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <button className="px-6 py-3.5 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition-colors flex items-center gap-2 justify-center">
              Subscribe <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}