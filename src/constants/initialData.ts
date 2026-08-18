import { Team, ReportConfig } from '../types';

export const DEFAULT_TIM: Team[] = [
  { kode: 'A', p1: 'I GUSTI PUTU ANOM WEDANA', p2: 'SANG PUTU RIKO ANANDA' },
  { kode: 'B', p1: 'PANDE GEDE YUDA TRIGUNA', p2: 'I WAYAN BALIK KAMAR' },
  { kode: 'C', p1: 'PUTU DIAH ANGGAR CAHYANI', p2: 'NI WAYAN YUDIANI' },
  { kode: 'D', p1: 'NI WAYAN SUARDI', p2: 'I NENGAH WIDHIA DARMA LAKSANA' },
  { kode: 'E', p1: 'I DEWA GEDE INDRA GUNAWAN MESI', p2: 'SANG NYOMAN WIRAMA JAYA' },
  { kode: 'F', p1: 'PADWIKA UDIANA', p2: 'ANAK AGUNG WIJAYA PUTRA' },
  { kode: 'G', p1: 'GEDE PANDE ARYA TAMA WIDANA', p2: 'I WAYAN SUARCA' },
  { kode: 'H', p1: 'LUH MADE DWI ANTARI', p2: 'I KADEK WAHYUDI' },
  { kode: 'I', p1: 'PUTU HENDRAWAN', p2: 'I MADE PANJI ANANDA PAHLAWAN' },
  { kode: 'J', p1: 'I KADEK SWIDANA', p2: 'I WAYAN ARIP WIBAWA' },
  { kode: 'K', p1: 'NI NYOMAN PUTRI PARYANI', p2: 'I MADE ENDRIK SETIAWAN' },
  { kode: 'L', p1: 'MADE SUDIARTA', p2: 'KADEK DIANA' },
  { kode: 'M', p1: 'WAYAN JUNIARTA', p2: 'KOMANG ARTA SUSILA' }
];

export const DEFAULT_DESA: string[] = [
  'ABANG SONGAN',
  'ABUAN KINT',
  'BANTANG',
  'BANUA',
  'BATU DINDING',
  'BATU KAANG',
  'BATUR SELATAN',
  'BATUR TENGAH',
  'BAYUNG CERIK',
  'BAYUNG GEDE',
  'BELANCAN',
  'BELANDINGAN',
  'BELANGA',
  'BELANTIH',
  'BONYOH',
  'BUAHAN',
  'BUNUTIN',
  'CATUR',
  'DAUP',
  'DAUSA',
  'KATUNG',
  'KEDISAN',
  'LANGGAHAN',
  'LEMBEAN',
  'MANGGUH',
  'MANIK LIYU',
  'MENGANI',
  'PENGEJARAN',
  'PINGGAN',
  'SEKAAN',
  'SEKARDADI',
  'SLULUNG',
  'SERAHI',
  'SIYAKIN',
  'SONGAN B',
  'SUKAWANA',
  'SUTER',
  'TRUNYAN',
  'LANDIH',
  'PENGOTAN',
  'ABUAN',
  'APUAN',
  'PENGLUMBARAN',
  'SELAT',
  'TIGA',
  'KEBON',
  'PENINJOAN',
  'YANG API',
  'CEPUNGGUNG'
];

export const DEFAULT_TGL_MULAI = '2026-08-20';
export const DEFAULT_TGL_AKHIR = '2026-09-30';

export const HARI_INDONESIA = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
export const BULAN_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const DEFAULT_REPORT_CONFIG: ReportConfig = {
  kopInstansi1: 'PEMERINTAH KABUPATEN BANGLI',
  kopInstansi2: 'SATUAN TUGAS PENGAMANAN LINGKUNGAN (SAMTUL) DESA',
  kopAlamat: 'Sekretariat: Jl. Nusantara No. 01, Bangli, Bali - Kode Pos 80614',
  kopKontak: 'Email: samtul.bangli@gmail.com | Telp/WA: (0366) 91234',
  nomorSurat: '005/SAMTUL-DESA/VIII/2026',
  judulLaporan: 'LAPORAN JADWAL TUGAS PENGAMANAN LINGKUNGAN DESA',
  tempatTtd: 'Bangli',
  tanggalTtd: new Date().toISOString().split('T')[0],
  namaPenandatangan: 'I WAYAN SUARTA, S.Sos., M.AP.',
  jabatanPenandatangan: 'Koordinator Lapangan SAMTUL Desa',
  nipPenandatangan: '19820514 200801 1 009',
  catatanTambahan: '1. Petugas wajib hadir tepat waktu dan mengisi presensi digital/manual.\n2. Wajib berkoordinasi dengan Linmas dan Prajuru Desa setempat.\n3. Melaporkan situasi keamanan secara berkala ke pos komando.',
  tampilkanKop: true,
  tampilkanTtd: true
};
