const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  addItem, getItems, getItem, updateItem, deleteItem,
} = require('../controllers/closetController');

router.use(auth);
router.post('/items', addItem);
router.get('/items', getItems);
router.get('/items/:id', getItem);
router.patch('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);

module.exports = router;
