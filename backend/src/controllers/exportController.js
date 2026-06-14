const ExcelJS = require('exceljs');
const prisma = require('../utils/prisma');

const BULAN_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

async function exportIuranBulanan(req, res, next) {
  try {
    const tahun = parseInt(req.params.tahun) || new Date().getFullYear();
    const tglAwal = new Date(tahun, 0, 1);
    const tglAkhir = new Date(tahun, 11, 31);

    const wargaList = await prisma.warga.findMany({
      where: { created_by: req.user.id },
      include: {
        iuran_bulanan: { where: { tanggal_bayar: { gte: tglAwal, lte: tglAkhir } } },
      },
      orderBy: { nama_kk: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Rekap Bulanan ${tahun}`);

    sheet.mergeCells('A1:N1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Laporan Iuran Bulanan Warga — Periode ${tahun}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:N2');
    const infoCell = sheet.getCell('A2');
    infoCell.value = 'Laporan Iuran RT 05 / RW 03';
    infoCell.font = { size: 11, italic: true };
    infoCell.alignment = { horizontal: 'center' };

    const headerRow = sheet.getRow(4);
    const headers = ['No Kartu', 'Nama KK', ...BULAN_INDONESIA.map(b => b.substring(0, 3)), 'Total Bayar'];
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F6E56' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    let rowIndex = 5;
    const bulananSums = Array(12).fill(0);

    wargaList.forEach(w => {
      const row = sheet.getRow(rowIndex);
      const bulanBayar = {};
      w.iuran_bulanan.forEach(ib => {
        const bulanTgl = new Date(ib.tanggal_bayar).getMonth() + 1;
        bulanBayar[bulanTgl] = (bulanBayar[bulanTgl] || 0) + parseFloat(ib.jumlah_bayar);
      });

      row.getCell(1).value = w.no_kartu;
      row.getCell(1).font = { name: 'Consolas' };
      row.getCell(2).value = w.nama_kk;

      let totalBayar = 0;
      for (let b = 0; b < 12; b++) {
        const cell = row.getCell(b + 3);
        const bayar = bulanBayar[b + 1] || 0;
        if (bayar > 0) {
          cell.value = '✓ Lunas';
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE1F5EE' } };
          cell.font = { color: { argb: 'FF085041' }, bold: true };
        } else {
          cell.value = '-';
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
          cell.font = { color: { argb: 'FF999999' } };
        }
        cell.alignment = { horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        bulananSums[b] += bayar;
        totalBayar += bayar;
      }

      const totalCell = row.getCell(15);
      totalCell.value = totalBayar;
      totalCell.numFmt = 'Rp #,##0';
      totalCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      totalCell.alignment = { horizontal: 'right' };

      for (let c = 1; c <= 15; c++) {
        const cell = row.getCell(c);
        if (!cell.border) {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        }
      }

      rowIndex++;
    });

    const sumRow = sheet.getRow(rowIndex);
    sumRow.getCell(1).value = '';
    sumRow.getCell(2).value = 'TOTAL';
    sumRow.getCell(2).font = { bold: true };

    for (let b = 0; b < 12; b++) {
      const cell = sumRow.getCell(b + 3);
      cell.value = bulananSums[b];
      cell.numFmt = 'Rp #,##0';
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'right' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'double' },
        right: { style: 'thin' },
      };
    }

    const grandTotal = bulananSums.reduce((a, b) => a + b, 0);
    const grandTotalCell = sumRow.getCell(15);
    grandTotalCell.value = grandTotal;
    grandTotalCell.numFmt = 'Rp #,##0';
    grandTotalCell.font = { bold: true };
    grandTotalCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'double' },
      right: { style: 'thin' },
    };
    grandTotalCell.alignment = { horizontal: 'right' };

    sheet.columns.forEach(col => {
      col.width = col.header === 'Nama KK' ? 30 : 14;
    });

    sheet.views = [{ state: 'frozen', ySplit: 4 }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=rekap-iuran-bulanan-${tahun}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

async function exportIuranMakam(req, res, next) {
  try {
    const data = await prisma.iuranMakam.findMany({
      where: { warga: { created_by: req.user.id } },
      include: {
        warga: { select: { no_kartu: true, nama_kk: true, jumlah_jiwa: true } },
      },
      orderBy: { updated_at: 'desc' },
    });

    const bulanIni = BULAN_INDONESIA[new Date().getMonth()];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Pelunasan Makam');

    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Pembayaran Iuran Perluasan Makam - ${bulanIni}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:F2');
    const infoCell = sheet.getCell('A2');
    infoCell.value = 'Laporan Iuran RT 05 / RW 03';
    infoCell.font = { size: 11, italic: true };
    infoCell.alignment = { horizontal: 'center' };

    const headerRow = sheet.getRow(4);
    const headers = ['No Kartu', 'Nama KK', 'Jumlah Jiwa', 'Per Bulan', 'Total Tagihan (35 bln)', 'Total Terbayar'];
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F6E56' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    let rowIndex = 5;
    let totalTarget = 0;
    let totalTerbayar = 0;

    data.forEach(m => {
      const row = sheet.getRow(rowIndex);
      const tagihan = parseFloat(m.total_tagihan);
      const terbayar = parseFloat(m.total_terbayar);

      row.getCell(1).value = m.warga.no_kartu;
      row.getCell(1).font = { name: 'Consolas' };
      row.getCell(2).value = m.warga.nama_kk;
      row.getCell(3).value = m.warga.jumlah_jiwa;
      row.getCell(4).value = parseFloat(m.tagihan_per_bulan);
      row.getCell(4).numFmt = 'Rp #,##0';
      row.getCell(5).value = tagihan;
      row.getCell(5).numFmt = 'Rp #,##0';
      row.getCell(6).value = terbayar;
      row.getCell(6).numFmt = 'Rp #,##0';

      for (let c = 1; c <= 6; c++) {
        const cell = row.getCell(c);
        if (!cell.border) {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        }
        cell.alignment = cell.alignment || { vertical: 'middle' };
      }

      totalTarget += tagihan;
      totalTerbayar += terbayar;
      rowIndex++;
    });

    const sumRow = sheet.getRow(rowIndex);
    sumRow.getCell(1).value = '';
    sumRow.getCell(2).value = 'TOTAL';
    sumRow.getCell(2).font = { bold: true };
    sumRow.getCell(3).value = '';
    sumRow.getCell(4).value = totalTarget / 35;
    sumRow.getCell(4).numFmt = 'Rp #,##0';
    sumRow.getCell(4).font = { bold: true };
    sumRow.getCell(5).value = totalTarget;
    sumRow.getCell(5).numFmt = 'Rp #,##0';
    sumRow.getCell(5).font = { bold: true };
    sumRow.getCell(6).value = totalTerbayar;
    sumRow.getCell(6).numFmt = 'Rp #,##0';
    sumRow.getCell(6).font = { bold: true };

    for (let c = 1; c <= 6; c++) {
      const cell = sumRow.getCell(c);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'double' },
        right: { style: 'thin' },
      };
    }

    sheet.getColumn(1).width = 16;
    sheet.getColumn(2).width = 30;
    sheet.getColumn(3).width = 12;
    sheet.getColumn(4).width = 16;
    sheet.getColumn(5).width = 22;
    sheet.getColumn(6).width = 18;

    sheet.views = [{ state: 'frozen', ySplit: 4 }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=rekap-pelunasan-makam.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

async function downloadTemplateWarga(req, res, next) {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Template Warga');

    sheet.mergeCells('A1:C1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Template Import Data Warga';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:C2');
    const infoCell = sheet.getCell('A2');
    infoCell.value = 'Isi data sesuai format. No Kartu harus unik.';
    infoCell.font = { size: 11, italic: true, color: { argb: 'FF666666' } };
    infoCell.alignment = { horizontal: 'center' };

    const headerRow = sheet.getRow(4);
    const headers = ['NO KARTU', 'NAMA KEPALA KELUARGA', 'JUMLAH JIWA'];
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F6E56' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const sampleRow = sheet.getRow(5);
    sampleRow.getCell(1).value = '1234567890';
    sampleRow.getCell(1).font = { name: 'Consolas', color: { argb: 'FF999999' } };
    sampleRow.getCell(2).value = 'Contoh Nama Kepala Keluarga';
    sampleRow.getCell(2).font = { color: { argb: 'FF999999' }, italic: true };
    sampleRow.getCell(3).value = 4;
    sampleRow.getCell(3).font = { color: { argb: 'FF999999' }, italic: true };
    sampleRow.getCell(3).alignment = { horizontal: 'center' };

    for (let c = 1; c <= 3; c++) {
      sampleRow.getCell(c).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    }

    const sampleRow2 = sheet.getRow(6);
    sampleRow2.getCell(1).value = '(contoh — hapus sebelum impor)';
    sampleRow2.getCell(1).font = { color: { argb: 'FFCCCCCC' }, italic: true, size: 9 };
    sampleRow2.getCell(2).value = '';
    sampleRow2.getCell(3).value = '';

    sheet.getColumn(1).width = 18;
    sheet.getColumn(2).width = 35;
    sheet.getColumn(3).width = 14;

    sheet.views = [{ state: 'frozen', ySplit: 4 }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=template-import-warga.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

async function exportIuranMakamBulanan(req, res, next) {
  try {
    const tahun = parseInt(req.query.tahun) || new Date().getFullYear();
    const bulan = parseInt(req.query.bulan);
    if (!bulan || bulan < 1 || bulan > 12) {
      return res.status(422).json({ message: 'Bulan harus dipilih (1-12)' });
    }

    const namaBulan = BULAN_INDONESIA[bulan - 1];
    const tglAwal = new Date(tahun, bulan - 1, 1);
    const tglAkhir = new Date(tahun, bulan, 0);

    let wargaList = await prisma.warga.findMany({
      where: { created_by: req.user.id },
      include: {
        iuran_makam: {
          include: {
            bulanan: { where: { tanggal_bayar: { gte: tglAwal, lte: tglAkhir } } },
          },
        },
      },
    });

    const bayar = wargaList.filter(w => w.iuran_makam?.bulanan?.length > 0);
    const belumBayar = wargaList.filter(w => !w.iuran_makam?.bulanan?.length);
    bayar.sort((a, b) => {
      const aTgl = new Date(a.iuran_makam.bulanan[0].tanggal_bayar);
      const bTgl = new Date(b.iuran_makam.bulanan[0].tanggal_bayar);
      return bTgl - aTgl;
    });
    belumBayar.sort((a, b) => a.nama_kk.localeCompare(b.nama_kk));
    wargaList = [...bayar, ...belumBayar];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`${namaBulan} ${tahun}`);

    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Laporan Iuran Makam — ${namaBulan} ${tahun}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:F2');
    const infoCell = sheet.getCell('A2');
    infoCell.value = 'Pembayaran iuran makam per bulan';
    infoCell.font = { size: 11, italic: true };
    infoCell.alignment = { horizontal: 'center' };

    const headerRow = sheet.getRow(4);
    const headers = ['No Kartu', 'Nama KK', 'Jumlah Jiwa', 'Jumlah Bayar', 'Status', 'Tanggal Bayar'];
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F6E56' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    let rowIndex = 5;
    let totalBayarKeseluruhan = 0;

    wargaList.forEach(w => {
      const row = sheet.getRow(rowIndex);
      const makam = w.iuran_makam;
      const bayarBulanIni = makam && makam.bulanan.length > 0
        ? parseFloat(makam.bulanan[0].jumlah_bayar)
        : 0;

      row.getCell(1).value = w.no_kartu;
      row.getCell(1).font = { name: 'Consolas' };
      row.getCell(2).value = w.nama_kk;
      row.getCell(3).value = w.jumlah_jiwa;
      row.getCell(3).alignment = { horizontal: 'center' };

      if (bayarBulanIni > 0) {
        row.getCell(4).value = bayarBulanIni;
        row.getCell(4).numFmt = 'Rp #,##0';
        row.getCell(5).value = 'Dibayar';
        row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE1F5EE' } };
        row.getCell(5).font = { color: { argb: 'FF085041' }, bold: true };
        const tgl = makam.bulanan[0].tanggal_bayar;
        row.getCell(6).value = tgl ? new Date(tgl).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
      } else {
        row.getCell(4).value = '-';
        row.getCell(4).alignment = { horizontal: 'center' };
        row.getCell(5).value = 'Belum';
        row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
        row.getCell(5).font = { color: { argb: 'FF999999' } };
        row.getCell(6).value = '';
      }

      totalBayarKeseluruhan += bayarBulanIni;

      for (let c = 1; c <= 6; c++) {
        const cell = row.getCell(c);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = cell.alignment || { vertical: 'middle' };
      }

      rowIndex++;
    });

    const sumRow = sheet.getRow(rowIndex + 1);
    sumRow.getCell(1).value = '';
    sumRow.getCell(2).value = 'TOTAL';
    sumRow.getCell(2).font = { bold: true };
    sumRow.getCell(3).value = '';
    sumRow.getCell(4).value = totalBayarKeseluruhan;
    sumRow.getCell(4).numFmt = 'Rp #,##0';
    sumRow.getCell(4).font = { bold: true };
    sumRow.getCell(5).value = '';
    sumRow.getCell(5).font = { bold: true };

    for (let c = 1; c <= 6; c++) {
      sumRow.getCell(c).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'double' },
        right: { style: 'thin' },
      };
    }

    sheet.getColumn(1).width = 16;
    sheet.getColumn(2).width = 30;
    sheet.getColumn(3).width = 12;
    sheet.getColumn(4).width = 18;
    sheet.getColumn(5).width = 16;
    sheet.getColumn(6).width = 20;

    sheet.views = [{ state: 'frozen', ySplit: 4 }];

    const filename = `rekap-makam-${namaBulan.toLowerCase()}-${tahun}`.replace(/\s+/g, '-');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

async function getRiwayatPembayaran(req, res, next) {
  try {
    const { bulan, tahun, jenis, search } = req.query;
    const filterTahun = parseInt(tahun) || new Date().getFullYear();

    const tglAwal = bulan
      ? new Date(filterTahun, parseInt(bulan) - 1, 1)
      : new Date(filterTahun, 0, 1);
    const tglAkhir = bulan
      ? new Date(filterTahun, parseInt(bulan), 0)
      : new Date(filterTahun, 11, 31);

    const hasil = [];

    if (!jenis || jenis === 'bulanan') {
      const bulanan = await prisma.iuranBulanan.findMany({
        where: { tanggal_bayar: { gte: tglAwal, lte: tglAkhir }, warga: { created_by: req.user.id } },
        include: { warga: { select: { no_kartu: true, nama_kk: true } } },
        orderBy: { tanggal_bayar: 'desc' },
      });
      bulanan.forEach(b => {
        hasil.push({
          id: `b-${b.id}`,
          tanggal: b.tanggal_bayar,
          no_kartu: b.warga.no_kartu,
          nama_kk: b.warga.nama_kk,
          jenis: 'Iuran Bulanan',
          bulan: b.bulan,
          tahun: b.tahun,
          jumlah: parseFloat(b.jumlah_bayar),
          status: b.status,
        });
      });
    }

    if (!jenis || jenis === 'makam') {
      const makam = await prisma.iuranMakamBulanan.findMany({
        where: { tanggal_bayar: { gte: tglAwal, lte: tglAkhir }, iuran_makam: { warga: { created_by: req.user.id } } },
        include: {
          iuran_makam: {
          include: { warga: { select: { no_kartu: true, nama_kk: true, jumlah_jiwa: true } } },
          },
        },
        orderBy: { tanggal_bayar: 'desc' },
      });
      makam.forEach(m => {
        hasil.push({
          id: `m-${m.id}`,
          tanggal: m.tanggal_bayar,
          no_kartu: m.iuran_makam.warga.no_kartu,
          nama_kk: m.iuran_makam.warga.nama_kk,
          jenis: 'Iuran Makam',
          bulan: m.bulan,
          tahun: m.tahun,
          jumlah: parseFloat(m.jumlah_bayar),
          status: 'Dibayar',
        });
      });
    }

    let semua = hasil.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    if (search) {
      const q = search.toLowerCase();
      semua = semua.filter(item =>
        item.nama_kk.toLowerCase().includes(q) ||
        item.no_kartu.toLowerCase().includes(q)
      );
    }

    res.json(semua);
  } catch (err) {
    next(err);
  }
}

async function exportRekapGabungan(req, res, next) {
  try {
    const { bulan } = req.query;
    const tahun = parseInt(req.params.tahun) || new Date().getFullYear();
    const tglAwal = bulan
      ? new Date(tahun, parseInt(bulan) - 1, 1)
      : new Date(tahun, 0, 1);
    const tglAkhir = bulan
      ? new Date(tahun, parseInt(bulan), 0)
      : new Date(tahun, 11, 31);

    const bulanan = await prisma.iuranBulanan.findMany({
      where: { tanggal_bayar: { gte: tglAwal, lte: tglAkhir }, warga: { created_by: req.user.id } },
      include: { warga: { select: { no_kartu: true, nama_kk: true, jumlah_jiwa: true } } },
      orderBy: [{ tanggal_bayar: 'desc' }, { warga: { no_kartu: 'asc' } }],
    });

    const makam = await prisma.iuranMakamBulanan.findMany({
      where: { tanggal_bayar: { gte: tglAwal, lte: tglAkhir }, iuran_makam: { warga: { created_by: req.user.id } } },
      include: {
        iuran_makam: {
          include: { warga: { select: { no_kartu: true, nama_kk: true, jumlah_jiwa: true } } },
        },
      },
      orderBy: [{ tanggal_bayar: 'desc' }, { iuran_makam: { warga: { no_kartu: 'asc' } } }],
    });

    const semuaWarga = await prisma.warga.findMany({
      where: { created_by: req.user.id },
      select: { no_kartu: true, nama_kk: true, jumlah_jiwa: true },
    });

    const wargaWithPayment = new Set();
    for (const b of bulanan) wargaWithPayment.add(b.warga.no_kartu);
    for (const m of makam) wargaWithPayment.add(m.iuran_makam.warga.no_kartu);

    const group = {};
    for (const b of bulanan) {
      const k = `${b.warga_id}-${new Date(b.tanggal_bayar).toISOString().slice(0, 10)}`;
      if (!group[k]) {
        group[k] = { tanggal_bayar: b.tanggal_bayar, no_kartu: b.warga.no_kartu, nama_kk: b.warga.nama_kk, jumlah_jiwa: b.warga.jumlah_jiwa, bulanList: [], totalBulanan: 0, totalMakam: 0 };
      }
      group[k].bulanList.push({ index: b.bulan, name: `[Bulanan] ${BULAN_INDONESIA[b.bulan - 1]}` });
      group[k].totalBulanan += parseFloat(b.jumlah_bayar);
    }
    for (const m of makam) {
      const k = `${m.iuran_makam.warga_id}-${new Date(m.tanggal_bayar).toISOString().slice(0, 10)}`;
      if (!group[k]) {
        group[k] = { tanggal_bayar: m.tanggal_bayar, no_kartu: m.iuran_makam.warga.no_kartu, nama_kk: m.iuran_makam.warga.nama_kk, jumlah_jiwa: m.iuran_makam.warga.jumlah_jiwa, bulanList: [], totalBulanan: 0, totalMakam: 0 };
      }
      group[k].bulanList.push({ index: m.bulan, name: `[Makam] ${BULAN_INDONESIA[m.bulan - 1]}` });
      group[k].totalMakam += parseFloat(m.jumlah_bayar);
    }

    const paidRows = Object.values(group).sort((a, b) => new Date(b.tanggal_bayar) - new Date(a.tanggal_bayar));
    const unpaidRows = semuaWarga
      .filter(w => !wargaWithPayment.has(w.no_kartu))
      .sort((a, b) => a.nama_kk.localeCompare(b.nama_kk))
      .map(w => ({ no_kartu: w.no_kartu, nama_kk: w.nama_kk, jumlah_jiwa: w.jumlah_jiwa, belumBayar: true }));
    const allRows = [...paidRows, ...unpaidRows];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Rekap Gabungan ${tahun}`);

    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    const gabungBulanLabel = bulan ? BULAN_INDONESIA[parseInt(bulan) - 1] : 'Semua';
    titleCell.value = `Rekap Gabungan Iuran — ${gabungBulanLabel} ${tahun}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:H2');
    const infoCell = sheet.getCell('A2');
    infoCell.value = `Iuran Makam & Iuran Bulanan ${gabungBulanLabel} ${tahun}`;
    infoCell.font = { size: 11, italic: true, color: { argb: 'FF666666' } };
    infoCell.alignment = { horizontal: 'center' };

    const headerRow = sheet.getRow(4);
    const headers = ['Tanggal Bayar', 'No Kartu', 'Nama KK', 'Jumlah Jiwa', 'Untuk Bulan', 'Jml Iuran Bulanan', 'Jml Iuran Makam', 'Grand Total'];
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F6E56' } };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    let rowIndex = 5;
    let grandTotal = 0;

    for (const r of allRows) {
      const row = sheet.getRow(rowIndex);

      if (r.belumBayar) {
        row.getCell(1).value = '-';
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(2).value = r.no_kartu;
        row.getCell(2).font = { name: 'Consolas' };
        row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(3).value = r.nama_kk;
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(4).value = r.jumlah_jiwa;
        row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(5).value = 'Belum bayar';
        row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
        row.getCell(5).font = { color: { argb: 'FF999999' }, italic: true };
        row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(6).value = 0;
        row.getCell(6).numFmt = 'Rp #,##0';
        row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(7).value = 0;
        row.getCell(7).numFmt = 'Rp #,##0';
        row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(8).value = 0;
        row.getCell(8).numFmt = 'Rp #,##0';
        row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        row.getCell(1).value = new Date(r.tanggal_bayar).toLocaleDateString('id-ID');
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(2).value = r.no_kartu;
        row.getCell(2).font = { name: 'Consolas' };
        row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(3).value = r.nama_kk;
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        const sortBulan = (a, b) => {
          const aIsMakam = a.name.startsWith('[Makam]') ? 0 : 1;
          const bIsMakam = b.name.startsWith('[Makam]') ? 0 : 1;
          if (aIsMakam !== bIsMakam) return aIsMakam - bIsMakam;
          return a.index - b.index;
        };
        row.getCell(4).value = r.jumlah_jiwa;
        row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(5).value = r.bulanList.sort(sortBulan).map(b => b.name).join(', ');
        row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        row.getCell(6).value = r.totalBulanan;
        row.getCell(6).numFmt = 'Rp #,##0';
        row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(7).value = r.totalMakam;
        row.getCell(7).numFmt = 'Rp #,##0';
        row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(8).value = r.totalBulanan + r.totalMakam;
        row.getCell(8).numFmt = 'Rp #,##0';
        row.getCell(8).font = { bold: true };
        row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };

        grandTotal += r.totalBulanan + r.totalMakam;
      }

      for (let c = 1; c <= 8; c++) {
        const cell = row.getCell(c);
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' },
        };
        cell.alignment = cell.alignment || { horizontal: 'center', vertical: 'middle' };
      }

      rowIndex++;
    }

    const sumRow = sheet.getRow(rowIndex + 1);
    sumRow.getCell(1).value = '';
    sumRow.getCell(2).value = '';
    sumRow.getCell(3).value = '';
    sumRow.getCell(4).value = '';
    sumRow.getCell(5).value = '';
    sumRow.getCell(6).value = 'GRAND TOTAL';
    sumRow.getCell(6).font = { bold: true };
    sumRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
    sumRow.getCell(7).value = '';
    sumRow.getCell(8).value = grandTotal;
    sumRow.getCell(8).numFmt = 'Rp #,##0';
    sumRow.getCell(8).font = { bold: true };
    sumRow.getCell(8).alignment = { vertical: 'middle' };

    for (let c = 1; c <= 8; c++) {
      sumRow.getCell(c).border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'double' }, right: { style: 'thin' },
      };
    }

    sheet.getColumn(1).width = 16;
    sheet.getColumn(2).width = 16;
    sheet.getColumn(3).width = 28;
    sheet.getColumn(4).width = 12;
    sheet.getColumn(5).width = 50;
    sheet.getColumn(6).width = 18;
    sheet.getColumn(7).width = 18;
    sheet.getColumn(8).width = 18;

    sheet.views = [{ state: 'frozen', ySplit: 4 }];

    const bulanLabel = bulan ? BULAN_INDONESIA[parseInt(bulan) - 1].toLowerCase() : 'semua';
    res.setHeader('Content-Disposition', `attachment; filename=rekap-gabungan-${bulanLabel}-${tahun}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

async function exportDetailPembayaran(req, res, next) {
  try {
    const { bulan, tahun } = req.query;
    const filterTahun = parseInt(tahun) || new Date().getFullYear();

    const tglAwal = bulan
      ? new Date(filterTahun, parseInt(bulan) - 1, 1)
      : new Date(filterTahun, 0, 1);
    const tglAkhir = bulan
      ? new Date(filterTahun, parseInt(bulan), 0)
      : new Date(filterTahun, 11, 31);

    let wargaList = await prisma.warga.findMany({
      where: { created_by: req.user.id },
      include: {
        iuran_makam: {
          include: {
            bulanan: { where: { tanggal_bayar: { gte: tglAwal, lte: tglAkhir } } },
          },
        },
      },
    });

    const bayar = wargaList.filter(w => w.iuran_makam?.bulanan?.length > 0);
    const belumBayar = wargaList.filter(w => !w.iuran_makam?.bulanan?.length);
    bayar.sort((a, b) => {
      const aTgl = new Date(a.iuran_makam.bulanan[0].tanggal_bayar);
      const bTgl = new Date(b.iuran_makam.bulanan[0].tanggal_bayar);
      return bTgl - aTgl;
    });
    belumBayar.sort((a, b) => a.nama_kk.localeCompare(b.nama_kk));
    wargaList = [...bayar, ...belumBayar];

    const allRows = [];
    for (const w of bayar) {
      const makamGroup = {};
      for (const m of w.iuran_makam.bulanan) {
        const k = `${w.id}-${new Date(m.tanggal_bayar).toISOString().slice(0, 10)}`;
        if (!makamGroup[k]) {
          makamGroup[k] = { tanggal_bayar: m.tanggal_bayar, no_kartu: w.no_kartu, nama_kk: w.nama_kk, jumlah_jiwa: w.jumlah_jiwa, bulanList: [], total: 0 };
        }
        makamGroup[k].bulanList.push({ index: m.bulan, name: BULAN_INDONESIA[m.bulan - 1] });
        makamGroup[k].total += parseFloat(m.jumlah_bayar);
      }
      for (const v of Object.values(makamGroup)) {
        allRows.push(v);
      }
    }
    allRows.sort((a, b) => new Date(b.tanggal_bayar) - new Date(a.tanggal_bayar));

    for (const w of belumBayar) {
      allRows.push({ no_kartu: w.no_kartu, nama_kk: w.nama_kk, jumlah_jiwa: w.jumlah_jiwa, belumBayar: true });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Detail Pembayaran');

    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Pembayaran Iuran Perluasan Makam — ${bulan ? BULAN_INDONESIA[parseInt(bulan) - 1] : 'Tahun'} ${filterTahun}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    const now = new Date();
    const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const tgl = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

    sheet.mergeCells('A2:F2');
    const infoCell = sheet.getCell('A2');
    infoCell.value = `Laporan diexport ${jam} - ${tgl}`;
    infoCell.font = { size: 11, italic: true, color: { argb: 'FF666666' } };
    infoCell.alignment = { horizontal: 'center' };

    const headerRow = sheet.getRow(4);
    const headers = ['Tanggal Bayar', 'No Kartu', 'Nama KK', 'Jumlah Jiwa', 'Untuk Bulan', 'Jumlah Bayar'];
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F6E56' } };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    let rowIndex = 5;
    let grandTotal = 0;

    for (const r of allRows) {
      const row = sheet.getRow(rowIndex);

      if (r.belumBayar) {
        row.getCell(1).value = '-';
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(2).value = r.no_kartu;
        row.getCell(2).font = { name: 'Consolas' };
        row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(3).value = r.nama_kk;
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(4).value = r.jumlah_jiwa;
        row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(5).value = 'Belum bayar';
        row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
        row.getCell(5).font = { color: { argb: 'FF999999' }, italic: true };
        row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(6).value = 0;
        row.getCell(6).numFmt = 'Rp #,##0';
        row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        row.getCell(1).value = new Date(r.tanggal_bayar).toLocaleDateString('id-ID');
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(2).value = r.no_kartu;
        row.getCell(2).font = { name: 'Consolas' };
        row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(3).value = r.nama_kk;
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(4).value = r.jumlah_jiwa;
        row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(5).value = r.bulanList.sort((a, b) => a.index - b.index).map(b => b.name).join(', ');
        row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        row.getCell(6).value = r.total;
        row.getCell(6).numFmt = 'Rp #,##0';
        row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };

        grandTotal += r.total;
      }

      for (let c = 1; c <= 6; c++) {
        const cell = row.getCell(c);
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' },
        };
        cell.alignment = cell.alignment || { horizontal: 'center', vertical: 'middle' };
      }

      rowIndex++;
    }

    const sumRow = sheet.getRow(rowIndex + 1);
    sumRow.getCell(1).value = '';
    sumRow.getCell(2).value = '';
    sumRow.getCell(3).value = '';
    sumRow.getCell(4).value = '';
    sumRow.getCell(5).value = 'GRAND TOTAL';
    sumRow.getCell(5).font = { bold: true };
    sumRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
    sumRow.getCell(6).value = grandTotal;
    sumRow.getCell(6).numFmt = 'Rp #,##0';
    sumRow.getCell(6).font = { bold: true };
    sumRow.getCell(6).alignment = { vertical: 'middle' };

    for (let c = 1; c <= 6; c++) {
      sumRow.getCell(c).border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'double' }, right: { style: 'thin' },
      };
    }

    sheet.getColumn(1).width = 16;
    sheet.getColumn(2).width = 16;
    sheet.getColumn(3).width = 28;
    sheet.getColumn(4).width = 12;
    sheet.getColumn(5).width = 50;
    sheet.getColumn(6).width = 18;

    sheet.views = [{ state: 'frozen', ySplit: 4 }];

    const bulanLabel = bulan ? BULAN_INDONESIA[parseInt(bulan) - 1].toLowerCase() : 'semua';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=rekap-iuranperluasan-${bulanLabel}-${filterTahun}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { exportIuranBulanan, exportIuranMakam, exportIuranMakamBulanan, downloadTemplateWarga, exportRekapGabungan, exportDetailPembayaran, getRiwayatPembayaran };
