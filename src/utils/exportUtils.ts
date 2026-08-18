import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ScheduleItem, Team, ReportConfig, BackupData } from '../types';
import { formatDateIndo } from './scheduleGenerator';

export function exportScheduleToExcel(schedules: ScheduleItem[], filename?: string) {
  if (!schedules || schedules.length === 0) {
    throw new Error('Tidak ada data jadwal untuk diekspor!');
  }

  const excelRows = schedules.map((row, index) => ({
    'No': index + 1,
    'Tanggal': row.tanggal,
    'Hari': row.hari,
    'Kode Tim': row.timKode,
    'Nama Petugas 1': row.petugas1,
    'Nama Petugas 2': row.petugas2,
    'Desa': row.desa,
    'Periode': row.periode,
    'Siklus': row.siklus,
    'Status': row.status || 'terjadwal',
    'Keterangan': row.keterangan || ''
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelRows);

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // Tanggal
    { wch: 10 }, // Hari
    { wch: 10 }, // Kode Tim
    { wch: 30 }, // Petugas 1
    { wch: 30 }, // Petugas 2
    { wch: 22 }, // Desa
    { wch: 10 }, // Periode
    { wch: 10 }, // Siklus
    { wch: 14 }, // Status
    { wch: 25 }  // Keterangan
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Jadwal SAMTUL');
  const finalName = filename || `Jadwal_SAMTUL_Desa_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, finalName);
}

export function exportStatsToExcel(
  statsData: {
    kode: string;
    p1: string;
    p2: string;
    total: number;
    persen: string;
  }[],
  totalTugas: number,
  filename?: string
) {
  if (!statsData || statsData.length === 0) {
    throw new Error('Tidak ada data statistik untuk diekspor!');
  }

  const rows = statsData.map((s, idx) => ({
    'No': idx + 1,
    'Tim': s.kode,
    'Nama Petugas 1': s.p1,
    'Nama Petugas 2': s.p2,
    'Jumlah Tugas': s.total,
    'Persentase Kontribusi': s.persen
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 32 },
    { wch: 32 },
    { wch: 16 },
    { wch: 22 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Statistik Petugas');
  const finalName = filename || `Rekap_Statistik_SAMTUL_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, finalName);
}

export function exportScheduleToPDF(
  schedules: ScheduleItem[],
  reportConfig: ReportConfig,
  tglMulai: string,
  tglAkhir: string,
  filterInfo?: string
) {
  if (!schedules || schedules.length === 0) {
    throw new Error('Tidak ada data jadwal untuk diekspor ke PDF!');
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  let startY = 14;

  if (reportConfig.tampilkanKop) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(26, 58, 92);
    doc.text(reportConfig.kopInstansi1, pageWidth / 2, startY, { align: 'center' });
    startY += 6;

    doc.setFontSize(12);
    doc.text(reportConfig.kopInstansi2, pageWidth / 2, startY, { align: 'center' });
    startY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(reportConfig.kopAlamat + ' | ' + reportConfig.kopKontak, pageWidth / 2, startY, { align: 'center' });
    startY += 4;

    doc.setDrawColor(26, 58, 92);
    doc.setLineWidth(0.7);
    doc.line(14, startY, pageWidth - 14, startY);
    doc.setLineWidth(0.2);
    doc.line(14, startY + 1, pageWidth - 14, startY + 1);
    startY += 8;
  } else {
    startY += 4;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(26, 58, 92);
  doc.text(reportConfig.judulLaporan, pageWidth / 2, startY, { align: 'center' });
  startY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const infoText = `Rentang Jadwal: ${formatDateIndo(tglMulai)} s.d. ${formatDateIndo(tglAkhir)} | Total Baris: ${schedules.length}${filterInfo ? ` | Filter: ${filterInfo}` : ''}`;
  doc.text(infoText, pageWidth / 2, startY, { align: 'center' });
  startY += 6;

  const tableBody = schedules.map((item, idx) => [
    idx + 1,
    item.tanggal,
    item.hari,
    item.timKode,
    `${item.petugas1}\n${item.petugas2}`,
    item.desa,
    `P-${item.periode}`,
    `Siklus ${item.siklus}`,
    item.status || 'terjadwal'
  ]);

  (doc as any).autoTable({
    head: [['No', 'Tanggal', 'Hari', 'Tim', 'Nama Petugas', 'Desa Tugas', 'Periode', 'Siklus', 'Status']],
    body: tableBody,
    startY: startY,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, lineColor: [220, 225, 235], lineWidth: 0.1 },
    headStyles: { fillColor: [26, 58, 92], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: [248, 250, 255] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 65 },
      5: { cellWidth: 35 },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 16, halign: 'center' },
      8: { cellWidth: 18, halign: 'center' }
    },
    didDrawPage: function (data: any) {
      doc.setFontSize(6);
      doc.setTextColor(140);
      const str = `Halaman ${data.pageNumber} dari ${doc.internal.pages.length - 1} | Dicetak otomatis melalui Sistem Jadwal SAMTUL Desa`;
      doc.text(str, pageWidth - 14, doc.internal.pageSize.getHeight() - 6, { align: 'right' });
    }
  });

  if (reportConfig.tampilkanTtd) {
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    if (finalY < doc.internal.pageSize.getHeight() - 40) {
      const ttdX = pageWidth - 70;
      doc.setFontSize(8);
      doc.setTextColor(40);
      doc.text(`${reportConfig.tempatTtd}, ${formatDateIndo(reportConfig.tanggalTtd)}`, ttdX, finalY);
      doc.text(reportConfig.jabatanPenandatangan, ttdX, finalY + 4);
      doc.setFont('helvetica', 'bold');
      doc.text(reportConfig.namaPenandatangan, ttdX, finalY + 22);
      doc.setFont('helvetica', 'normal');
      doc.text(`NIP. ${reportConfig.nipPenandatangan}`, ttdX, finalY + 26);
    }
  }

  doc.save(`Jadwal_SAMTUL_Desa_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function downloadJSONFile(payload: BackupData, filename?: string) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename || `SAMTUL_Backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
