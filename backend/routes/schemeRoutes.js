const express = require('express');
const router  = express.Router();
const {
  getSchemes, getFilterOptions, getSavedSchemes, saveScheme, unsaveScheme,
  getSchemeById, createScheme, updateScheme, deleteScheme,
  toggleActive, toggleFeatured, getAllSchemesAdmin,
} = require('../controllers/schemeController');
const { protect, authorize } = require('../middleware/authMiddleware');

/* ── Public ─────────────────────────────────────────────────────────────── */
router.get('/',               getSchemes);
router.get('/filter-options', getFilterOptions);

/* ── Auth required ──────────────────────────────────────────────────────── */
// NOTE: /saved MUST be before /:id so 'saved' is not treated as an :id param
router.get('/saved',          protect, getSavedSchemes);
router.post('/:id/save',      protect, saveScheme);
router.delete('/:id/save',    protect, unsaveScheme);

/* ── Admin only ─────────────────────────────────────────────────────────── */
router.get('/admin/all',                   protect, authorize('admin'), getAllSchemesAdmin);
router.post('/',                           protect, authorize('admin'), createScheme);
router.put('/:id',                         protect, authorize('admin'), updateScheme);
router.delete('/:id',                      protect, authorize('admin'), deleteScheme);
router.patch('/:id/toggle-active',         protect, authorize('admin'), toggleActive);
router.patch('/:id/toggle-featured',       protect, authorize('admin'), toggleFeatured);

/* ── Public single scheme (must come LAST to avoid catching /saved etc.) ── */
router.get('/:id', getSchemeById);

module.exports = router;