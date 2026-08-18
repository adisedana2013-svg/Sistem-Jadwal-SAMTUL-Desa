import * as XLSX from 'xlsx';
import { ScheduleItem, Team, DutyStatus, ReportConfig } from '../types';
import { HARI_INDONESIA, BULAN_INDONESIA } from '../constants/initialData';
import { formatDateDDMMYYYY, formatDateYYYYMMDD, parseDate } from './scheduleGenerator';

export interface ParsedScheduleResult {
  schedules: ScheduleItem[];
  newTeams: Team[];
  newVillages: string[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  dateRange: { min: string; max: string };
  errors: string[];
  warnings: string[];
  detectedColumns: { [key: string]: string };
}

export interface ParsedTeamResult {
  teams: Team[];
  totalRows: number;
  validRows: number;
  errors: string[];
}

export interface ParsedVillageResult {
  villages: string[];
  totalRows: number;
  validRows: number;
  errors: string[];
}

// Convert diverse date values from Excel into standard formats without timezone shifts
export function parseExcelDate(val: any): {
  valid: boolean;
  tanggalRaw: string; // YYYY-MM-DD
  tanggal: string;    // DD/MM/YYYY
  hari: string;       // SENIN, SELASA, etc.
} {
  if (val === undefined || val === null || val === '') {
    return { valid: false, tanggalRaw: '', tanggal: '', hari: '' };
  }

  let year: number | null = null;
  let month: number | null = null; // 0-indexed (0 = Jan, 7 = Aug)
  let day: number | null = null;

  // 1. Numeric Excel Date Serial Code (e.g. 46254 for 20/08/2026)
  if (typeof val === 'number' && !isNaN(val)) {
    if (val > 0) {
      try {
        const parsedSSF = XLSX.SSF.parse_date_code(val);
        if (parsedSSF && parsedSSF.y && parsedSSF.m && parsedSSF.d) {
          year = parsedSSF.y;
          month = parsedSSF.m - 1;
          day = parsedSSF.d;
        }
      } catch {
        // Fallback calculation for Excel serial number
        const dateParsed = new Date(Math.round((val - 25569) * 86400 * 1000));
        if (!isNaN(dateParsed.getTime())) {
          year = dateParsed.getFullYear();
          month = dateParsed.getMonth();
          day = dateParsed.getDate();
        }
      }
    }
  }
  // 2. Date Object instance
  else if (val instanceof Date && !isNaN(val.getTime())) {
    // Check if created as local midnight or UTC midnight
    if (val.getHours() === 0) {
      year = val.getFullYear();
      month = val.getMonth();
      day = val.getDate();
    } else if (val.getUTCHours() === 0) {
      year = val.getUTCFullYear();
      month = val.getUTCMonth();
      day = val.getUTCDate();
    } else {
      // In timezone UTC+7/+8, local midnight corresponds to UTC 16:00/17:00 of previous day
      // In local time, getFullYear/getMonth/getDate is the true intended calendar date
      year = val.getFullYear();
      month = val.getMonth();
      day = val.getDate();
    }
  }
  // 3. String values
  else if (typeof val === 'string') {
    const cleanStr = val.trim();

    // Check DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const ddmmyyyy = cleanStr.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
    if (ddmmyyyy) {
      day = parseInt(ddmmyyyy[1], 10);
      month = parseInt(ddmmyyyy[2], 10) - 1;
      year = parseInt(ddmmyyyy[3], 10);
    } else {
      // Check YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
      const yyyymmdd = cleanStr.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
      if (yyyymmdd) {
        year = parseInt(yyyymmdd[1], 10);
        month = parseInt(yyyymmdd[2], 10) - 1;
        day = parseInt(yyyymmdd[3], 10);
      } else {
        // Try text format like '20 Agustus 2026' or '20-Agustus-2026'
        const parts = cleanStr.split(/[\s,\-_]+/);
        if (parts.length >= 3) {
          const dPart = parseInt(parts[0], 10);
          const monthName = parts[1].toLowerCase();
          const yPart = parseInt(parts[2], 10);
          const monthIdx = BULAN_INDONESIA.findIndex(
            (b) => b.toLowerCase() === monthName || b.toLowerCase().startsWith(monthName.substring(0, 3))
          );
          if (!isNaN(dPart) && monthIdx !== -1 && !isNaN(yPart)) {
            day = dPart;
            month = monthIdx;
            year = yPart;
          }
        }
      }
    }

    if (year === null || month === null || day === null) {
      const fallback = new Date(cleanStr);
      if (!isNaN(fallback.getTime())) {
        year = fallback.getFullYear();
        month = fallback.getMonth();
        day = fallback.getDate();
      }
    }
  }

  if (year !== null && month !== null && day !== null && !isNaN(year) && !isNaN(month) && !isNaN(day)) {
    // Construct local Date at noon (12:00:00) to ensure zero timezone border collision
    const d = new Date(year, month, day, 12, 0, 0);
    if (!isNaN(d.getTime())) {
      const raw = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const formatted = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
      const dayOfWeek = d.getDay();
      const hari = HARI_INDONESIA[dayOfWeek] || '';
      return { valid: true, tanggalRaw: raw, tanggal: formatted, hari };
    }
  }

  return { valid: false, tanggalRaw: '', tanggal: '', hari: '' };
}

// Clean and normalize column names for fuzzy header matching
function normalizeHeaderName(name: string): string {
  return (name || '')
    .toString()
    .toLowerCase()
    .replace(/[_\-./\\()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Read raw file buffer into XLSX Workbook
export async function readExcelWorkbook(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: false,
          cellNF: false,
          cellText: false
        });
        resolve(workbook);
      } catch (err: any) {
        reject(new Error(`Gagal membaca berkas Excel: ${err.message || 'Format tidak didukung'}`));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas file dari komputer.'));
    reader.readAsArrayBuffer(file);
  });
}

