import React, { useState } from 'react';
import { 
  ScheduleItem, 
  Team, 
  ReportConfig, 
  FilterState 
} from '../types';
import { 
  Printer, 
  FileDown, 
  FileSpreadsheet, 
  Settings, 
  Check, 
  Eye, 
  Building2, 
  Calendar, 
  UserCheck, 
  RotateCcw,
  Sparkles,
  FileText
} from 'lucide-react';
import { exportScheduleToPDF, exportScheduleToExcel, exportStatsToExcel } from '../utils/exportUtils';
import { formatDateIndo, getMonthYearLabel } from '../utils/scheduleGenerator';

interface ReportPrintViewProps {
  schedules: ScheduleItem[];
  allSchedules: ScheduleItem[];
  teams: Team[];
  villages: string[];
  reportConfig: ReportConfig;
  onUpdateReportConfig: (newConfig: ReportConfig) => void;
  tglMulai: string;
  tglAkhir: string;
  availableMonths: string[];
}

type ReportType = 'jadwal_lengkap' | 'rekap_tim' | 'per_tim' | 'agenda_desa';

export const ReportPrintView: React.FC<ReportPrintViewProps> = ({
  schedules,
  allSchedules,
  teams,
  villages,
  reportConfig,
  onUpdateReportConfig,
  tglMulai,
  tglAkhir,
  availableMonths
}) => {
  const [reportType, setReportType] = useState<ReportType>('jadwal_lengkap');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedTim, setSelectedTim] = useState<string>(teams[0]?.kode || 'A');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<ReportConfig>({ ...reportConfig });

  // Filter schedules based on report selections
  const displaySchedules = React.useMemo(() => {
    let list = allSchedules;
    if (selectedMonth !== 'all') {
      list = list.filter(s => s.tanggalRaw.startsWith(selectedMonth));
    }
    if (reportType === 'per_tim') {
      list = list.filter(s => s.timKode === selectedTim);
    }
    return list;
  }, [allSchedules, selectedMonth, selectedTim, reportType]);

  // Statistics calculation for rekap report
  const statsRows = React.useMemo(() => {
    const list = selectedMonth === 'all' 
      ? allSchedules 
      : allSchedules.filter(s => s.tanggalRaw.startsWith(selectedMonth));
    const total = list.length;
    return teams.map((t) => {
      const count = list.filter(s => s.timKode === t.kode).length;
      const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
      return {
        kode: t.kode,
        p1: t.p1,
        p2: t.p2,
        total: count,
        persen: `${pct}%`
      };
    });
  }, [teams, allSchedules, selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const filterInfo = selectedMonth !== 'all' ? `Bulan ${getMonthYearLabel(selectedMonth)}` : undefined;
    exportScheduleToPDF(displaySchedules, localConfig, tglMulai, tglAkhir, filterInfo);
  };

  const handleExportExcel = () => {
    if (reportType === 'rekap_tim') {
      exportStatsToExcel(statsRows, displaySchedules.length);
    } else {
      exportScheduleToExcel(displaySchedules);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateReportConfig(localConfig);
    setIsConfigOpen(false);
  };

  const activeTeamObj = teams.find(t => t.kode === selectedTim);

  return (
    <div className="space-y-6">
      {/* Control Panel (Hidden when printing) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 no-print">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Printer className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Pusat Cetak Dokumen & Laporan Resmi
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Format cetak resmi lengkap dengan KOP Instansi, nomor surat, dan lembar pengesahan tanda tangan.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto">
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            >
              <Settings className="w-4 h-4" />
              <span>Pengaturan KOP & TTD</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>Unduh PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Print)</span>
            </button>
          </div>
        </div>

        {/* Filter Format Laporan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Format Dokumen Laporan:
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold outline-none"
            >
              <option value="jadwal_lengkap">📄 1. Laporan Jadwal Lengkap</option>
              <option value="rekap_tim">📊 2. Laporan Rekapitulasi Beban Kerja Tim</option>
              <option value="per_tim">👤 3. Surat Tugas Khusus Per Tim</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Filter Bulan Laporan:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium outline-none"
            >
              <option value="all">Semua Bulan ({tglMulai} s.d. {tglAkhir})</option>
              {availableMonths.map((mKey) => (
                <option key={mKey} value={mKey}>{getMonthYearLabel(mKey)}</option>
              ))}
            </select>
          </div>

          {reportType === 'per_tim' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Pilih Tim Petugas:
              </label>
              <select
                value={selectedTim}
                onChange={(e) => setSelectedTim(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold outline-none"
              >
                {teams.map((t) => (
                  <option key={t.kode} value={t.kode}>
                    Tim {t.kode} - {t.p1} & {t.p2}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Configuration Drawer / Box */}
        {isConfigOpen && (
          <form onSubmit={handleSaveConfig} className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
            <div className="font-bold text-slate-900 pb-1 border-b border-slate-200 flex items-center justify-between">
              <span>Pengaturan KOP Surat & Tanda Tangan Pejabat</span>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                Tutup
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-0.5">Nama Instansi Baris 1</label>
                <input
                  type="text"
                  value={localConfig.kopInstansi1}
                  onChange={(e) => setLocalConfig({ ...localConfig, kopInstansi1: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-0.5">Nama Satgas / Unit Baris 2</label>
                <input
                  type="text"
                  value={localConfig.kopInstansi2}
                  onChange={(e) => setLocalConfig({ ...localConfig, kopInstansi2: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-0.5">Alamat Lengkap</label>
                <input
                  type="text"
                  value={localConfig.kopAlamat}
                  onChange={(e) => setLocalConfig({ ...localConfig, kopAlamat: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-0.5">Kontak / Email</label>
                <input
                  type="text"
                  value={localConfig.kopKontak}
                  onChange={(e) => setLocalConfig({ ...localConfig, kopKontak: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-0.5">Nomor Surat / Dokumen</label>
                <input
                  type="text"
                  value={localConfig.nomorSurat}
                  onChange={(e) => setLocalConfig({ ...localConfig, nomorSurat: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-0.5">Judul Dokumen</label>
                <input
                  type="text"
                  value={localConfig.judulLaporan}
                  onChange={(e) => setLocalConfig({ ...localConfig, judulLaporan: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-0.5">Nama Penandatangan</label>
                <input
                  type="text"
                  value={localConfig.namaPenandatangan}
                  onChange={(e) => setLocalConfig({ ...localConfig, namaPenandatangan: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-0.5">Jabatan Penandatangan</label>
                <input
                  type="text"
                  value={localConfig.jabatanPenandatangan}
                  onChange={(e) => setLocalConfig({ ...localConfig, jabatanPenandatangan: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-0.5">NIP / Identitas</label>
                <input
                  type="text"
                  value={localConfig.nipPenandatangan}
                  onChange={(e) => setLocalConfig({ ...localConfig, nipPenandatangan: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-0.5">Tempat Penandatanganan</label>
                <input
                  type="text"
                  value={localConfig.tempatTtd}
                  onChange={(e) => setLocalConfig({ ...localConfig, tempatTtd: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={localConfig.tampilkanKop}
                  onChange={(e) => setLocalConfig({ ...localConfig, tampilkanKop: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Tampilkan KOP Surat</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={localConfig.tampilkanTtd}
                  onChange={(e) => setLocalConfig({ ...localConfig, tampilkanTtd: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Tampilkan Lembar Tanda Tangan</span>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                Simpan Konfigurasi KOP
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Printable Sheet View (WYSIWYG) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-10 max-w-5xl mx-auto print:p-0 print:border-none print:shadow-none print:max-w-none">
        {/* KOP SURAT */}
        {localConfig.tampilkanKop && (
          <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
            <h1 className="text-base sm:text-lg font-black tracking-wider text-slate-900 uppercase">
              {localConfig.kopInstansi1}
            </h1>
            <h2 className="text-sm sm:text-base font-extrabold tracking-wide text-slate-800 uppercase mt-0.5">
              {localConfig.kopInstansi2}
            </h2>
            <p className="text-[11px] text-slate-600 mt-1">
              {localConfig.kopAlamat} &bull; {localConfig.kopKontak}
            </p>
            <div className="w-full h-0.5 bg-slate-900 mt-3" />
            <div className="w-full h-px bg-slate-900 mt-0.5" />
          </div>
        )}

        {/* Document Title */}
        <div className="text-center mb-6">
          <h3 className="text-sm sm:text-base font-bold uppercase text-slate-900 underline underline-offset-4">
            {reportType === 'jadwal_lengkap' && localConfig.judulLaporan}
            {reportType === 'rekap_tim' && 'LAPORAN REKAPITULASI & STATISTIK BEBAN TUGAS TIM SAMTUL'}
            {reportType === 'per_tim' && `SURAT JADWAL PENUGASAN KHUSUS TIM ${selectedTim}`}
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Nomor: {localConfig.nomorSurat}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Periode: {formatDateIndo(tglMulai)} s.d. {formatDateIndo(tglAkhir)} {selectedMonth !== 'all' && `(${getMonthYearLabel(selectedMonth)})`}
          </p>
        </div>

        {/* Specific Tim details when per_tim is selected */}
        {reportType === 'per_tim' && activeTeamObj && (
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-semibold text-slate-500">Tim:</span> <span className="font-bold text-slate-900">TIM {activeTeamObj.kode}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Total Tugas:</span> <span className="font-bold text-slate-900">{displaySchedules.length} Penugasan</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Petugas 1:</span> <span className="font-bold text-slate-900">{activeTeamObj.p1}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Petugas 2:</span> <span className="font-bold text-slate-900">{activeTeamObj.p2}</span>
              </div>
            </div>
          </div>
        )}

        {/* Table Content */}
        {reportType === 'rekap_tim' ? (
          <table className="w-full text-xs text-left border-collapse border border-slate-300 mb-6">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                <th className="p-2 border border-slate-300 text-center w-10">No</th>
                <th className="p-2 border border-slate-300 text-center w-16">Tim</th>
                <th className="p-2 border border-slate-300">Nama Petugas 1</th>
                <th className="p-2 border border-slate-300">Nama Petugas 2</th>
                <th className="p-2 border border-slate-300 text-center w-28">Jumlah Tugas</th>
                <th className="p-2 border border-slate-300 text-center w-28">Persentase</th>
              </tr>
            </thead>
            <tbody>
              {statsRows.map((row, idx) => (
                <tr key={row.kode} className="border-b border-slate-200">
                  <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                  <td className="p-2 border border-slate-300 text-center font-bold">Tim {row.kode}</td>
                  <td className="p-2 border border-slate-300">{row.p1}</td>
                  <td className="p-2 border border-slate-300">{row.p2}</td>
                  <td className="p-2 border border-slate-300 text-center font-bold">{row.total}</td>
                  <td className="p-2 border border-slate-300 text-center">{row.persen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-xs text-left border-collapse border border-slate-300 mb-6">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300 text-[11px]">
                <th className="p-2 border border-slate-300 text-center w-10">No</th>
                <th className="p-2 border border-slate-300 whitespace-nowrap w-24">Tanggal</th>
                <th className="p-2 border border-slate-300 whitespace-nowrap w-20">Hari</th>
                <th className="p-2 border border-slate-300 text-center w-14">Tim</th>
                <th className="p-2 border border-slate-300 min-w-[200px]">Nama Petugas</th>
                <th className="p-2 border border-slate-300 min-w-[160px]">Desa Pengamanan</th>
                <th className="p-2 border border-slate-300 text-center w-16">Periode</th>
                <th className="p-2 border border-slate-300 text-center w-16">Siklus</th>
              </tr>
            </thead>
            <tbody>
              {displaySchedules.map((row, idx) => (
                <tr key={row.id} className="border-b border-slate-200">
                  <td className="p-2 border border-slate-300 text-center text-slate-500 font-mono text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="p-2 border border-slate-300 font-semibold whitespace-nowrap">{row.tanggal}</td>
                  <td className="p-2 border border-slate-300 whitespace-nowrap">{row.hari}</td>
                  <td className="p-2 border border-slate-300 text-center font-bold">Tim {row.timKode}</td>
                  <td className="p-2 border border-slate-300 leading-tight">
                    <div className="font-semibold">{row.petugas1}</div>
                    <div className="text-[11px] text-slate-500">& {row.petugas2}</div>
                  </td>
                  <td className="p-2 border border-slate-300 font-bold text-slate-900">{row.desa}</td>
                  <td className="p-2 border border-slate-300 text-center font-medium">P-{row.periode}</td>
                  <td className="p-2 border border-slate-300 text-center font-medium">S-{row.siklus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Signature Box */}
        {localConfig.tampilkanTtd && (
          <div className="flex justify-end mt-8 break-inside-avoid">
            <div className="text-center text-xs min-w-[240px]">
              <div>{localConfig.tempatTtd}, {formatDateIndo(localConfig.tanggalTtd)}</div>
              <div className="font-semibold mt-1">{localConfig.jabatanPenandatangan}</div>
              <div className="h-20" />
              <div className="font-bold underline text-slate-900">{localConfig.namaPenandatangan}</div>
              <div className="text-slate-600 mt-0.5">NIP. {localConfig.nipPenandatangan}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
