const prisma = require('../utils/prisma');

async function getAll(req, res, next) {
  try {
    const settings = await prisma.settings.findMany();
    const result = Object.fromEntries(settings.map(s => [s.key, s.value]));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(422).json({ message: 'Data settings wajib dikirim' });
    }

    const keys = Object.keys(updates);
    const validKeys = ['tarif_bulanan', 'tarif_makam_per_jiwa'];
    const invalidKeys = keys.filter(k => !validKeys.includes(k));
    if (invalidKeys.length > 0) {
      return res.status(422).json({ message: `Key tidak valid: ${invalidKeys.join(', ')}` });
    }

    for (const [key, value] of Object.entries(updates)) {
      await prisma.settings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    const settings = await prisma.settings.findMany();
    const result = Object.fromEntries(settings.map(s => [s.key, s.value]));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, update };
