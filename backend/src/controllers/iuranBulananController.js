const prisma = require('../utils/prisma');

async function getAll(req, res, next) {
  try {
    const { warga_id, bulan, tahun } = req.query;
    const where = { warga: { created_by: req.user.id } };
    if (warga_id) where.warga_id = parseInt(warga_id);
    if (bulan) where.bulan = parseInt(bulan);
    if (tahun) where.tahun = parseInt(tahun);

    let data = await prisma.iuranBulanan.findMany({
      where,
      include: { warga: { select: { no_kartu: true, nama_kk: true } } },
    });
    data.sort((a, b) => parseInt(a.warga.no_kartu) - parseInt(b.warga.no_kartu) || b.tahun - a.tahun || b.bulan - a.bulan);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { warga_id, bulan, tahun, jumlah_bayar, tanggal_bayar } = req.body;

    if (!warga_id || !bulan || !tahun || !jumlah_bayar || !tanggal_bayar) {
      return res.status(422).json({ message: 'Semua field wajib diisi' });
    }
    if (bulan < 1 || bulan > 12) {
      return res.status(422).json({ message: 'Bulan harus 1-12' });
    }
    if (jumlah_bayar <= 0) {
      return res.status(422).json({ message: 'Jumlah bayar harus lebih dari 0' });
    }

    const warga = await prisma.warga.findFirst({ where: { id: parseInt(warga_id), created_by: req.user.id } });
    if (!warga) return res.status(404).json({ message: 'Warga tidak ditemukan' });

    const settings = await prisma.settings.findMany({ where: { created_by: req.user.id } });
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
    const tarifBulanan = parseInt(settingsMap.tarif_bulanan) || 10000;

    const existing = await prisma.iuranBulanan.findUnique({
      where: { warga_id_bulan_tahun: { warga_id: parseInt(warga_id), bulan: parseInt(bulan), tahun: parseInt(tahun) } },
    });
    if (existing) {
      return res.status(409).json({ message: 'Pembayaran bulan ini sudah tercatat' });
    }

    const status = parseFloat(jumlah_bayar) >= tarifBulanan ? 'Lunas' : 'Belum Lunas';

    const iuran = await prisma.iuranBulanan.create({
      data: {
        warga_id: parseInt(warga_id),
        bulan: parseInt(bulan),
        tahun: parseInt(tahun),
        jumlah_bayar: parseFloat(jumlah_bayar),
        tanggal_bayar: new Date(tanggal_bayar),
        status,
        dicatat_oleh: req.user.id,
      },
      include: { warga: { select: { no_kartu: true, nama_kk: true } } },
    });

    res.status(201).json(iuran);
  } catch (err) {
    next(err);
  }
}

async function createBulk(req, res, next) {
  try {
    const { warga_id, bulan_dari, bulan_sampai, tahun, jumlah_bayar, tanggal_bayar } = req.body;

    if (!warga_id || !bulan_dari || !bulan_sampai || !tahun || !jumlah_bayar || !tanggal_bayar) {
      return res.status(422).json({ message: 'Semua field wajib diisi' });
    }
    if (bulan_dari < 1 || bulan_dari > 12 || bulan_sampai < 1 || bulan_sampai > 12) {
      return res.status(422).json({ message: 'Bulan harus 1-12' });
    }
    if (jumlah_bayar <= 0) {
      return res.status(422).json({ message: 'Jumlah bayar harus lebih dari 0' });
    }

    const warga = await prisma.warga.findFirst({ where: { id: parseInt(warga_id), created_by: req.user.id } });
    if (!warga) return res.status(404).json({ message: 'Warga tidak ditemukan' });

    const settings = await prisma.settings.findMany({ where: { created_by: req.user.id } });
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
    const tarifBulanan = parseInt(settingsMap.tarif_bulanan) || 10000;

    const bulanMulai = Math.min(bulan_dari, bulan_sampai);
    const bulanAkhir = Math.max(bulan_dari, bulan_sampai);
    const bulanList = [];
    for (let b = bulanMulai; b <= bulanAkhir; b++) {
      bulanList.push(b);
    }

    for (const bulan of bulanList) {
      const existing = await prisma.iuranBulanan.findUnique({
        where: { warga_id_bulan_tahun: { warga_id: parseInt(warga_id), bulan, tahun: parseInt(tahun) } },
      });
      if (existing) {
        const bulanNama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][bulan - 1];
        return res.status(409).json({ message: `${bulanNama} ${tahun} sudah tercatat` });
      }
    }

    const created = [];

    for (const bulan of bulanList) {
      const status = parseFloat(jumlah_bayar) >= tarifBulanan ? 'Lunas' : 'Belum Lunas';
      const iuran = await prisma.iuranBulanan.create({
        data: {
          warga_id: parseInt(warga_id),
          bulan,
          tahun: parseInt(tahun),
          jumlah_bayar: parseFloat(jumlah_bayar),
          tanggal_bayar: new Date(tanggal_bayar),
          status,
          dicatat_oleh: req.user.id,
        },
        include: { warga: { select: { no_kartu: true, nama_kk: true } } },
      });
      created.push(iuran);
    }

    res.status(201).json({ created: created.length, message: `${created.length} bulan berhasil dicatat` });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const iuran = await prisma.iuranBulanan.findFirst({
      where: { id, warga: { created_by: req.user.id } },
    });
    if (!iuran) return res.status(404).json({ message: 'Data tidak ditemukan' });
    await prisma.iuranBulanan.delete({ where: { id } });
    res.json({ message: 'Pembayaran berhasil dihapus' });
  } catch (err) {
    next(err);
  }
}

async function rekapTahunan(req, res, next) {
  try {
    const tahun = parseInt(req.params.tahun) || new Date().getFullYear();

    const wargaList = await prisma.warga.findMany({
      where: { created_by: req.user.id },
      select: {
        id: true,
        no_kartu: true,
        nama_kk: true,
        iuran_bulanan: {
          where: { tahun },
          select: { bulan: true, jumlah_bayar: true, status: true },
        },
      },
      orderBy: { no_kartu: 'asc' },
    });

    const rekap = wargaList.map(w => {
      const bulanMap = {};
      for (let b = 1; b <= 12; b++) {
        bulanMap[b] = { status: null, jumlah_bayar: 0 };
      }
      w.iuran_bulanan.forEach(ib => {
        bulanMap[ib.bulan] = { status: ib.status, jumlah_bayar: parseFloat(ib.jumlah_bayar) };
      });
      const totalBayar = w.iuran_bulanan.reduce((sum, ib) => sum + parseFloat(ib.jumlah_bayar), 0);
      return {
        id: w.id,
        no_kartu: w.no_kartu,
        nama_kk: w.nama_kk,
        bulanan: bulanMap,
        total_bayar: totalBayar,
      };
    });

    res.json({ tahun, data: rekap });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, createBulk, remove, rekapTahunan };
