// const express  = require('express');
// const router   = express.Router();
// const { submitRating, getUserRatings, checkRating } = require('../controllers/ratingController');
// const { protect } = require('../middleware/authMiddleware');
// const { ratingValidator } = require('../middleware/validationMiddleware');

// router.post('/',               protect, ratingValidator, submitRating);
// router.get('/user/:userId',    getUserRatings);
// router.get('/check',           protect, checkRating);

// module.exports = router;

const express = require('express');
const { createRating, getUserRatings } = require('../controllers/ratingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createRating);
router.get('/user/:userId', getUserRatings);

module.exports = router;