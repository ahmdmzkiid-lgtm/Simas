const express = require('express');
const router = express.Router();
const controller = require('../controllers/iuranBulananController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', controller.getAll);
router.post('/', controller.create);
router.post('/bulk', controller.createBulk);
router.delete('/:id', controller.remove);
router.get('/rekap/:tahun', controller.rekapTahunan);

module.exports = router;
