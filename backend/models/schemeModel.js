const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  // ── Bilingual names & descriptions ───────────────────────────────────────
  name_en:        { type: String, required: true, trim: true },
  name_hi:        { type: String, required: true, trim: true },
  description_en: { type: String, required: true, trim: true },
  description_hi: { type: String, required: true, trim: true },
  ministry_en:    { type: String, trim: true },
  ministry_hi:    { type: String, trim: true },

  // ── Logo — official government portal favicon / logo URL ─────────────────
  // Use Google S2 favicon service: https://www.google.com/s2/favicons?domain=DOMAIN&sz=64
  // Falls back to category emoji in UI if empty.
  logoUrl:        { type: String, trim: true },
  logoFallback:   { type: String, trim: true }, // emoji fallback e.g. '🏦'

  // ── Classification ────────────────────────────────────────────────────────
  category: {
    type: String,
    required: true,
    enum: ['pension','insurance','housing','skill_development','healthcare',
           'social_security','financial_aid','labour_welfare','women_empowerment','other'],
  },
  state:           { type: String, default: 'National' },
  workType:        { type: String },
  industrySector:  { type: String },
  skillLevel:      { type: String, enum: ['unskilled','semi_skilled','skilled','any'] },
  demographic:     { type: String, enum: ['all','women','youth','senior','rural','urban','tribal'] },
  socioEconomic:   { type: String, enum: ['all','bpl','low_income','middle_income','any'] },
  employmentStatus:{ type: String, enum: ['all','unemployed','daily_wage','self_employed','any'] },

  // ── Eligibility ───────────────────────────────────────────────────────────
  eligibilityCriteria: [{ en: String, hi: String }],
  ageMin: Number,
  ageMax: Number,

  // ── Benefits ──────────────────────────────────────────────────────────────
  benefits:      [{ en: String, hi: String }],
  benefitAmount: String,

  // ── Documents ─────────────────────────────────────────────────────────────
  documentsRequired: [{ en: String, hi: String }],

  // ── Application ───────────────────────────────────────────────────────────
  applicationSteps: [{ step: Number, en: String, hi: String }],
  officialLink:     { type: String },
  portalName:       { type: String },
  youtubeVideoId:   { type: String },
  youtubeTitle_en:  { type: String },
  youtubeTitle_hi:  { type: String },

  // ── Helpline & contact ────────────────────────────────────────────────────
  helplineNumber:  { type: String },  // e.g. '14555'
  helplineLabel:   { type: String },  // e.g. 'Toll Free'

  // ── Tags for search ───────────────────────────────────────────────────────
  tags:       [String],
  isActive:   { type: Boolean, default: true  },
  isFeatured: { type: Boolean, default: false },
}, { timestamps: true });

schemeSchema.index({ category: 1, isActive: 1 });
schemeSchema.index({ state: 1 });
schemeSchema.index({ skillLevel: 1 });
schemeSchema.index({ demographic: 1 });
schemeSchema.index({ name_en: 'text', name_hi: 'text', tags: 'text', description_en: 'text' });

module.exports = mongoose.model('Scheme', schemeSchema);