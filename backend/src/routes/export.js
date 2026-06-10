const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/iuran-bulanan/:tahun', exportController.exportIuranBulanan);
router.get('/iuran-makam', exportController.exportIuranMakam);
router.get('/iuran-makam-bulanan', exportController.exportIuranMakamBulanan);
router.get('/template-warga', exportController.downloadTemplateWarga);
router.get('/rekap-gabungan/:tahun', exportController.exportRekapGabungan);
router.get('/riwayat', exportController.getRiwayatPembayaran);
router.get('/detail-pembayaran', exportController.exportDetailPembayaran);

module.exports = router;
