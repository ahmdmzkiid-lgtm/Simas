const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 12);

  await prisma.users.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password_hash: adminPassword,
      nama_lengkap: 'Administrator',
      role: 'admin',
    },
  });

  await prisma.users.upsert({
    where: { username: 'pengurus' },
    update: {},
    create: {
      username: 'pengurus',
      password_hash: adminPassword,
      nama_lengkap: 'Pengurus RT',
      role: 'pengurus',
    },
  });

  const settings = [
    { key: 'tarif_bulanan', value: '10000' },
    { key: 'tarif_makam_per_jiwa', value: '10000' },
  ];

  for (const s of settings) {
    await prisma.settings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  const sampleWarga = [
    { no_kartu: '001', nama_kk: 'Budi Santoso', jumlah_jiwa: 4 },
    { no_kartu: '002', nama_kk: 'Siti Rahayu', jumlah_jiwa: 3 },
    { no_kartu: '003', nama_kk: 'Ahmad Fauzi', jumlah_jiwa: 5 },
    { no_kartu: '004', nama_kk: 'Dewi P.', jumlah_jiwa: 2 },
  ];

  for (const w of sampleWarga) {
    const existing = await prisma.warga.findUnique({ where: { no_kartu: w.no_kartu } });
    if (!existing) {
      const tagihanPerBulan = w.jumlah_jiwa * 10000;
      const totalTagihan = tagihanPerBulan * 36;
      await prisma.warga.create({
        data: {
          ...w,
          iuran_makam: {
            create: {
              total_tagihan: totalTagihan,
              tagihan_per_bulan: tagihanPerBulan,
              jangka_waktu: 36,
              total_terbayar: w.jumlah_jiwa === 4 ? 40000 : w.jumlah_jiwa === 3 ? 10000 : 0,
              status: w.jumlah_jiwa === 4 ? 'Lunas' : w.jumlah_jiwa === 3 ? 'Mencicil' : 'Belum Bayar',
            },
          },
        },
      });
    }
  }

  const [warga1] = await prisma.warga.findMany({ take: 1 });
  const [userAdmin] = await prisma.users.findMany({ take: 1 });

  if (warga1 && userAdmin) {
    for (let b = 1; b <= 6; b++) {
      const existing = await prisma.iuranBulanan.findUnique({
        where: { warga_id_bulan_tahun: { warga_id: warga1.id, bulan: b, tahun: 2026 } },
      });
      if (!existing) {
        await prisma.iuranBulanan.create({
          data: {
            warga_id: warga1.id,
            bulan: b,
            tahun: 2026,
            jumlah_bayar: 10000,
            tanggal_bayar: new Date(`2026-${String(b).padStart(2, '0')}-01`),
            status: 'Lunas',
            dicatat_oleh: userAdmin.id,
          },
        });
      }
    }
  }

  console.log('Seed data berhasil dibuat');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
