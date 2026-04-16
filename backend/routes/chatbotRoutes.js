const express      = require('express');
const router       = express.Router();
const asyncHandler = require('express-async-handler');
const { optionalAuth } = require('../middleware/authMiddleware');
const rateLimit    = require('express-rate-limit');

const botLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

// ── System prompt ─────────────────────────────────────────────────────────────
const buildSystemPrompt = (user) => {
  const role = user?.role || 'guest';
  const name = user?.name || 'there';

  const base = `You are LabourBot, the friendly AI assistant for Labour Connect — India's most trusted daily wage labour hiring platform.

PLATFORM FEATURES:
- Workers create verified profiles, apply for jobs, earn ratings and badges
- Clients post jobs, browse verified workers, use AI screening
- AI job matching based on skills, location, and wage expectations
- Real-time chat between workers and clients
- Aadhaar identity verification for trust and safety
- Rating system and badges: Verified, Top Rated, Fast Responder, Experienced
- Government welfare scheme discovery
- Admin panel: verification review, user management, analytics
- Free to use during launch phase

RESPONSE RULES:
- Be warm, helpful, and concise — max 150 words
- Use simple English suitable for daily wage workers in India
- Use bullet points with • for multi-step instructions
- Use **bold** for important terms
- If unsure, guide to support@labourconnect.in`;

  const roleMap = {
    labour: `\nUSER: ${name} is a WORKER. Help with: jobs, profile, Aadhaar, applications, ratings, badges, schemes.`,
    client: `\nUSER: ${name} is a CLIENT. Help with: posting jobs, finding workers, AI screening, applications, ratings.`,
    admin:  `\nUSER: ${name} is ADMIN. Help with: verifying documents, managing users, monitoring platform.`,
    guest:  `\nUSER: Guest visitor. Explain the platform, encourage registration.`,
  };

  return base + (roleMap[role] || roleMap.guest);
};

// ── Call Gemini REST API ──────────────────────────────────────────────────────
// Models confirmed available for this API key
const GEMINI_MODELS = [
  { model: 'gemini-2.5-flash',      version: 'v1beta' },
  { model: 'gemini-2.0-flash',      version: 'v1beta' },
  { model: 'gemini-2.0-flash-001',  version: 'v1beta' },
  { model: 'gemini-2.0-flash-lite', version: 'v1beta' },
  { model: 'gemini-flash-latest',   version: 'v1beta' },
];

