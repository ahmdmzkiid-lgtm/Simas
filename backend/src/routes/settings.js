const express = require('express');
const router = express.Router();
const controller = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', controller.getAll);
router.put('/', controller.update);

module.exports = router;
