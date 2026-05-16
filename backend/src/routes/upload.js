const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadImage } = require('../controllers/uploadController');

router.post('/image', auth, uploadImage);

module.exports = router;
