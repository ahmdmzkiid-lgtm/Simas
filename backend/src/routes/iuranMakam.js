const express = require('express');
const router = express.Router();
const controller = require('../controllers/iuranMakamController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', controller.getAll);
router.post('/bayar-bulanan', controller.bayarBulanan);
router.post('/bayar-bulanan/bulk', controller.bayarBulananBulk);
router.delete('/bulanan/:id', controller.hapusBulanan);
router.get('/rekap/:tahun', controller.rekapTahunan);

module.exports = router;
