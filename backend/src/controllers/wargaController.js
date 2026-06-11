const { Prisma } = require('@prisma/client');
const prisma = require('../utils/prisma');
const excelService = require('../services/excelService');

async function getAll(req, res, next) {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { created_by: req.user.id };
    if (search) {
      where.OR = [
        { nama_kk: { contains: search, mode: 'insensitive' } },
        { no_kartu: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.warga.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: Prisma.sql`CAST(no_kartu AS INTEGER) ASC`,
        include: {
          iuran_makam: true,
          iuran_bulanan: {
            orderBy: [{ tahun: 'desc' }, { bulan: 'desc' }],
            take: 12,
          },
        },
      }),
      prisma.warga.count({ where }),
    ]);

    res.json({ data, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const warga = await prisma.warga.findFirst({
      where: { id: parseInt(req.params.id), created_by: req.user.id },
      include: {
        iuran_makam: { include: { bulanan: { orderBy: { created_at: 'desc' } } } },
        iuran_bulanan: { orderBy: [{ tahun: 'desc' }, { bulan: 'desc' }] },
      },
    });
    if (!warga) return res.status(404).json({ message: 'Warga tidak ditemukan' });
    res.json(warga);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { no_kartu, nama_kk, jumlah_jiwa } = req.body;

    if (!no_kartu || !nama_kk) {
      return res.status(422).json({ message: 'No Kartu dan Nama KK wajib diisi' });
    }
    if (!jumlah_jiwa || jumlah_jiwa < 1) {
      return res.status(422).json({ message: 'Jumlah jiwa harus lebih dari 0' });
    }

    const existing = await prisma.warga.findFirst({ where: { no_kartu, created_by: req.user.id } });
    if (existing) {
      return res.status(409).json({ message: 'No Kartu sudah terdaftar' });
    }

    const settings = await prisma.settings.findMany();
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
    const tarifMakam = parseInt(settingsMap.tarif_makam_per_jiwa) || 10000;

    const tagihanPerBulan = jumlah_jiwa * tarifMakam;
    const jangkaWaktu = 36;
    const totalTagihan = tagihanPerBulan * jangkaWaktu;

    const warga = await prisma.warga.create({
      data: {
        no_kartu,
        nama_kk,
        jumlah_jiwa,
        created_by: req.user.id,
        iuran_makam: {
      create: {
        total_tagihan: totalTagihan,
        tagihan_per_bulan: tagihanPerBulan,
        jangka_waktu: jangkaWaktu,
        total_terbayar: 0,
      },
        },
      },
      include: { iuran_makam: true },
    });

    res.status(201).json(warga);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { nama_kk, jumlah_jiwa } = req.body;

    const warga = await prisma.warga.findFirst({
      where: { id, created_by: req.user.id },
      include: { iuran_makam: true },
    });
    if (!warga) return res.status(404).json({ message: 'Warga tidak ditemukan' });

    if (jumlah_jiwa !== undefined && jumlah_jiwa < 1) {
      return res.status(422).json({ message: 'Jumlah jiwa harus lebih dari 0' });
    }

    const settings = await prisma.settings.findMany();
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
    const tarifMakam = parseInt(settingsMap.tarif_makam_per_jiwa) || 10000;

    let makamUpdate = undefined;
    if (jumlah_jiwa) {
      const tagihanPerBulan = jumlah_jiwa * tarifMakam;
      const totalTagihan = tagihanPerBulan * 36;
      makamUpdate = {
        update: {
          total_tagihan: totalTagihan,
          tagihan_per_bulan: tagihanPerBulan,
        },
      };
    }

    const updated = await prisma.warga.update({
      where: { id },
      data: {
        ...(nama_kk && { nama_kk }),
        ...(jumlah_jiwa && { jumlah_jiwa }),
        iuran_makam: makamUpdate,
      },
      include: { iuran_makam: true },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const warga = await prisma.warga.findFirst({ where: { id, created_by: req.user.id } });
    if (!warga) return res.status(404).json({ message: 'Warga tidak ditemukan' });
    await prisma.warga.delete({ where: { id } });
    res.json({ message: 'Warga berhasil dihapus' });
  } catch (err) {
    next(err);
  }
}

async function importExcel(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File Excel wajib diupload' });
    }

    const { mode } = req.body;
    if (!mode || !['overwrite', 'skip'].includes(mode)) {
      return res.status(422).json({ message: 'Mode import harus overwrite atau skip' });
    }

    const settings = await prisma.settings.findMany();
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
    const tarifMakam = parseInt(settingsMap.tarif_makam_per_jiwa) || 10000;
    const tarifBulanan = parseInt(settingsMap.tarif_bulanan) || 10000;

    const result = await excelService.processImport(req.file.path, mode, tarifMakam, tarifBulanan, req.user.id);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function deleteAll(req, res, next) {
  try {
    const count = await prisma.warga.count({ where: { created_by: req.user.id } });
    if (count === 0) {
      return res.status(404).json({ message: 'Tidak ada data warga untuk dihapus' });
    }
    await prisma.warga.deleteMany({ where: { created_by: req.user.id } });
    res.json({ message: `Semua data warga (${count}) berhasil dihapus` });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove, importExcel, deleteAll };
