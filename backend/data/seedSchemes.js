require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Scheme   = require('../models/schemeModel');

const base  = require('./schemeSeedData');
const extra = require('./schemeSeedDataExtra');

/* ── Add logoUrl to existing base schemes using Google S2 favicon service ── */
const LOGO_MAP = {
  'maandhan.in':                'https://www.google.com/s2/favicons?domain=maandhan.in&sz=128',
  'pmkvyofficial.org':          'https://www.google.com/s2/favicons?domain=pmkvyofficial.org&sz=128',
  'pmjay.gov.in':               'https://www.google.com/s2/favicons?domain=pmjay.gov.in&sz=128',
  'jansuraksha.gov.in':         'https://www.google.com/s2/favicons?domain=jansuraksha.gov.in&sz=128',
  'eshram.gov.in':              'https://www.google.com/s2/favicons?domain=eshram.gov.in&sz=128',
  'bocw.labour.gov.in':         'https://www.google.com/s2/favicons?domain=bocw.labour.gov.in&sz=128',
  'nrega.nic.in':               'https://www.google.com/s2/favicons?domain=nrega.nic.in&sz=128',
  'pmayg.nic.in':               'https://www.google.com/s2/favicons?domain=pmayg.nic.in&sz=128',
  'mudra.org.in':               'https://www.google.com/s2/favicons?domain=mudra.org.in&sz=128',
  'npscra.nsdl.co.in':          'https://www.google.com/s2/favicons?domain=npscra.nsdl.co.in&sz=128',
  'pmkisan.gov.in':             'https://www.google.com/s2/favicons?domain=pmkisan.gov.in&sz=128',
  'nhm.gov.in':                 'https://www.google.com/s2/favicons?domain=nhm.gov.in&sz=128',
  'apprenticeshipindia.gov.in': 'https://www.google.com/s2/favicons?domain=apprenticeshipindia.gov.in&sz=128',
  'nsap.nic.in':                'https://www.google.com/s2/favicons?domain=nsap.nic.in&sz=128',
  'epfindia.gov.in':            'https://www.google.com/s2/favicons?domain=epfindia.gov.in&sz=128',
  'pmfby.gov.in':               'https://www.google.com/s2/favicons?domain=pmfby.gov.in&sz=128',
  'ddugky.gov.in':              'https://www.google.com/s2/favicons?domain=ddugky.gov.in&sz=128',
  'wcd.nic.in':                 'https://www.google.com/s2/favicons?domain=wcd.nic.in&sz=128',
  'standupmitra.in':            'https://www.google.com/s2/favicons?domain=standupmitra.in&sz=128',
  'pmjdy.gov.in':               'https://www.google.com/s2/favicons?domain=pmjdy.gov.in&sz=128',
  'nulm.gov.in':                'https://www.google.com/s2/favicons?domain=nulm.gov.in&sz=128',
  'esic.in':                    'https://www.google.com/s2/favicons?domain=esic.in&sz=128',
  'labour.gov.in':              'https://www.google.com/s2/favicons?domain=labour.gov.in&sz=128',
  'pmaymis.gov.in':             'https://www.google.com/s2/favicons?domain=pmaymis.gov.in&sz=128',
  'pmuy.gov.in':                'https://www.google.com/s2/favicons?domain=pmuy.gov.in&sz=128',
  'pmvishwakarma.gov.in':       'https://www.google.com/s2/favicons?domain=pmvishwakarma.gov.in&sz=128',
  'enps.nsdl.com':              'https://www.google.com/s2/favicons?domain=nsdl.com&sz=128',
  'aajeevika.gov.in':           'https://www.google.com/s2/favicons?domain=aajeevika.gov.in&sz=128',
  'minorityaffairs.gov.in':     'https://www.google.com/s2/favicons?domain=minorityaffairs.gov.in&sz=128',
  'upbocw.in':                  'https://www.google.com/s2/favicons?domain=upbocw.in&sz=128',
  'licindia.in':                'https://www.google.com/s2/favicons?domain=licindia.in&sz=128',
  'chiranjeevi.rajasthan.gov.in':'https://www.google.com/s2/favicons?domain=rajasthan.gov.in&sz=128',
  'nfsa.gov.in':                'https://www.google.com/s2/favicons?domain=nfsa.gov.in&sz=128',
  'janaushadhi.gov.in':         'https://www.google.com/s2/favicons?domain=janaushadhi.gov.in&sz=128',
};

const FALLBACK_MAP = {
  pension:           '🏦',
  insurance:         '🛡️',
  housing:           '🏠',
  skill_development: '📚',
  healthcare:        '🏥',
  social_security:   '🔐',
  financial_aid:     '💰',
  labour_welfare:    '👷',
  women_empowerment: '👩',
  other:             '📋',
};

/**
 * Enrich base schemes with logoUrl + logoFallback if missing.
 */
const enriched = base.map(s => ({
  ...s,
  logoUrl:     s.logoUrl     || (s.officialLink ? LOGO_MAP[s.portalName] || null : null),
  logoFallback:s.logoFallback || FALLBACK_MAP[s.category] || '📋',
}));

const all = [...enriched, ...extra];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/labour_connect');
  console.log('✅ Connected to MongoDB');

  await Scheme.deleteMany({});
  console.log('🗑️  Cleared existing schemes');

  const created = await Scheme.insertMany(all, { ordered: false });
  console.log(`✅ Inserted ${created.length} schemes`);

  // Print category breakdown
  const cats = {};
  all.forEach(s => { cats[s.category] = (cats[s.category] || 0) + 1; });
  console.log('\n📊 Schemes per category:');
  Object.entries(cats).sort().forEach(([k, v]) => console.log(`   ${k.padEnd(22)} ${v}`));

  await mongoose.disconnect();
  console.log('\n✅ Done!');
};

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});