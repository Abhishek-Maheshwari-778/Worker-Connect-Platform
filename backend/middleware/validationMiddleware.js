const { body, param, query, validationResult } = require('express-validator');

// ─── Middleware to check result ────────────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors:  errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Auth validators ───────────────────────────────────────────────────────────
const registerValidator = [
  body('name')
    .trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 60 }).withMessage('Name cannot exceed 60 characters'),
  body('email')
    .normalizeEmail().isEmail().withMessage('Valid email is required'),
  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  body('role')
    .isIn(['labour', 'client']).withMessage('Role must be labour or client'),
  validate,
];

const loginValidator = [
  body('email').normalizeEmail().isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// ─── Job validators ────────────────────────────────────────────────────────────
const createJobValidator = [
  body('title')
    .trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description')
    .trim().notEmpty().withMessage('Description is required'),
  body('category')
    .notEmpty().withMessage('Category is required'),
  body('budgetMin')
    .isNumeric().withMessage('Budget min must be a number'),
  body('budgetMax')
    .isNumeric().withMessage('Budget max must be a number'),
  body('startDate')
    .isISO8601().withMessage('Valid start date is required'),
  body('totalLabourNeeded')
    .isInt({ min: 1 }).withMessage('At least 1 labourer is required'),
  validate,
];

// ─── Rating validator ─────────────────────────────────────────────────────────
const ratingValidator = [
  body('overallRating')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review')
    .optional().isLength({ max: 1000 }).withMessage('Review cannot exceed 1000 characters'),
  validate,
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  createJobValidator,
  ratingValidator,
};
