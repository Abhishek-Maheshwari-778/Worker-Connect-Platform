/**
 * LabourBot — Role-scoped AI chatbot
 *
 * Key improvements over previous version:
 * 1. User-scoped history  — keyed by userId in sessionStorage, clears on different user
 * 2. Speech-to-text       — Web Speech API, supports Hindi, English, and other languages
 * 3. History panel        — view and resume previous conversations
 * 4. No global rendering  — only mounts inside role layouts (not on landing/login)
 * 5. Auto-reset on login  — listens to AuthContext user change
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X, Send, Bot, User, Sparkles, RotateCcw,
  Minimize2, Maximize2, Mic, MicOff, Clock,
  ChevronLeft, BookOpen, HelpCircle, MapPin,
  Briefcase, ShieldCheck, Star, HardHat, Phone,
  ExternalLink, IndianRupee, GraduationCap,
  Heart, Home, FileText, History, Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api         from '@/services/api';

/* ── Storage helpers (sessionStorage, user-scoped) ────────────────────────── */
const STORAGE_KEY = (uid) => `lc_bot_${uid || 'guest'}`;

const loadHistory = (uid) => {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY(uid)) || '[]'); }
  catch { return []; }
};
const saveHistory = (uid, sessions) => {
  try { sessionStorage.setItem(STORAGE_KEY(uid), JSON.stringify(sessions.slice(-10))); }
  catch {}
};

/* ── Suggested questions ─────────────────────────────────────────────────── */
const SUGGESTED = {
  labour: [
    { icon: MapPin,      text: 'How do I find jobs near me?'         },
    { icon: ShieldCheck, text: 'How do I verify my Aadhaar?'         },
    { icon: Briefcase,   text: 'How do I track my applications?'     },
    { icon: Star,        text: 'How do I improve my profile rating?' },
    { icon: Sparkles,    text: 'What badges can I earn?'             },
    { icon: HelpCircle,  text: 'How does AI job matching work?'      },
  ],
  client: [
    { icon: Briefcase,   text: 'How do I post a job?'                    },
    { icon: HardHat,     text: 'How do I find verified workers?'         },
    { icon: Sparkles,    text: 'How does AI candidate screening work?'   },
    { icon: Star,        text: 'How do I rate a worker after the job?'   },
    { icon: ShieldCheck, text: 'What is group/team hiring?'              },
    { icon: HelpCircle,  text: 'What is the cost of using the platform?' },
  ],
  admin: [
    { icon: ShieldCheck, text: 'How do I verify Aadhaar documents?'       },
    { icon: HardHat,     text: 'How do I suspend a fake account?'         },
    { icon: Briefcase,   text: 'How do I monitor all jobs?'               },
    { icon: Star,        text: 'How do I view platform analytics?'        },
    { icon: Sparkles,    text: 'What admin actions are available?'        },
    { icon: HelpCircle,  text: 'How does the verification workflow work?' },
  ],
};

const SCHEME_SUGGESTED = {
  en: [
    { icon: ShieldCheck,   text: 'Which scheme gives free ₹2 lakh accident insurance?' },
    { icon: IndianRupee,   text: 'How do I get ₹3,000/month pension after 60?'         },
    { icon: GraduationCap, text: 'How to get free skill training certificate?'          },
    { icon: Heart,         text: 'How to apply for Ayushman Bharat health card?'        },
    { icon: Home,          text: 'Which scheme helps me build a pucca house?'           },
    { icon: FileText,      text: 'What documents do I need for e-SHRAM card?'           },
  ],
  hi: [
    { icon: ShieldCheck,   text: 'मुझे ₹2 लाख का मुफ्त दुर्घटना बीमा कैसे मिलेगा?' },
    { icon: IndianRupee,   text: '60 के बाद ₹3,000/माह पेंशन के लिए क्या करें?'      },
    { icon: GraduationCap, text: 'PMKVY में मुफ्त प्रशिक्षण कैसे मिलेगा?'            },
    { icon: Heart,         text: 'आयुष्मान भारत कार्ड कैसे बनवाएं?'                  },
    { icon: Home,          text: 'PM आवास योजना के लिए कैसे आवेदन करें?'             },
    { icon: FileText,      text: 'ई-श्रम कार्ड बनाने के लिए क्या चाहिए?'            },
  ],
};

