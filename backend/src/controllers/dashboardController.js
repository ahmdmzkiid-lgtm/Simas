const prisma = require('../utils/prisma');

async function getStats(req, res, next) {
  try {
    const tahun = new Date().getFullYear();
    const userId = req.user.id;

    const [totalWarga, totalIuranBulanan, totalIuranMakam] = await Promise.all([
      prisma.warga.count({ where: { created_by: userId } }),
      prisma.iuranBulanan.aggregate({ _sum: { jumlah_bayar: true }, where: { tahun, warga: { created_by: userId } } }),
      prisma.iuranMakam.aggregate({ _sum: { total_terbayar: true }, where: { warga: { created_by: userId } } }),
    ]);

    const totalTerbayarMakamVal = parseFloat(totalIuranMakam._sum.total_terbayar || 0);

    const totalIuranBulananVal = parseFloat(totalIuranBulanan._sum.jumlah_bayar || 0);
    const totalKas = totalIuranBulananVal + totalTerbayarMakamVal;

    let tunggakanBulanan = totalWarga * 10000 - totalIuranBulananVal;
    if (tunggakanBulanan < 0) tunggakanBulanan = 0;

    res.json({
      total_kas: totalKas,
      total_bulanan: totalIuranBulananVal,
      total_makam: totalTerbayarMakamVal,
      total_warga: totalWarga,
      tunggakan_bulanan: Math.max(0, tunggakanBulanan),
    });
  } catch (err) {
    next(err);
  }
}

async function getKolektibilitas(req, res, next) {
  try {
    const tahun = parseInt(req.query.tahun) || new Date().getFullYear();
    const userId = req.user.id;
    const totalWarga = await prisma.warga.count({ where: { created_by: userId } });
    const wargaDenganMakam = await prisma.iuranMakam.count({ where: { warga: { created_by: userId } } });

    const bulanData = [];
    for (let b = 1; b <= 12; b++) {
      const lunasBulanan = await prisma.iuranBulanan.count({ where: { bulan: b, tahun, status: 'Lunas', warga: { created_by: userId } } });

      const unikMakam = await prisma.iuranMakamBulanan.groupBy({
        by: ['iuran_makam_id'],
        where: { bulan: b, tahun, iuran_makam: { warga: { created_by: userId } } },
      });
      const bayarMakamBulan = unikMakam.length;

      bulanData.push({
        bulan: b,
        kolektibilitas_bulanan: totalWarga > 0 ? Math.round((lunasBulanan / totalWarga) * 100) : 0,
        kolektibilitas_makam: wargaDenganMakam > 0 ? Math.round((bayarMakamBulan / wargaDenganMakam) * 100) : 0,
      });
    }

    res.json({ tahun, data: bulanData });
  } catch (err) {
    next(err);
  }
}

async function getAktivitas(req, res, next) {
  try {
    const [makamBulananTerbaru, bayaranBulananTerbaru] = await Promise.all([
      prisma.iuranMakamBulanan.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        where: { iuran_makam: { warga: { created_by: req.user.id } } },
        include: {
          iuran_makam: { include: { warga: { select: { nama_kk: true, no_kartu: true } } } },
          user: { select: { nama_lengkap: true } },
        },
      }),
      prisma.iuranBulanan.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        where: { warga: { created_by: req.user.id } },
        include: {
          warga: { select: { nama_kk: true, no_kartu: true } },
          user: { select: { nama_lengkap: true } },
        },
      }),
    ]);

    const aktivitas = [
      ...makamBulananTerbaru.map(c => ({
        tipe: 'Iuran Makam',
        message: `${c.iuran_makam.warga.nama_kk} (${c.iuran_makam.warga.no_kartu}) - Bulan ${c.bulan}/${c.tahun} - Rp ${parseFloat(c.jumlah_bayar).toLocaleString()}`,
        user: c.user.nama_lengkap,
        tanggal: c.created_at,
      })),
      ...bayaranBulananTerbaru.map(b => ({
        tipe: 'Iuran Bulanan',
        message: `${b.warga.nama_kk} (${b.warga.no_kartu}) - Bulan ${b.bulan}/${b.tahun} - Rp ${parseFloat(b.jumlah_bayar).toLocaleString()}`,
        user: b.user.nama_lengkap,
        tanggal: b.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
      .slice(0, 20);

    res.json(aktivitas);
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats, getKolektibilitas, getAktivitas };
