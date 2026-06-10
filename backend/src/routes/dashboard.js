const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/stats', controller.getStats);
router.get('/kolektibilitas', controller.getKolektibilitas);
router.get('/aktivitas', controller.getAktivitas);

module.exports = router;
