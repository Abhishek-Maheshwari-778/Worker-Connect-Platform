const Scheme      = require('../models/schemeModel');
const SavedScheme = require('../models/savedSchemeModel');
const { successResponse, paginatedResponse, getPaginationOptions } = require('../utils/apiResponse');

/* ── helpers ─────────────────────────────────────────────────────────────── */
const ANY_VALS = ['any', 'all'];

const anyInFilter = (val, catchAlls = ['any']) => ({ $in: [val, ...catchAlls] });

/* ── GET /api/schemes ────────────────────────────────────────────────────── */
exports.getSchemes = async (req, res, next) => {
  try {
    const {
      search, category, state, workType, industrySector,
      skillLevel, demographic, socioEconomic, employmentStatus, featured,
    } = req.query;

    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name_en:        { $regex: search, $options: 'i' } },
        { name_hi:        { $regex: search, $options: 'i' } },
        { description_en: { $regex: search, $options: 'i' } },
        { description_hi: { $regex: search, $options: 'i' } },
        { tags:           { $in: [new RegExp(search, 'i')] } },
      ];
    }
    if (category && !ANY_VALS.includes(category))   filter.category = category;
    if (state && !ANY_VALS.includes(state) && state !== 'National' && state !== 'All India')
      filter.state = { $in: [state, 'National', 'All India'] };
    if (skillLevel      && !ANY_VALS.includes(skillLevel))      filter.skillLevel      = anyInFilter(skillLevel,      ['any']);
    if (demographic     && !ANY_VALS.includes(demographic))     filter.demographic     = anyInFilter(demographic,     ['all']);
    if (socioEconomic   && !ANY_VALS.includes(socioEconomic))   filter.socioEconomic   = anyInFilter(socioEconomic,   ['any', 'all']);
    if (employmentStatus && !ANY_VALS.includes(employmentStatus)) filter.employmentStatus = anyInFilter(employmentStatus, ['any', 'all']);
    if (workType        && !ANY_VALS.includes(workType))        filter.workType        = anyInFilter(workType,        ['any']);
    if (industrySector  && !ANY_VALS.includes(industrySector))  filter.industrySector  = anyInFilter(industrySector,  ['any']);
    if (featured === 'true') filter.isFeatured = true;

    // BUG FIX: was getPaginationOptions(req) — must be getPaginationOptions(req.query)
    const { skip, limit, page } = getPaginationOptions(req.query);

    const [schemes, total] = await Promise.all([
      Scheme.find(filter).sort({ isFeatured: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Scheme.countDocuments(filter),
    ]);

    return paginatedResponse(res, schemes, total, page, limit);
  } catch (err) { next(err); }
};

/* ── GET /api/schemes/filter-options ────────────────────────────────────── */
exports.getFilterOptions = async (req, res, next) => {
  try {
    const [categories, states, skillLevels, demographics, socioEconomics, employmentStatuses] =
      await Promise.all([
        Scheme.distinct('category',         { isActive: true }),
        Scheme.distinct('state',            { isActive: true }),
        Scheme.distinct('skillLevel',       { isActive: true }),
        Scheme.distinct('demographic',      { isActive: true }),
        Scheme.distinct('socioEconomic',    { isActive: true }),
        Scheme.distinct('employmentStatus', { isActive: true }),
      ]);
    const clean = (arr, ex = []) => arr.filter(v => v && !ex.includes(v)).sort();
    return successResponse(res, 200, 'Filter options fetched', {
      categories,
      states:             clean(states,             ['National', 'All India']),
      skillLevels:        clean(skillLevels,        ['any']),
      demographics:       clean(demographics,       ['all']),
      socioEconomics:     clean(socioEconomics,     ['any', 'all']),
      employmentStatuses: clean(employmentStatuses, ['any', 'all']),
    });
  } catch (err) { next(err); }
};

/* ── GET /api/schemes/saved  (auth) ────────────────────────────────────── */
exports.getSavedSchemes = async (req, res, next) => {
  try {
    const saved = await SavedScheme.find({ user: req.user._id })
      .populate({ path: 'scheme', match: { isActive: true } })
      .sort({ savedAt: -1 })
      .lean();
    const schemes = saved.map(s => s.scheme).filter(Boolean);
    // BUG FIX: was successResponse(res, schemes) — passing array as statusCode
    return successResponse(res, 200, 'Saved schemes fetched', schemes);
  } catch (err) { next(err); }
};

