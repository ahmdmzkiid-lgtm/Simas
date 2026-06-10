const ExcelJS = require('exceljs');
const fs = require('fs');
const prisma = require('../utils/prisma');

async function processImport(filePath, mode, tarifMakam, tarifBulanan, created_by) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const no_kartu = String(row.getCell(1).value || '').trim();
    const nama_kk = String(row.getCell(2).value || '').trim();
    const jumlah_jiwa = parseInt(row.getCell(3).value);

    if (!no_kartu) return;

    if (isNaN(jumlah_jiwa) || jumlah_jiwa <= 0) {
      rows.push({ no_kartu, nama_kk, jumlah_jiwa, status: 'ditolak', alasan: 'Jumlah jiwa tidak valid' });
      return;
    }

    rows.push({ no_kartu, nama_kk, jumlah_jiwa, status: 'diproses' });
  });

  let imported = 0;
  let skipped = 0;
  let overwritten = 0;
  let rejected = 0;
  const errors = [];

  for (const row of rows) {
    if (row.status === 'ditolak') {
      rejected++;
      errors.push({ baris: row.no_kartu, alasan: row.alasan });
      continue;
    }

    const existing = await prisma.warga.findUnique({
      where: { no_kartu: row.no_kartu },
      include: { iuran_makam: true },
    });

    if (!existing) {
      const tagihanPerBulan = row.jumlah_jiwa * tarifMakam;
      const totalTagihan = tagihanPerBulan * 36;
      await prisma.warga.create({
        data: {
          no_kartu: row.no_kartu,
          nama_kk: row.nama_kk,
          jumlah_jiwa: row.jumlah_jiwa,
          created_by,
          iuran_makam: {
            create: {
              total_tagihan: totalTagihan,
              tagihan_per_bulan: tagihanPerBulan,
              jangka_waktu: 36,
              total_terbayar: 0,
            },
          },
        },
      });
      imported++;
    } else if (mode === 'overwrite') {
      const tagihanLama = parseFloat(existing.iuran_makam?.total_tagihan || 0);
      const tagihanPerBulanBaru = row.jumlah_jiwa * tarifMakam;
      const tagihanBaru = tagihanPerBulanBaru * 36;
      await prisma.warga.update({
        where: { no_kartu: row.no_kartu },
        data: {
          nama_kk: row.nama_kk,
          jumlah_jiwa: row.jumlah_jiwa,
          iuran_makam: {
            update: {
              total_tagihan: tagihanBaru,
              tagihan_per_bulan: tagihanPerBulanBaru,
            },
          },
        },
      });

      if (existing.iuran_makam && parseFloat(existing.iuran_makam.total_terbayar) > tagihanBaru) {
        errors.push({
          baris: row.no_kartu,
          alasan: `Total terbayar (${existing.iuran_makam.total_terbayar}) melebihi tagihan baru (${tagihanBaru}). Perlu review manual.`,
        });
      }

      overwritten++;
    } else {
      skipped++;
    }
  }

  try {
    fs.unlinkSync(filePath);
  } catch (e) {}

  return {
    imported,
    overwritten,
    skipped,
    rejected,
    total: rows.length,
    errors,
  };
}

module.exports = { processImport };
