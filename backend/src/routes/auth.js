const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { socialLogin, updateProfile } = require('../controllers/authController');

router.post('/social-login', socialLogin);
router.patch('/profile', auth, updateProfile);

module.exports = router;
