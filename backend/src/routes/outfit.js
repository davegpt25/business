const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getRecommendations } = require('../controllers/outfitController');

router.use(auth);
router.get('/recommendations', getRecommendations);

module.exports = router;