/* ── POST /api/schemes/:id/save  (auth) ────────────────────────────────── */
exports.saveScheme = async (req, res, next) => {
  try {
    const scheme = await Scheme.findById(req.params.id).lean();
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found' });
    await SavedScheme.findOneAndUpdate(
      { user: req.user._id, scheme: req.params.id },
      { user: req.user._id, scheme: req.params.id },
      { upsert: true, new: true },
    );
    // BUG FIX: was successResponse(res, null, 'Scheme saved') — null as statusCode
    return successResponse(res, 200, 'Scheme saved', null);
  } catch (err) { next(err); }
};

/* ── DELETE /api/schemes/:id/save  (auth) ──────────────────────────────── */
exports.unsaveScheme = async (req, res, next) => {
  try {
    await SavedScheme.findOneAndDelete({ user: req.user._id, scheme: req.params.id });
    // BUG FIX: was successResponse(res, null, 'Scheme removed') — null as statusCode
    return successResponse(res, 200, 'Scheme removed from saved', null);
  } catch (err) { next(err); }
};

/* ── GET /api/schemes/:id ───────────────────────────────────────────────── */
exports.getSchemeById = async (req, res, next) => {
  try {
    const scheme = await Scheme.findById(req.params.id).lean();
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found' });
    return successResponse(res, 200, 'Scheme fetched', scheme);
  } catch (err) { next(err); }
};

/* ── POST /api/schemes  (admin) ─────────────────────────────────────────── */
exports.createScheme = async (req, res, next) => {
  try {
    const scheme = await Scheme.create(req.body);
    return successResponse(res, 201, 'Scheme created', scheme);
  } catch (err) { next(err); }
};

/* ── PUT /api/schemes/:id  (admin) ─────────────────────────────────────── */
exports.updateScheme = async (req, res, next) => {
  try {
    const scheme = await Scheme.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found' });
    return successResponse(res, 200, 'Scheme updated', scheme);
  } catch (err) { next(err); }
};

/* ── DELETE /api/schemes/:id  (admin) ──────────────────────────────────── */
exports.deleteScheme = async (req, res, next) => {
  try {
    const scheme = await Scheme.findByIdAndDelete(req.params.id);
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found' });
    // Also delete all saves for this scheme
    await SavedScheme.deleteMany({ scheme: req.params.id });
    return successResponse(res, 200, 'Scheme deleted', null);
  } catch (err) { next(err); }
};

/* ── PATCH /api/schemes/:id/toggle-active  (admin) ─────────────────────── */
exports.toggleActive = async (req, res, next) => {
  try {
    const scheme = await Scheme.findById(req.params.id);
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found' });
    scheme.isActive = !scheme.isActive;
    await scheme.save();
    return successResponse(res, 200, `Scheme ${scheme.isActive ? 'activated' : 'deactivated'}`, scheme);
  } catch (err) { next(err); }
};

/* ── PATCH /api/schemes/:id/toggle-featured  (admin) ───────────────────── */
exports.toggleFeatured = async (req, res, next) => {
  try {
    const scheme = await Scheme.findById(req.params.id);
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found' });
    scheme.isFeatured = !scheme.isFeatured;
    await scheme.save();
    return successResponse(res, 200, `Scheme ${scheme.isFeatured ? 'featured' : 'unfeatured'}`, scheme);
  } catch (err) { next(err); }
};

/* ── GET /api/schemes/admin/all  (admin — includes inactive) ────────────── */
exports.getAllSchemesAdmin = async (req, res, next) => {
  try {
    const { search, category, isActive, isFeatured } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name_en: { $regex: search, $options: 'i' } },
        { name_hi: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (isActive  !== undefined) filter.isActive   = isActive  === 'true';
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';

    const { skip, limit, page } = getPaginationOptions(req.query);
    const [schemes, total] = await Promise.all([
      Scheme.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Scheme.countDocuments(filter),
    ]);
    return paginatedResponse(res, schemes, total, page, limit);
  } catch (err) { next(err); }
};