/* ── System prompts ───────────────────────────────────────────────────────── */
const SCHEME_SYSTEM = `You are SchemeBot, an expert government scheme assistant for Labour Connect — India's leading platform for daily wage workers. Help labourers find and apply for welfare schemes. Be simple, clear, practical. Give official website links and helpline numbers. If user writes in Hindi, reply in Hindi. Max 150 words unless asked for more.`;

const DEFAULT_SYSTEM = `You are LabourBot, the AI assistant for Labour Connect — India's platform connecting daily wage labourers with clients. Help labour workers, clients, and admins with platform features. Keep responses helpful, friendly, under 120 words.`;

/* ── Typing dots ──────────────────────────────────────────────────────────── */
const TypingDots = () => (
  <div className="flex items-center gap-1 px-1 py-0.5">
    {[0, 1, 2].map(i => (
      <span key={i} className="w-1.5 h-1.5 rounded-full bg-current opacity-60"
        style={{ animation: `lbDot 1.2s ${i * 0.2}s ease-in-out infinite` }} />
    ))}
  </div>
);

/* ── Message bubble ───────────────────────────────────────────────────────── */
const Bubble = ({ msg }) => {
  const isBot = msg.role === 'assistant';
  const lines = (msg.content || '').split('\n');

  const renderLine = (line, key) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const formatted = parts.map((p, j) =>
      j % 2 === 1 ? <strong key={j}>{p}</strong> : p
    );
    const isBullet = /^[•\-]/.test(line.trimStart());
    return <span key={key} className={`block leading-relaxed ${isBullet ? 'pl-2' : ''}`}>{formatted}</span>;
  };

  return (
    <div className={`flex items-end gap-2 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isBot ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-sm' : 'bg-blue-100'
      }`}>
        {isBot ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-blue-600" />}
      </div>
      <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm ${
        isBot
          ? 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
          : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm shadow-sm'
      }`}>
        {msg.typing ? <TypingDots /> : <div className="space-y-0.5">{lines.map(renderLine)}</div>}
        {!msg.typing && (
          <p className={`text-[10px] mt-1.5 ${isBot ? 'text-gray-400' : 'text-blue-200'}`}>
            {new Date(msg.ts || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
};

/* ── Speech language options ──────────────────────────────────────────────── */
const SPEECH_LANGS = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'हिंदी' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'bn-IN', label: 'Bengali' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'gu-IN', label: 'Gujarati' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'pa-IN', label: 'Punjabi' },
];

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function LabourBot({ context, lang: parentLang = 'en' }) {
  const { user } = useAuth();
  const role     = user?.role || 'labour';
  const userId   = user?._id;
  const isSchemes = context === 'schemes';

  /* ── Panel state ──────────────────────────────────────────────────────── */
  const [open,        setOpen]        = useState(false);
  const [minimized,   setMinimized]   = useState(false);
  const [view,        setView]        = useState('chat');  // 'chat' | 'history'
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [unread,      setUnread]      = useState(0);
  const [showSuggest, setShowSuggest] = useState(true);
  const [speechLang,  setSpeechLang]  = useState('en-IN');
  const [listening,   setListening]   = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  /* ── Session history (saved per user in sessionStorage) ────────────────── */
  const [sessions, setSessions] = useState(() => loadHistory(userId));

  const bottomRef    = useRef(null);
  const inputRef     = useRef(null);
  const historyRef   = useRef([]);  // Gemini context window
  const recognRef    = useRef(null); // SpeechRecognition instance
  const prevUserRef  = useRef(userId);

  /* ── Reset chat when user changes (different login) ──────────────────── */
  useEffect(() => {
    if (prevUserRef.current !== userId) {
      prevUserRef.current = userId;
      setMessages([]);
      historyRef.current = [];
      setShowSuggest(true);
      setUnread(0);
      setSessions(loadHistory(userId));
    }
  }, [userId]);

  /* ── Auto-scroll ──────────────────────────────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Focus on open ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 200);
      setUnread(0);
    }
  }, [open, minimized]);

  /* ── Save session to storage when messages change ─────────────────────── */
  useEffect(() => {
    if (!userId || messages.length < 2) return;
    const session = {
      id:       Date.now(),
      date:     new Date().toISOString(),
      preview:  messages.find(m => m.role === 'user')?.content?.slice(0, 60) || 'Chat',
      messages: messages.filter(m => !m.typing),
    };
    setSessions(prev => {
      const updated = [session, ...prev.filter(s => s.id !== session.id)].slice(0, 10);
      saveHistory(userId, updated);
      return updated;
    });
  }, [messages, userId]);

  /* ── Greeting ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!open || messages.length > 0) return;
    const name = user?.name?.split(' ')[0];
    let greeting;
    if (isSchemes) {
      greeting = parentLang === 'hi'
        ? `नमस्ते ${name || ''}! 🙏 मैं **SchemeBot** हूं। सरकारी योजनाओं के बारे में पूछें — e-SHRAM, PM-SYM, आयुष्मान भारत और बहुत कुछ!`
        : `Hi ${name || ''}! 👋 I'm **SchemeBot**. Ask me about **government welfare schemes** — pension, health cover, free training, housing, and more.`;
    } else {
      greeting = `Hi ${name || ''}! 👋 I'm **LabourBot**, your Labour Connect assistant.\n\nI can help with jobs, applications, profile, badges, and more. What would you like to know?`;
    }
    setMessages([{ role: 'assistant', content: greeting, ts: Date.now() }]);
  }, [open]);

  /* ── Speech-to-text ───────────────────────────────────────────────────── */
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition is not supported in this browser. Try Chrome or Edge.'); return; }

    if (listening) {
      recognRef.current?.stop();
      setListening(false);
      return;
    }

    const recog = new SR();
    recog.lang          = speechLang;
    recog.continuous    = false;
    recog.interimResults = true;
    recog.maxAlternatives = 1;

    recog.onstart  = () => setListening(true);
    recog.onend    = () => setListening(false);
    recog.onerror  = () => setListening(false);

    recog.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      setInput(transcript);
      // Auto-send if final result
      if (e.results[e.results.length - 1].isFinal) {
        setTimeout(() => {
          setInput('');
          sendMessage(transcript);
        }, 300);
      }
    };

    recognRef.current = recog;
    recog.start();
  }, [listening, speechLang]);

  /* ── Send message ─────────────────────────────────────────────────────── */
  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    setShowSuggest(false);
    recognRef.current?.stop();
    setListening(false);

    const userMsg   = { role: 'user',      content: msg, ts: Date.now() };
    const typingMsg = { role: 'assistant', content: '', typing: true, ts: Date.now() + 1 };

    setMessages(prev => [...prev, userMsg, typingMsg]);
    setLoading(true);

    try {
      const res = await api.post('/chatbot/message', {
        message:       msg,
        history:       historyRef.current.slice(-8),
        systemContext: isSchemes ? SCHEME_SYSTEM : DEFAULT_SYSTEM,
        context:       isSchemes ? 'schemes' : 'general',
      });

      const reply = res.data?.reply || res.data?.message || "Sorry, I couldn't process that. Please try again.";

      historyRef.current = [
        ...historyRef.current,
        { role: 'user',      content: msg   },
        { role: 'assistant', content: reply },
      ].slice(-20);

      setMessages(prev => [
        ...prev.filter(m => !m.typing),
        { role: 'assistant', content: reply, ts: Date.now() },
      ]);

      if (!open || minimized) setUnread(u => u + 1);
    } catch {
      const fallback = isSchemes
        ? "Can't connect. Call **14555** or visit **eshram.gov.in**."
        : "I'm having trouble connecting. Please try again.";
      setMessages(prev => [
        ...prev.filter(m => !m.typing),
        { role: 'assistant', content: fallback, ts: Date.now() },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, open, minimized, isSchemes]);

  /* ── Clear current chat ───────────────────────────────────────────────── */
  const clearChat = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
    setShowSuggest(true);
    setView('chat');
    setTimeout(() => setMessages([{
      role: 'assistant',
      content: 'Chat cleared! How can I help you? 👋',
      ts: Date.now(),
    }]), 80);
  }, []);

  /* ── Load a past session ──────────────────────────────────────────────── */
  const loadSession = (session) => {
    setMessages(session.messages);
    historyRef.current = session.messages
      .filter(m => m.role !== 'typing')
      .map(m => ({ role: m.role, content: m.content }))
      .slice(-16);
    setView('chat');
    setShowSuggest(false);
  };

  /* ── Delete a session ─────────────────────────────────────────────────── */
  const deleteSession = (id, e) => {
    e.stopPropagation();
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveHistory(userId, updated);
      return updated;
    });
  };

  const suggestions = isSchemes
    ? (SCHEME_SUGGESTED[parentLang] || SCHEME_SUGGESTED.en)
    : (SUGGESTED[role] || SUGGESTED.labour);

  const botName = isSchemes ? 'SchemeBot' : 'LabourBot';

  return (
    <>
      <style>{`
        @keyframes lbDot   { 0%,80%,100%{transform:scale(0);opacity:.3} 40%{transform:scale(1);opacity:1} }
        @keyframes lbPop   { 0%{transform:scale(.5) translateY(20px);opacity:0} 60%{transform:scale(1.05) translateY(-3px)} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes lbFab   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes lbSlide { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lbPulse { 0%{box-shadow:0 0 0 0 rgba(249,115,22,.5)} 70%{box-shadow:0 0 0 10px rgba(249,115,22,0)} 100%{box-shadow:0 0 0 0} }
        @keyframes lbMic   { 0%,100%{opacity:1} 50%{opacity:.4} }
        .lb-pop   { animation:lbPop .35s cubic-bezier(.34,1.56,.64,1) both }
        .lb-slide { animation:lbSlide .2s ease both }
        .lb-pulse { animation:lbPulse 2s infinite }
        .lb-fab   { animation:lbFab 3s ease-in-out infinite }
        .lb-mic   { animation:lbMic .8s ease-in-out infinite }
        .lb-scroll{ scrollbar-width:thin; scrollbar-color:rgba(0,0,0,.1) transparent }
        .lb-scroll::-webkit-scrollbar{ width:3px }
        .lb-scroll::-webkit-scrollbar-thumb{ background:rgba(0,0,0,.1); border-radius:4px }
      `}</style>

      {/* Backdrop */}
      {open && !minimized && (
        <div className="fixed inset-0 z-40" style={{ backdropFilter:'blur(3px)', background:'rgba(0,0,0,0.2)' }}
          onClick={() => setOpen(false)} />
      )}

      {/* ── Chat window ───────────────────────────────────────────────────── */}
      {open && (
        <div
          className={`fixed z-50 bg-white rounded-3xl overflow-hidden flex flex-col shadow-2xl transition-all duration-300 ${
            minimized ? 'bottom-24 right-5 w-72 h-14' : 'bottom-24 right-5 w-[375px] lb-pop'
          }`}
          style={{ maxHeight: minimized ? '56px' : 'min(600px, calc(100vh - 110px))' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 flex-shrink-0">
            {!minimized && view === 'history' && (
              <button onClick={() => setView('chat')} className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
            )}
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              {isSchemes ? <BookOpen className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm leading-none">{botName}</p>
              {!minimized && (
                <p className="text-orange-100 text-xs mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
                  {view === 'history' ? 'Chat History' : 'AI Assistant · Labour Connect'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!minimized && view === 'chat' && (
                <>
                  <button onClick={() => setView('history')} title="Chat history"
                    className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                    <History className="w-3.5 h-3.5 text-white" />
                  </button>
                  <button onClick={clearChat} title="Clear chat"
                    className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                    <RotateCcw className="w-3.5 h-3.5 text-white" />
                  </button>
                </>
              )}
              <button onClick={() => setMinimized(m => !m)}
                className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                {minimized ? <Maximize2 className="w-3.5 h-3.5 text-white" /> : <Minimize2 className="w-3.5 h-3.5 text-white" />}
              </button>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* ── HISTORY VIEW ── */}
              {view === 'history' ? (
                <div className="flex-1 overflow-y-auto lb-scroll bg-gray-50 p-4 space-y-2">
                  {sessions.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm font-semibold">No chat history yet</p>
                      <p className="text-gray-300 text-xs mt-1">Your conversations will appear here</p>
                    </div>
                  ) : (
                    sessions.map(session => (
                      <button key={session.id} onClick={() => loadSession(session)}
                        className="w-full text-left flex items-start gap-3 p-3.5 bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all group">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-700 truncate">{session.preview}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(session.date).toLocaleString('en-IN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                          </p>
                        </div>
                        <button onClick={e => deleteSession(session.id, e)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all">
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <>
                  {/* ── CHAT VIEW ── */}
                  <div className="flex-1 overflow-y-auto lb-scroll px-4 py-4 space-y-3.5 bg-gray-50">
                    {messages.map((msg, i) => (
                      <div key={i} className="lb-slide" style={{ animationDelay: `${Math.min(i*0.04, 0.2)}s` }}>
                        <Bubble msg={msg} />
                      </div>
                    ))}

                    {/* Suggested questions */}
                    {showSuggest && messages.length <= 1 && (
                      <div className="lb-slide space-y-1.5" style={{ animationDelay:'.15s' }}>
                        <p className="text-[11px] text-gray-400 font-semibold px-1">Quick questions:</p>
                        {suggestions.map(({ icon: Icon, text }, i) => (
                          <button key={i} onClick={() => sendMessage(text)}
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl bg-white border border-gray-100 text-left text-xs text-gray-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition-all shadow-sm group">
                            <div className="w-6 h-6 rounded-lg bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center flex-shrink-0 transition-colors">
                              <Icon className="w-3.5 h-3.5 text-orange-500" />
                            </div>
                            <span className="line-clamp-1">{text}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div ref={bottomRef} />
                  </div>

                  {/* Scheme helpline banner */}
                  {isSchemes && (
                    <div className="flex-shrink-0 px-4 py-2 bg-green-50 border-t border-green-100 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      <p className="text-xs text-green-700 font-medium">
                        Helpline: <span className="font-black">14555</span> · e-SHRAM: <span className="font-black">14434</span>
                      </p>
                    </div>
                  )}

                  {/* ── Input bar ── */}
                  <div className="flex-shrink-0 bg-white border-t border-gray-100 px-3 py-3">
                    {/* Speech language selector */}
                    {showLangPicker && (
                      <div className="mb-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-500 mb-1.5 px-1">Speech language:</p>
                        <div className="flex flex-wrap gap-1">
                          {SPEECH_LANGS.map(l => (
                            <button key={l.code} onClick={() => { setSpeechLang(l.code); setShowLangPicker(false); }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                speechLang === l.code
                                  ? 'bg-orange-500 text-white border-orange-500'
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                              }`}>
                              {l.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {/* Mic button */}
                      <button
                        onClick={() => {
                          if (!listening && !showLangPicker) startListening();
                          else if (!listening) setShowLangPicker(false);
                          else startListening(); // stop
                        }}
                        onContextMenu={e => { e.preventDefault(); setShowLangPicker(p => !p); }}
                        title={listening ? 'Stop listening' : 'Click: speak · Right-click: change language'}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                          listening
                            ? 'bg-red-500 text-white lb-mic shadow-md shadow-red-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-500'
                        }`}
                      >
                        {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>

                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder={listening ? `Listening (${SPEECH_LANGS.find(l=>l.code===speechLang)?.label})…` : (isSchemes ? 'Ask about any scheme…' : 'Type your question…')}
                        disabled={loading}
                        maxLength={500}
                        className={`flex-1 px-4 py-2.5 rounded-xl border text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all disabled:opacity-60 ${
                          listening ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
                        }`}
                      />

                      <button
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim()}
                        className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-md hover:from-orange-600 hover:to-orange-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {loading
                          ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <Send className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>

                    <p className="text-[10px] text-gray-400 text-center mt-1.5">
                      Labour Connect AI · <span className="text-orange-400">Right-click 🎤 to change language</span>
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── FAB ───────────────────────────────────────────────────────────── */}
      <button
        onClick={() => { setOpen(o => !o); setUnread(0); setView('chat'); }}
        className={`fixed bottom-5 right-5 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${open ? '' : 'lb-pulse lb-fab'}`}
        style={{ boxShadow:'0 8px 25px rgba(249,115,22,.45)' }}
      >
        {open ? <X className="w-6 h-6" /> : (
          <>
            {isSchemes ? <BookOpen className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </>
        )}
      </button>

      {/* Tooltip */}
      {!open && (
        <div className="fixed bottom-[76px] right-5 z-40 pointer-events-none" style={{ animation:'lbPop .4s .6s both' }}>
          <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl whitespace-nowrap">
            💬 Ask me anything!
            <div className="absolute bottom-[-5px] right-4 w-2.5 h-2.5 bg-slate-900 rotate-45" />
          </div>
        </div>
      )}
    </>
  );
}