export interface Team {
  kode: string; // e.g. 'A', 'B', ...
  p1: string;   // Nama Petugas 1
  p2: string;   // Nama Petugas 2
  telepon1?: string;
  telepon2?: string;
  catatan?: string;
}

export type DutyStatus = 'terjadwal' | 'terlaksana' | 'ijin' | 'pengganti';

export interface ScheduleItem {
  id: string | number;
  tanggal: string;      // DD/MM/YYYY
  tanggalRaw: string;   // YYYY-MM-DD
  hari: string;         // SENIN, SELASA, etc.
  timKode: string;
  petugas1: string;
  petugas2: string;
  desa: string;
  periode: number;
  siklus: number;
  status?: DutyStatus;
  keterangan?: string;
  _edit?: boolean;
  _original?: {
    tanggalRaw: string;
    timKode: string;
    desa: string;
    status?: DutyStatus;
    keterangan?: string;
  } | null;
}

export interface ReportConfig {
  kopInstansi1: string;
  kopInstansi2: string;
  kopAlamat: string;
  kopKontak: string;
  nomorSurat: string;
  judulLaporan: string;
  tempatTtd: string;
  tanggalTtd: string;
  namaPenandatangan: string;
  jabatanPenandatangan: string;
  nipPenandatangan: string;
  catatanTambahan: string;
  tampilkanKop: boolean;
  tampilkanTtd: boolean;
}

export interface BackupData {
  version: string;
  appName: string;
  exportedAt: string;
  tglMulai: string;
  tglAkhir: string;
  excludeSunday: boolean;
  teams: Team[];
  villages: string[];
  schedules: ScheduleItem[];
  reportConfig: ReportConfig;
}

export interface FilterState {
  month: string;       // 'all' or 'YYYY-MM' e.g. '2026-08'
  periode: string;     // 'all' or number string
  timKode: string;     // 'all' or 'A', 'B', etc.
  desa: string;        // 'all' or village name
  search: string;      // search query
  startDate?: string;  // optional date filter
  endDate?: string;
  status?: string;     // 'all' or DutyStatus
}

export type ViewMode = 'table' | 'calendar' | 'matrix';
export type ActiveTab = 'jadwal' | 'kelola' | 'tim' | 'desa' | 'statistik' | 'laporan' | 'backup';