async function callGeminiModel(geminiKey, modelName, apiVersion, systemPrompt, userMessage, history) {
  const contents = [];

  if (history && history.length > 0) {
    for (const h of history.slice(-8)) {
      contents.push({
        role:  h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(h.content) }],
      });
    }
  }

  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  // v1 does not support system_instruction
  const body = apiVersion === 'v1'
    ? { contents, generationConfig: { maxOutputTokens: 400, temperature: 0.75 } }
    : {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig:   { maxOutputTokens: 400, temperature: 0.75 },
      };

  // For v1, prepend system as first user message
  if (apiVersion === 'v1') {
    body.contents = [
      { role: 'user',  parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood. I am LabourBot.' }] },
      ...contents,
    ];
  }

  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${geminiKey}`;

  const response = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(15000),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || `HTTP ${response.status}`);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('Empty response');

  return text;
}

async function callGemini(geminiKey, systemPrompt, userMessage, history) {
  let lastError = '';

  for (const { model, version } of GEMINI_MODELS) {
    try {
      const text = await callGeminiModel(geminiKey, model, version, systemPrompt, userMessage, history);
      console.log(`✅ Gemini working: ${model} (${version})`);
      return text;
    } catch (err) {
      lastError = err.message;
      const isModelError = err.message.includes('not found')
        || err.message.includes('not supported')
        || err.message.includes('404')
        || err.message.includes('does not exist');
      if (isModelError) {
        console.log(`⚠️  ${model}/${version} not available, trying next...`);
        continue;
      }
      // Auth or quota errors — no point trying more models
      if (err.message.includes('API_KEY') || err.message.includes('quota') || err.message.includes('403')) {
        throw new Error(`Gemini API error: ${err.message}`);
      }
      console.log(`⚠️  ${model}/${version} failed: ${err.message}, trying next...`);
    }
  }

  throw new Error(`No Gemini model available. Last error: ${lastError}`);
}

// ── GET /api/chatbot/test — diagnostic endpoint ───────────────────────────────
router.get('/test', asyncHandler(async (req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY;

  const result = {
    keySet:        !!geminiKey,
    keyPrefix:     geminiKey ? geminiKey.substring(0, 8) + '...' : 'NOT SET',
    keyLength:     geminiKey ? geminiKey.length : 0,
    keyLooksValid: geminiKey ? geminiKey.startsWith('AIza') : false,
    geminiStatus:  'not tested',
    reply:         null,
    error:         null,
  };

  if (!geminiKey) {
    result.geminiStatus = 'MISSING — add GEMINI_API_KEY to .env file';
    return res.json(result);
  }

  if (!geminiKey.startsWith('AIza')) {
    result.geminiStatus = 'INVALID KEY FORMAT — Gemini keys start with AIza';
    return res.json(result);
  }

  try {
    const reply = await callGemini(
      geminiKey,
      'You are a helpful assistant. Keep responses short.',
      'Say "Gemini is working!" in exactly those words.',
      []
    );
    result.geminiStatus = 'WORKING ✅';
    result.reply        = reply;
  } catch (err) {
    result.geminiStatus = 'FAILED ❌';
    result.error        = err.message;
    result.fix          = 'Go to https://aistudio.google.com/app/apikey and create a new API key';
  }

  res.json(result);
}));

// ── POST /api/chatbot/message ─────────────────────────────────────────────────
router.post('/message', botLimiter, optionalAuth, asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  const userMessage = message.trim().slice(0, 500);
  const geminiKey   = process.env.GEMINI_API_KEY;
  const systemPrompt = buildSystemPrompt(req.user);

  // ── Try Gemini ───────────────────────────────────────────────────────────
  if (geminiKey && geminiKey.startsWith('AIza') && geminiKey.length > 20) {
    try {
      const reply = await callGemini(geminiKey, systemPrompt, userMessage, history);
      console.log('✅ Gemini replied to:', userMessage.slice(0, 40));
      return res.json({ success: true, reply, source: 'gemini' });
    } catch (err) {
      console.error('❌ Gemini error:', err.message);
      // fall through to rule-based
    }
  } else {
    if (!geminiKey || geminiKey.length < 5) {
      console.warn('⚠️  GEMINI_API_KEY not set — using rule-based');
    } else {
      console.warn('⚠️  GEMINI_API_KEY invalid format — using rule-based');
    }
  }

  // ── Rule-based fallback ──────────────────────────────────────────────────
  const reply = getRuleBasedReply(userMessage, req.user);
  console.log('💬 Rule-based reply sent');
  res.json({ success: true, reply, source: 'rule-based' });
}));

// ── Rule-based replies ────────────────────────────────────────────────────────
function getRuleBasedReply(msg, user) {
  const m    = msg.toLowerCase();
  const role = user?.role || 'guest';
  const name = user?.name ? user.name.split(' ')[0] : null;

  if (/^(hi|hello|hey|namaste|hii)\b/.test(m))
    return name
      ? `Hello ${name}! 👋 I'm LabourBot. How can I help you today?`
      : `Hello! 👋 I'm LabourBot, your Labour Connect AI assistant. What can I help you with?`;

  if (/what is|about|tell me|platform|labour connect/.test(m))
    return `**Labour Connect** connects daily wage workers with clients across India.\n\n• Workers find verified jobs nearby\n• Clients hire in under 2 hours\n• AI matches skills to jobs instantly\n• Aadhaar verification ensures trust`;

  if (/register|sign up|create account|join/.test(m))
    return `To join Labour Connect:\n\n1. Click **Get Started** on homepage\n2. Choose **Worker** or **Client**\n3. Fill your details — completely **free!** 🆓`;

  if (/find job|get job|search job|browse job/.test(m) || (role === 'labour' && /\bjob\b/.test(m)))
    return `To find jobs:\n\n1. Go to **Browse Jobs** in your dashboard\n2. Filter by skill, city or budget\n3. Click **Apply Now** with your proposal\n\n💡 Complete your profile for AI job recommendations!`;

  if (/post job|hire|find worker/.test(m))
    return `To hire workers:\n\n1. Click **Post a Job** in your dashboard\n2. Add job details, budget and location\n3. AI screens candidates automatically\n4. Review and accept the best fit\n\n⚡ Most clients hire within 2 hours!`;

  if (/aadhaar|verify|verification|document/.test(m))
    return `**Aadhaar Verification:**\n\n• Go to **My Profile → Identity Verification**\n• Upload your Aadhaar card photo\n• Admin reviews within 24 hours\n• Get the ✓ **Verified Badge**\n\nVerified workers get 3x more job offers!`;

  if (/application|applied|status|shortlist/.test(m))
    return `Track applications at **My Applications** in the sidebar.\n\n• 🔵 **Applied** — waiting for client\n• ⭐ **Shortlisted** — client reviewing you\n• ✅ **Accepted** — you got the job!\n• ❌ **Rejected** — not selected this time`;

  if (/rating|review|star|feedback/.test(m))
    return `**Ratings on Labour Connect:**\n\n• Clients rate workers after completion\n• Workers rate clients for payment reliability\n• High ratings earn the ⭐ **Top Rated** badge\n• Ratings build your long-term reputation`;

  if (/pay|salary|wage|money|earn/.test(m))
    return `**Payments:**\n\n• Set your own **daily wage** on your profile\n• Clients see your wage range when browsing\n• Payment modes: Cash, UPI, Bank Transfer\n\n💡 Set a fair wage to get more offers.`;

  if (/government|scheme|welfare|benefit|pm|insurance/.test(m))
    return `Labour Connect shows **Government Schemes** for workers:\n\n• PM Shram Yogi Maandhan (pension)\n• ESIC (health insurance)\n• Skill India (free training)\n\nGo to **Govt. Schemes** in the sidebar! 📋`;

  if (/chat|message|contact|talk/.test(m))
    return `**Real-time Chat:**\n\n• Go to **Messages** in your sidebar\n• Chat directly with clients or workers\n• Discuss job details and wages privately\n• Start from any job listing or profile`;

  if (/password|forgot|reset|login/.test(m))
    return `**Login Help:**\n\n1. Click **Forgot password?** on login page\n2. Enter your email address\n3. Check inbox for reset link (15 min expiry)\n\nStill stuck? Email **support@labourconnect.in**`;

  if (/free|cost|price|fee|charge/.test(m))
    return `**Labour Connect is FREE** during launch!\n\n✅ Workers — free profile and applications\n✅ Clients — free job posting and browsing\n\nEnterprise plans available for large teams.`;

  if (/badge|medal|top rated|fast responder|experienced/.test(m))
    return `**Badges you can earn:**\n\n• ✅ **Verified** — Aadhaar confirmed\n• ⭐ **Top Rated** — high ratings\n• ⚡ **Fast Responder** — quick replies\n• 🏅 **Experienced** — many completed jobs`;

  if (/ai|artificial|machine|recommend|match/.test(m))
    return `**AI Features on Labour Connect:**\n\n• 🤖 AI Job Matching — jobs based on your skills and location\n• 📞 AI Calling Agent — screens candidates by phone\n• 🎯 Smart Recommendations — learns your preferences`;

  if (/thank|thanks|great|helpful|good/.test(m))
    return `You're welcome! 😊 I'm always here to help. Feel free to ask anything else about Labour Connect!`;

  if (/bye|goodbye|done|exit/.test(m))
    return `Goodbye! 👋 Good luck on Labour Connect! 🌟`;

  if (/skill|profile|edit profile/.test(m))
    return `**Update your profile:**\n\n1. Go to **My Profile** in sidebar\n2. Tap skill categories to add skills instantly\n3. Set your daily wage and working radius\n4. Upload portfolio photos\n5. Verify Aadhaar for the Verified badge\n\n💡 A complete profile gets 5x more visibility!`;

  if (/group|team|multiple worker/.test(m))
    return `**Group Hiring on Labour Connect:**\n\n• Post a job with multiple skill requirements\n• e.g. "Need 3 painters + 2 electricians"\n• Enable **Group Job** toggle when posting\n• Each skill type can have a different count`;

  return `I'm here to help with **Labour Connect**!\n\nYou can ask me about:\n• Finding or posting jobs\n• Profile and verification\n• Application tracking\n• Payments and ratings\n• Government schemes\n\nOr email **support@labourconnect.in** for personal help.`;
}

module.exports = router;