// Parse Schedule sheet from worksheet
export function parseScheduleWorksheet(
  ws: XLSX.WorkSheet,
  existingTeams: Team[] = [],
  existingVillages: string[] = []
): ParsedScheduleResult {
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (!rows || rows.length === 0) {
    return {
      schedules: [],
      newTeams: [],
      newVillages: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      dateRange: { min: '', max: '' },
      errors: ['Lembar kerja Excel kosong atau tidak memiliki data.'],
      warnings: [],
      detectedColumns: {}
    };
  }

  // Find the header row by searching for keywords like 'tanggal', 'date', 'desa', 'tim'
  let headerRowIndex = -1;
  let colMap: { [key: string]: number } = {};

  for (let r = 0; r < Math.min(10, rows.length); r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;

    const tempMap: { [key: string]: number } = {};
    let score = 0;

    row.forEach((cell, cIdx) => {
      const norm = normalizeHeaderName(cell);
      if (!norm) return;

      if (/^(no|nomor|idx)$/.test(norm)) tempMap['no'] = cIdx;
      else if (/(tanggal|tgl|date|waktu)/.test(norm)) { tempMap['tanggal'] = cIdx; score += 3; }
      else if (/(hari|day)/.test(norm)) { tempMap['hari'] = cIdx; score += 2; }
      else if (/(kode tim|tim|team|tim kode|kode)/.test(norm) && !/petugas/.test(norm)) { tempMap['timKode'] = cIdx; score += 3; }
      else if (/(petugas 1|petugas1|p1|nama petugas 1|anggota 1|petugas pertama)/.test(norm)) { tempMap['petugas1'] = cIdx; score += 2; }
      else if (/(petugas 2|petugas2|p2|nama petugas 2|anggota 2|petugas kedua)/.test(norm)) { tempMap['petugas2'] = cIdx; score += 2; }
      else if (/(nama petugas|petugas|anggota)/.test(norm) && tempMap['petugas1'] === undefined) { tempMap['petugas1'] = cIdx; score += 1; }
      else if (/(desa|wilayah|kelurahan|lokasi|desa tugas)/.test(norm)) { tempMap['desa'] = cIdx; score += 3; }
      else if (/(periode|period|tahap)/.test(norm)) tempMap['periode'] = cIdx;
      else if (/(siklus|cycle|putaran)/.test(norm)) tempMap['siklus'] = cIdx;
      else if (/(status|kondisi)/.test(norm)) tempMap['status'] = cIdx;
      else if (/(keterangan|catatan|notes|ket)/.test(norm)) tempMap['keterangan'] = cIdx;
    });

    if (score >= 4 || (tempMap['tanggal'] !== undefined && (tempMap['timKode'] !== undefined || tempMap['desa'] !== undefined))) {
      headerRowIndex = r;
      colMap = tempMap;
      break;
    }
  }

  // Fallback if no header recognized: assume columns order No, Tanggal, Hari, Tim, P1, P2, Desa
  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    colMap = {
      tanggal: 1,
      hari: 2,
      timKode: 3,
      petugas1: 4,
      petugas2: 5,
      desa: 6,
      periode: 7,
      siklus: 8,
      status: 9,
      keterangan: 10
    };
  }

  const detectedColumns: { [key: string]: string } = {};
  Object.keys(colMap).forEach((k) => {
    const cIdx = colMap[k];
    const originalHeader = rows[headerRowIndex]?.[cIdx] || `Kolom ${cIdx + 1}`;
    detectedColumns[k] = `${originalHeader} (Kolom #${cIdx + 1})`;
  });

  const schedules: ScheduleItem[] = [];
  const discoveredTeams = new Map<string, { p1: string; p2: string }>();
  const discoveredVillages = new Set<string>();
  const errors: string[] = [];
  const warnings: string[] = [];

  let minDate = '';
  let maxDate = '';
  let validCount = 0;
  let invalidCount = 0;

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0 || row.every((c) => c === '' || c === null || c === undefined)) {
      continue; // Skip empty rows
    }

    const rawTanggal = colMap['tanggal'] !== undefined ? row[colMap['tanggal']] : '';
    const dateParsed = parseExcelDate(rawTanggal);

    if (!dateParsed.valid) {
      invalidCount++;
      if (warnings.length < 5) {
        warnings.push(`Baris ${r + 1}: Tanggal "${rawTanggal}" tidak valid atau kosong, dilewati.`);
      }
      continue;
    }

    // Update min/max dates
    if (!minDate || dateParsed.tanggalRaw < minDate) minDate = dateParsed.tanggalRaw;
    if (!maxDate || dateParsed.tanggalRaw > maxDate) maxDate = dateParsed.tanggalRaw;

    // Team info
    let timKode = colMap['timKode'] !== undefined ? String(row[colMap['timKode']] || '').trim().toUpperCase() : '';
    let p1 = colMap['petugas1'] !== undefined ? String(row[colMap['petugas1']] || '').trim().toUpperCase() : '';
    let p2 = colMap['petugas2'] !== undefined ? String(row[colMap['petugas2']] || '').trim().toUpperCase() : '';

    // If p1 contains a combined string with separator (e.g., 'BUDI & AGUS' or 'BUDI \n AGUS')
    if (p1 && !p2) {
      const splitNames = p1.split(/\n|&|\/|\band\b/i).map((s) => s.trim());
      if (splitNames.length >= 2) {
        p1 = splitNames[0].toUpperCase();
        p2 = splitNames[1].toUpperCase();
      }
    }

    // If timKode is missing, try to resolve from known teams
    if (!timKode) {
      const match = existingTeams.find((t) => (p1 && t.p1 === p1) || (p2 && t.p2 === p2));
      if (match) {
        timKode = match.kode;
      } else {
        timKode = 'A';
      }
    }

    // If p1/p2 missing, lookup from existing teams
    if (!p1 || !p2) {
      const match = existingTeams.find((t) => t.kode === timKode);
      if (match) {
        if (!p1) p1 = match.p1;
        if (!p2) p2 = match.p2;
      }
    }

    // Register team
    if (timKode) {
      if (!discoveredTeams.has(timKode)) {
        discoveredTeams.set(timKode, { p1: p1 || 'PETUGAS 1', p2: p2 || 'PETUGAS 2' });
      }
    }

    // Village info
    const desa = colMap['desa'] !== undefined ? String(row[colMap['desa']] || '').trim().toUpperCase() : 'DESA 1';
    if (desa) {
      discoveredVillages.add(desa);
    }

    // Periode and Siklus
    const periodeRaw = colMap['periode'] !== undefined ? parseInt(String(row[colMap['periode']]), 10) : 1;
    const periode = !isNaN(periodeRaw) && periodeRaw > 0 ? periodeRaw : 1;

    const siklusRaw = colMap['siklus'] !== undefined ? parseInt(String(row[colMap['siklus']]), 10) : 1;
    const siklus = !isNaN(siklusRaw) && siklusRaw > 0 ? siklusRaw : 1;

    // Status
    let status: DutyStatus = 'terjadwal';
    const rawStatus = colMap['status'] !== undefined ? String(row[colMap['status']] || '').toLowerCase() : '';
    if (rawStatus.includes('laksana') || rawStatus.includes('selesai') || rawStatus.includes('hadir')) {
      status = 'terlaksana';
    } else if (rawStatus.includes('ijin') || rawStatus.includes('izin') || rawStatus.includes('absen')) {
      status = 'ijin';
    } else if (rawStatus.includes('ganti') || rawStatus.includes('substitusi')) {
      status = 'pengganti';
    }

    const keterangan = colMap['keterangan'] !== undefined ? String(row[colMap['keterangan']] || '').trim() : '';

    schedules.push({
      id: `sch-imp-${schedules.length + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tanggal: dateParsed.tanggal,
      tanggalRaw: dateParsed.tanggalRaw,
      hari: dateParsed.hari,
      timKode,
      petugas1: p1 || `PETUGAS 1 (TIM ${timKode})`,
      petugas2: p2 || `PETUGAS 2 (TIM ${timKode})`,
      desa: desa || 'DESA',
      periode,
      siklus,
      status,
      keterangan
    });

    validCount++;
  }

  // Build new teams array for any teams not yet in existingTeams
  const newTeams: Team[] = [];
  discoveredTeams.forEach((val, kode) => {
    const existing = existingTeams.find((t) => t.kode === kode);
    if (!existing) {
      newTeams.push({
        kode,
        p1: val.p1,
        p2: val.p2
      });
    }
  });

  // Build new villages array for any villages not yet in existingVillages
  const newVillages: string[] = [];
  discoveredVillages.forEach((desa) => {
    if (!existingVillages.includes(desa)) {
      newVillages.push(desa);
    }
  });

  // Sort schedules chronologically
  schedules.sort((a, b) => a.tanggalRaw.localeCompare(b.tanggalRaw));

  if (schedules.length === 0) {
    errors.push('Tidak ada baris jadwal yang berhasil diproses dari sheet Excel yang dipilih.');
  }

  return {
    schedules,
    newTeams,
    newVillages,
    totalRows: rows.length - (headerRowIndex + 1),
    validRows: validCount,
    invalidRows: invalidCount,
    dateRange: { min: minDate, max: maxDate },
    errors,
    warnings,
    detectedColumns
  };
}

// Parse Master Team Worksheet
export function parseTeamWorksheet(ws: XLSX.WorkSheet): ParsedTeamResult {
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (!rows || rows.length === 0) {
    return { teams: [], totalRows: 0, validRows: 0, errors: ['Sheet Tim kosong.'] };
  }

  let headerRowIndex = 0;
  let colMap: { [key: string]: number } = { kode: 0, p1: 1, p2: 2, tel1: 3, tel2: 4, catatan: 5 };

  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const row = rows[r];
    const tempMap: { [key: string]: number } = {};
    let matched = 0;

    row.forEach((cell, cIdx) => {
      const norm = normalizeHeaderName(cell);
      if (/(kode tim|tim|kode|team)/.test(norm)) { tempMap['kode'] = cIdx; matched++; }
      else if (/(petugas 1|petugas1|p1|nama 1)/.test(norm)) { tempMap['p1'] = cIdx; matched++; }
      else if (/(petugas 2|petugas2|p2|nama 2)/.test(norm)) { tempMap['p2'] = cIdx; matched++; }
      else if (/(telp 1|telepon 1|hp 1|kontak 1)/.test(norm)) tempMap['tel1'] = cIdx;
      else if (/(telp 2|telepon 2|hp 2|kontak 2)/.test(norm)) tempMap['tel2'] = cIdx;
      else if (/(catatan|keterangan|notes)/.test(norm)) tempMap['catatan'] = cIdx;
    });

    if (matched >= 2) {
      headerRowIndex = r;
      colMap = tempMap;
      break;
    }
  }

  const teams: Team[] = [];
  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => c === '')) continue;

    const kode = String(row[colMap['kode'] !== undefined ? colMap['kode'] : 0] || '').trim().toUpperCase();
    const p1 = String(row[colMap['p1'] !== undefined ? colMap['p1'] : 1] || '').trim().toUpperCase();
    const p2 = String(row[colMap['p2'] !== undefined ? colMap['p2'] : 2] || '').trim().toUpperCase();
    const tel1 = colMap['tel1'] !== undefined ? String(row[colMap['tel1']] || '').trim() : '';
    const tel2 = colMap['tel2'] !== undefined ? String(row[colMap['tel2']] || '').trim() : '';
    const catatan = colMap['catatan'] !== undefined ? String(row[colMap['catatan']] || '').trim() : '';

    if (kode && (p1 || p2)) {
      teams.push({
        kode,
        p1: p1 || `PETUGAS 1 TIM ${kode}`,
        p2: p2 || `PETUGAS 2 TIM ${kode}`,
        telepon1: tel1,
        telepon2: tel2,
        catatan
      });
    }
  }

  return {
    teams,
    totalRows: rows.length - (headerRowIndex + 1),
    validRows: teams.length,
    errors: teams.length === 0 ? ['Tidak ada data tim yang valid.'] : []
  };
}

// Parse Master Village Worksheet
export function parseVillageWorksheet(ws: XLSX.WorkSheet): ParsedVillageResult {
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (!rows || rows.length === 0) {
    return { villages: [], totalRows: 0, validRows: 0, errors: ['Sheet Desa kosong.'] };
  }

  let headerRowIndex = 0;
  let targetCol = 0;

  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const row = rows[r];
    row.forEach((cell, cIdx) => {
      const norm = normalizeHeaderName(cell);
      if (/(nama desa|desa|wilayah|kelurahan|nama)/.test(norm)) {
        headerRowIndex = r;
        targetCol = cIdx;
      }
    });
  }

  const villages: string[] = [];
  const set = new Set<string>();

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const cellVal = String(row[targetCol] || row[1] || row[0] || '').trim().toUpperCase();
    if (cellVal && !/^(no|nomor|nama|desa)$/i.test(cellVal) && !set.has(cellVal)) {
      set.add(cellVal);
      villages.push(cellVal);
    }
  }

  return {
    villages,
    totalRows: rows.length - (headerRowIndex + 1),
    validRows: villages.length,
    errors: villages.length === 0 ? ['Tidak ada nama desa yang ditemukan.'] : []
  };
}

// Download Excel Template for Schedules with sample rows and column styling
export function downloadScheduleExcelTemplate() {
  const templateRows = [
    {
      'No': 1,
      'Tanggal': '18/08/2026',
      'Hari': 'SELASA',
      'Kode Tim': 'A',
      'Nama Petugas 1': 'I WAYAN SUDIRTA',
      'Nama Petugas 2': 'I MADE ARDANA',
      'Desa': 'DESA ABANG',
      'Periode': 1,
      'Siklus': 1,
      'Status': 'terjadwal',
      'Keterangan': 'Patroli Reguler'
    },
    {
      'No': 2,
      'Tanggal': '19/08/2026',
      'Hari': 'RABU',
      'Kode Tim': 'B',
      'Nama Petugas 1': 'I KETUT WIDNYANA',
      'Nama Petugas 2': 'I NYOMAN KARNA',
      'Desa': 'DESA BUNUTAN',
      'Periode': 1,
      'Siklus': 1,
      'Status': 'terjadwal',
      'Keterangan': 'Titik Rawan Pos 1'
    },
    {
      'No': 3,
      'Tanggal': '20/08/2026',
      'Hari': 'KAMIS',
      'Kode Tim': 'C',
      'Nama Petugas 1': 'I GEDE PUTU',
      'Nama Petugas 2': 'I KOMANG ARIASA',
      'Desa': 'DESA CULIK',
      'Periode': 1,
      'Siklus': 1,
      'Status': 'terlaksana',
      'Keterangan': 'Aman terkendali'
    },
    {
      'No': 4,
      'Tanggal': '21/08/2026',
      'Hari': 'JUMAT',
      'Kode Tim': 'D',
      'Nama Petugas 1': 'I WAYAN SUJANA',
      'Nama Petugas 2': 'I MADE WIRATA',
      'Desa': 'DESA DATAH',
      'Periode': 1,
      'Siklus': 1,
      'Status': 'terjadwal',
      'Keterangan': ''
    },
    {
      'No': 5,
      'Tanggal': '22/08/2026',
      'Hari': 'SABTU',
      'Kode Tim': 'E',
      'Nama Petugas 1': 'I NYOMAN SUARTA',
      'Nama Petugas 2': 'I KETUT MUDITA',
      'Desa': 'DESA KERTASARI',
      'Periode': 1,
      'Siklus': 1,
      'Status': 'terjadwal',
      'Keterangan': ''
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateRows);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 28 },
    { wch: 28 },
    { wch: 24 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
    { wch: 25 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Jadwal SAMTUL');
  XLSX.writeFile(wb, 'Template_Import_Jadwal_SAMTUL.xlsx');
}

// Download Excel Template for Master Tim & Desa
export function downloadTeamsVillagesTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Tim
  const sampleTeams = [
    { 'Kode Tim': 'A', 'Petugas 1': 'I WAYAN SUDIRTA', 'Petugas 2': 'I MADE ARDANA', 'No Telepon 1': '081234567890', 'No Telepon 2': '081234567891', 'Catatan': 'Regu Utama' },
    { 'Kode Tim': 'B', 'Petugas 1': 'I KETUT WIDNYANA', 'Petugas 2': 'I NYOMAN KARNA', 'No Telepon 1': '081234567892', 'No Telepon 2': '081234567893', 'Catatan': '' },
    { 'Kode Tim': 'C', 'Petugas 1': 'I GEDE PUTU', 'Petugas 2': 'I KOMANG ARIASA', 'No Telepon 1': '081234567894', 'No Telepon 2': '081234567895', 'Catatan': '' }
  ];
  const wsTeams = XLSX.utils.json_to_sheet(sampleTeams);
  wsTeams['!cols'] = [{ wch: 10 }, { wch: 26 }, { wch: 26 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsTeams, 'Data Tim');

  // Sheet 2: Desa
  const sampleDesa = [
    { 'No': 1, 'Nama Desa': 'DESA ABANG' },
    { 'No': 2, 'Nama Desa': 'DESA BUNUTAN' },
    { 'No': 3, 'Nama Desa': 'DESA CULIK' },
    { 'No': 4, 'Nama Desa': 'DESA DATAH' },
    { 'No': 5, 'Nama Desa': 'DESA KERTASARI' }
  ];
  const wsDesa = XLSX.utils.json_to_sheet(sampleDesa);
  wsDesa['!cols'] = [{ wch: 6 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, wsDesa, 'Data Desa');

  XLSX.writeFile(wb, 'Template_Master_Tim_Desa.xlsx');
}
