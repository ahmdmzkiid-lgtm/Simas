const prisma = require('../utils/prisma');

async function getAll(req, res, next) {
  try {
    let data = await prisma.iuranMakam.findMany({
      where: { warga: { created_by: req.user.id } },
      include: {
        warga: { select: { no_kartu: true, nama_kk: true, jumlah_jiwa: true } },
        bulanan: { orderBy: [{ tahun: 'asc' }, { bulan: 'asc' }] },
      },
    });
    data.sort((a, b) => parseInt(a.warga.no_kartu) - parseInt(b.warga.no_kartu));

    const result = data.map(m => ({
      ...m,
      total_tagihan: parseFloat(m.total_tagihan),
      total_terbayar: parseFloat(m.total_terbayar),
      tagihan_per_bulan: parseFloat(m.tagihan_per_bulan),
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function bayarBulanan(req, res, next) {
  try {
    const { warga_id, jumlah_bayar, tanggal_bayar } = req.body;

    if (!warga_id || !jumlah_bayar || !tanggal_bayar) {
      return res.status(422).json({ message: 'Semua field wajib diisi' });
    }
    if (jumlah_bayar <= 0) {
      return res.status(422).json({ message: 'Jumlah bayar harus lebih dari 0' });
    }

    const iuranMakam = await prisma.iuranMakam.findFirst({
      where: { warga_id: parseInt(warga_id), warga: { created_by: req.user.id } },
    });
    if (!iuranMakam) {
      return res.status(404).json({ message: 'Data iuran makam tidak ditemukan' });
    }

    const tglBayar = new Date(tanggal_bayar);
    const bulan = tglBayar.getMonth() + 1;
    const tahun = tglBayar.getFullYear();
    const bayar = parseFloat(jumlah_bayar);

    const existing = await prisma.iuranMakamBulanan.findUnique({
      where: { iuran_makam_id_bulan_tahun: { iuran_makam_id: iuranMakam.id, bulan, tahun } },
    });

    const totalTerbayar = parseFloat(iuranMakam.total_terbayar) + bayar;

    if (existing) {
      await Promise.all([
        prisma.iuranMakam.update({
          where: { id: iuranMakam.id },
          data: { total_terbayar: totalTerbayar },
        }),
        prisma.iuranMakamBulanan.update({
          where: { id: existing.id },
          data: {
            jumlah_bayar: { increment: bayar },
            tanggal_bayar: tglBayar,
          },
        }),
      ]);
    } else {
      await Promise.all([
        prisma.iuranMakam.update({
          where: { id: iuranMakam.id },
          data: { total_terbayar: totalTerbayar },
        }),
        prisma.iuranMakamBulanan.create({
          data: {
            iuran_makam_id: iuranMakam.id,
            bulan,
            tahun,
            jumlah_bayar: bayar,
            tanggal_bayar: tglBayar,
            dicatat_oleh: req.user.id,
          },
        }),
      ]);
    }

    res.status(201).json({
      message: 'Pembayaran iuran makam berhasil',
      total_terbayar: totalTerbayar,
    });
  } catch (err) {
    next(err);
  }
}

async function bayarBulananBulk(req, res, next) {
  try {
    const { warga_id, bulan_dari, bulan_sampai, tahun, jumlah_bayar, tanggal_bayar } = req.body;

    if (!warga_id || !bulan_dari || !bulan_sampai || !tahun || !jumlah_bayar || !tanggal_bayar) {
      return res.status(422).json({ message: 'Semua field wajib diisi' });
    }
    if (jumlah_bayar <= 0) {
      return res.status(422).json({ message: 'Jumlah bayar harus lebih dari 0' });
    }

    const iuranMakam = await prisma.iuranMakam.findFirst({
      where: { warga_id: parseInt(warga_id), warga: { created_by: req.user.id } },
    });
    if (!iuranMakam) {
      return res.status(404).json({ message: 'Data iuran makam tidak ditemukan' });
    }

    const tglBayar = new Date(tanggal_bayar);
    const bayar = parseFloat(jumlah_bayar);
    const bulanMulai = Math.min(bulan_dari, bulan_sampai);
    const bulanAkhir = Math.max(bulan_dari, bulan_sampai);

    for (let bulan = bulanMulai; bulan <= bulanAkhir; bulan++) {
      const existing = await prisma.iuranMakamBulanan.findUnique({
        where: { iuran_makam_id_bulan_tahun: { iuran_makam_id: iuranMakam.id, bulan, tahun: parseInt(tahun) } },
      });

      if (existing) {
        const bulanNama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][bulan - 1];
        return res.status(409).json({ message: `${bulanNama} ${tahun} sudah tercatat` });
      }
    }

    let totalTambah = 0;
    const created = [];

    for (let bulan = bulanMulai; bulan <= bulanAkhir; bulan++) {
      await prisma.iuranMakamBulanan.create({
        data: {
          iuran_makam_id: iuranMakam.id,
          bulan,
          tahun: parseInt(tahun),
          jumlah_bayar: bayar,
          tanggal_bayar: tglBayar,
          dicatat_oleh: req.user.id,
        },
      });
      totalTambah += bayar;
      created.push(bulan);
    }

    await prisma.iuranMakam.update({
      where: { id: iuranMakam.id },
      data: { total_terbayar: { increment: totalTambah } },
    });

    res.status(201).json({
      message: `${created.length} bulan berhasil dicatat`,
      total_terbayar: parseFloat(iuranMakam.total_terbayar) + totalTambah,
      created: created.length,
    });
  } catch (err) {
    next(err);
  }
}

async function hapusBulanan(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const bulanan = await prisma.iuranMakamBulanan.findFirst({
      where: { id, iuran_makam: { warga: { created_by: req.user.id } } },
    });
    if (!bulanan) return res.status(404).json({ message: 'Data tidak ditemukan' });

    await prisma.$transaction([
      prisma.iuranMakamBulanan.delete({ where: { id } }),
      prisma.iuranMakam.update({
        where: { id: bulanan.iuran_makam_id },
        data: { total_terbayar: { decrement: parseFloat(bulanan.jumlah_bayar) } },
      }),
    ]);

    res.json({ message: 'Pembayaran berhasil dihapus' });
  } catch (err) {
    next(err);
  }
}

async function rekapTahunan(req, res, next) {
  try {
    const tahun = parseInt(req.params.tahun) || new Date().getFullYear();
    const { search } = req.query;
    const where = { created_by: req.user.id };
    if (search) {
      where.OR = [
        { nama_kk: { contains: search, mode: 'insensitive' } },
        { no_kartu: { contains: search, mode: 'insensitive' } },
      ];
    }

    const wargaList = await prisma.warga.findMany({
      where,
      select: {
        id: true,
        no_kartu: true,
        nama_kk: true,
        jumlah_jiwa: true,
        iuran_makam: {
          select: {
            id: true,
            total_tagihan: true,
            tagihan_per_bulan: true,
            jangka_waktu: true,
            total_terbayar: true,
            bulanan: {
              where: { tahun },
              select: { bulan: true, jumlah_bayar: true },
            },
          },
        },
      },
    });
    wargaList.sort((a, b) => parseInt(a.no_kartu) - parseInt(b.no_kartu));

    const rekap = wargaList.map(w => {
      const bulanMap = {};
      for (let b = 1; b <= 12; b++) {
        bulanMap[b] = { jumlah_bayar: 0 };
      }

      const makam = w.iuran_makam;
      if (makam) {
        makam.bulanan.forEach(ib => {
          bulanMap[ib.bulan] = { jumlah_bayar: parseFloat(ib.jumlah_bayar) };
        });
      }

      const totalBayar = makam
        ? makam.bulanan.reduce((sum, ib) => sum + parseFloat(ib.jumlah_bayar), 0)
        : 0;

      return {
        id: w.id,
        no_kartu: w.no_kartu,
        nama_kk: w.nama_kk,
        jumlah_jiwa: w.jumlah_jiwa,
        iuran_makam: makam ? {
          id: makam.id,
          total_tagihan: parseFloat(makam.total_tagihan),
          tagihan_per_bulan: parseFloat(makam.tagihan_per_bulan),
          jangka_waktu: makam.jangka_waktu,
          total_terbayar: parseFloat(makam.total_terbayar),
        } : null,
        bulanan: bulanMap,
        total_bayar: totalBayar,
      };
    });

    res.json({ tahun, data: rekap });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, bayarBulanan, bayarBulananBulk, hapusBulanan, rekapTahunan };
