const express = require('express');
const router = express.Router();
const multer = require('multer');
const wargaController = require('../controllers/wargaController');
const { authenticateToken } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

router.use(authenticateToken);

router.get('/', wargaController.getAll);
router.get('/:id', wargaController.getById);
router.post('/', wargaController.create);
router.put('/:id', wargaController.update);
router.delete('/', wargaController.deleteAll);
router.delete('/:id', wargaController.remove);
router.post('/import', upload.single('file'), wargaController.importExcel);

module.exports = router;
