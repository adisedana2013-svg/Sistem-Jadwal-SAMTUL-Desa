import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Layers, 
  Calendar, 
  Users, 
  MapPin, 
  ArrowRight, 
  X, 
  Sparkles,
  FileCode2,
  Table,
  Check,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ScheduleItem, Team, DutyStatus } from '../types';
import { 
  readExcelWorkbook, 
  parseScheduleWorksheet, 
  parseTeamWorksheet, 
  parseVillageWorksheet, 
  ParsedScheduleResult, 
  ParsedTeamResult, 
  ParsedVillageResult,
  downloadScheduleExcelTemplate,
  downloadTeamsVillagesTemplate
} from '../utils/excelImportUtils';
import { formatDateIndo } from '../utils/scheduleGenerator';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTeams: Team[];
  existingVillages: string[];
  existingSchedules: ScheduleItem[];
  onImportSchedules: (
    imported: ScheduleItem[], 
    mode: 'replace' | 'append', 
    syncTeams: boolean, 
    syncVillages: boolean, 
    newTeams: Team[], 
    newVillages: string[]
  ) => void;
  onImportTeams: (newTeams: Team[], mode: 'replace' | 'append') => void;
  onImportVillages: (newVillages: string[], mode: 'replace' | 'append') => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  existingTeams,
  existingVillages,
  existingSchedules,
  onImportSchedules,
  onImportTeams,
  onImportVillages
}) => {
  const [activeTab, setActiveTab] = useState<'jadwal' | 'tim' | 'desa'>('jadwal');
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  
  // Results
  const [scheduleResult, setScheduleResult] = useState<ParsedScheduleResult | null>(null);
  const [teamResult, setTeamResult] = useState<ParsedTeamResult | null>(null);
  const [villageResult, setVillageResult] = useState<ParsedVillageResult | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Import Options
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [syncNewTeams, setSyncNewTeams] = useState(true);
  const [syncNewVillages, setSyncNewVillages] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setGeneralError(null);
    setScheduleResult(null);
    setTeamResult(null);
    setVillageResult(null);
    setWorkbook(null);
    setLoading(true);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv', 'ods'].includes(ext || '')) {
      setGeneralError('File harus berupa berkas Excel (.xlsx, .xls, .csv)');
      setLoading(false);
      return;
    }

    try {
      setFileName(file.name);
      const wb = await readExcelWorkbook(file);
      setWorkbook(wb);

      if (wb.SheetNames.length === 0) {
        setGeneralError('Berkas Excel tidak memiliki sheet yang dapat dibaca.');
        setLoading(false);
        return;
      }

      // Determine appropriate default sheet
      let defaultSheet = wb.SheetNames[0];
      if (activeTab === 'jadwal') {
        const found = wb.SheetNames.find(s => /jadwal|schedule|samtul/i.test(s));
        if (found) defaultSheet = found;
      } else if (activeTab === 'tim') {
        const found = wb.SheetNames.find(s => /tim|petugas|team/i.test(s));
        if (found) defaultSheet = found;
      } else if (activeTab === 'desa') {
        const found = wb.SheetNames.find(s => /desa|wilayah|village/i.test(s));
        if (found) defaultSheet = found;
      }

      setSelectedSheet(defaultSheet);
      processSheet(wb, defaultSheet, activeTab);
    } catch (err: any) {
      setGeneralError(err.message || 'Gagal memproses file Excel.');
    } finally {
      setLoading(false);
    }
  };

  const processSheet = (wb: XLSX.WorkBook, sheetName: string, tab: 'jadwal' | 'tim' | 'desa') => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;

    if (tab === 'jadwal') {
      const res = parseScheduleWorksheet(ws, existingTeams, existingVillages);
      setScheduleResult(res);
    } else if (tab === 'tim') {
      const res = parseTeamWorksheet(ws);
      setTeamResult(res);
    } else if (tab === 'desa') {
      const res = parseVillageWorksheet(ws);
      setVillageResult(res);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      processSheet(workbook, sheetName, activeTab);
    }
  };

  const handleTabSwitch = (newTab: 'jadwal' | 'tim' | 'desa') => {
    setActiveTab(newTab);
    if (workbook && selectedSheet) {
      processSheet(workbook, selectedSheet, newTab);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleExecuteImport = () => {
    if (activeTab === 'jadwal' && scheduleResult) {
      if (scheduleResult.schedules.length === 0) {
        alert('Tidak ada baris jadwal yang valid untuk diimpor.');
        return;
      }
      onImportSchedules(
        scheduleResult.schedules,
        importMode,
        syncNewTeams,
        syncNewVillages,
        scheduleResult.newTeams,
        scheduleResult.newVillages
      );
      onClose();
    } else if (activeTab === 'tim' && teamResult) {
      if (teamResult.teams.length === 0) {
        alert('Tidak ada data tim yang valid untuk diimpor.');
        return;
      }
      onImportTeams(teamResult.teams, importMode);
      onClose();
    } else if (activeTab === 'desa' && villageResult) {
      if (villageResult.villages.length === 0) {
        alert('Tidak ada nama desa yang valid untuk diimpor.');
        return;
      }
      onImportVillages(villageResult.villages, importMode);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Impor Data dari Excel (.xlsx / .csv)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Smart Parser
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Unggah berkas spreadsheet untuk memuat jadwal penugasan, daftar tim, atau master desa secara instan.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection & Template Download Header */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="inline-flex rounded-xl bg-slate-200/80 p-1 text-xs font-semibold">
            <button
              onClick={() => handleTabSwitch('jadwal')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'jadwal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Impor Jadwal</span>
            </button>
            <button
              onClick={() => handleTabSwitch('tim')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'tim' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Impor Master Tim</span>
            </button>
            <button
              onClick={() => handleTabSwitch('desa')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'desa' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Impor Master Desa</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadScheduleExcelTemplate}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-all active:scale-95"
              title="Unduh contoh format Excel jadwal"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Template Jadwal (.xlsx)</span>
            </button>
            <button
              onClick={downloadTeamsVillagesTemplate}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-all active:scale-95"
              title="Unduh contoh format Excel Master Tim & Desa"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Template Tim & Desa</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50/60'
                : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20'
            }`}
          >
            <div className="p-3 rounded-full bg-white shadow-xs text-emerald-600">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {fileName ? `File Terpilih: ${fileName}` : 'Pilih atau Tarik File Excel (.xlsx, .xls, .csv) ke Sini'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Sistem otomatis mengenali kolom Tanggal, Hari, Kode Tim, Nama Petugas, Desa, Periode, dan Status.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* General Error Message */}
          {generalError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">Terjadi Kesalahan Impor:</p>
                <p className="mt-0.5">{generalError}</p>
              </div>
            </div>
          )}

          {/* Sheet Selector if Workbook loaded with multiple sheets */}
          {workbook && workbook.SheetNames.length > 1 && (
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-indigo-950">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Workbook memiliki {workbook.SheetNames.length} lembar kerja (Sheet):</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-slate-600 font-medium">Pilih Sheet:</label>
                <select
                  value={selectedSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-indigo-300 rounded-lg font-bold text-indigo-900 outline-none"
                >
                  {workbook.SheetNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* TAB 1: PARSED SCHEDULE RESULT */}
          {activeTab === 'jadwal' && scheduleResult && (
            <div className="space-y-4">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Baris Valid</div>
                  <div className="text-lg font-black text-emerald-900 flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{scheduleResult.validRows} Baris</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Rentang Tanggal</div>
                  <div className="text-xs font-bold text-slate-800 mt-1 truncate">
                    {scheduleResult.dateRange.min ? `${scheduleResult.dateRange.min} s.d ${scheduleResult.dateRange.max}` : '-'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950">
                  <div className="text-[10px] uppercase font-bold text-indigo-700">Tim Terdeteksi</div>
                  <div className="text-xs font-bold text-indigo-900 mt-1">
                    {scheduleResult.newTeams.length > 0 ? (
                      <span className="text-indigo-600">+{scheduleResult.newTeams.length} Tim Baru</span>
                    ) : (
                      'Sesuai Master Tim'
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-950">
                  <div className="text-[10px] uppercase font-bold text-sky-700">Desa Terdeteksi</div>
                  <div className="text-xs font-bold text-sky-900 mt-1">
                    {scheduleResult.newVillages.length > 0 ? (
                      <span className="text-sky-600">+{scheduleResult.newVillages.length} Desa Baru</span>
                    ) : (
                      'Sesuai Master Desa'
                    )}
                  </div>
                </div>
              </div>

              {/* Detected Column Mapping */}
              {Object.keys(scheduleResult.detectedColumns).length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    Pemetaan Kolom Excel yang Terdeteksi Otomatis:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(scheduleResult.detectedColumns).map(([key, val]) => (
                      <span key={key} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] text-slate-700">
                        <strong className="text-indigo-600 capitalize">{key}:</strong> {val}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-3.5 py-2 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
                  <span>Pratinjau Data Impor ({scheduleResult.schedules.length} Jadwal)</span>
                  <span className="text-[10px] text-slate-300 font-normal">
                    {scheduleResult.schedules.length > 20 ? 'Menampilkan 20 baris pertama' : 'Semua baris'}
                  </span>
                </div>
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-2.5 text-center w-10">No</th>
                        <th className="py-2 px-3">Tanggal</th>
                        <th className="py-2 px-2.5">Hari</th>
                        <th className="py-2 px-2.5">Tim</th>
                        <th className="py-2 px-3">Petugas 1 & 2</th>
                        <th className="py-2 px-3">Desa</th>
                        <th className="py-2 px-2 text-center">Periode</th>
                        <th className="py-2 px-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {scheduleResult.schedules.slice(0, 20).map((row, idx) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-2.5 text-center text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                            {row.tanggal}
                          </td>
                          <td className="py-1.5 px-2.5 text-slate-600">{row.hari}</td>
                          <td className="py-1.5 px-2.5">
                            <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                              Tim {row.timKode}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-[11px]">
                            <div className="font-semibold text-slate-800 truncate max-w-[160px]">{row.petugas1}</div>
                            <div className="text-slate-500 truncate max-w-[160px]">{row.petugas2}</div>
                          </td>
                          <td className="py-1.5 px-3 font-semibold text-slate-900">{row.desa}</td>
                          <td className="py-1.5 px-2 text-center text-slate-500 font-medium">P-{row.periode}</td>
                          <td className="py-1.5 px-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              {row.status || 'terjadwal'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import Options */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="font-bold text-slate-900">Opsi Penerapan Jadwal:</div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                    importMode === 'replace' ? 'bg-white border-indigo-600 ring-1 ring-indigo-500' : 'bg-white/60 border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="import-mode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Gantikan Seluruh Jadwal (Replace)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Menghapus jadwal aktif saat ini dan menggantinya dengan {scheduleResult.schedules.length} baris dari Excel.
                      </div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                    importMode === 'append' ? 'bg-white border-indigo-600 ring-1 ring-indigo-500' : 'bg-white/60 border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="import-mode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Gabungkan / Tambahkan (Append)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Menambahkan {scheduleResult.schedules.length} baris dari Excel ke dalam {existingSchedules.length} jadwal yang sudah ada.
                      </div>
                    </div>
                  </label>
                </div>

                <div className="pt-2 border-t border-slate-200/70 flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={syncNewTeams}
                      onChange={(e) => setSyncNewTeams(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span>Otomatis sinkronkan Tim baru ke Data Master Tim ({scheduleResult.newTeams.length} tim)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={syncNewVillages}
                      onChange={(e) => setSyncNewVillages(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span>Otomatis daftarkan Desa baru ke Data Master Desa ({scheduleResult.newVillages.length} desa)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PARSED TEAM RESULT */}
          {activeTab === 'tim' && teamResult && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between text-xs">
                <span className="font-bold">{teamResult.teams.length} Tim Petugas Berhasil Dikenali dari Excel</span>
                <span className="text-[11px] text-emerald-800">Total {teamResult.teams.length * 2} Nama Petugas</span>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-3 w-16">Kode</th>
                        <th className="py-2 px-4">Nama Petugas 1</th>
                        <th className="py-2 px-4">Nama Petugas 2</th>
                        <th className="py-2 px-3">No Kontak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {teamResult.teams.map((t) => (
                        <tr key={t.kode} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-900">TIM {t.kode}</td>
                          <td className="py-2 px-4 font-semibold text-slate-800">{t.p1}</td>
                          <td className="py-2 px-4 font-semibold text-slate-800">{t.p2}</td>
                          <td className="py-2 px-3 text-slate-500">{t.telepon1 || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="team-mode"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-indigo-600"
                  />
                  <span className="font-semibold text-slate-800">Gantikan Seluruh Data Tim</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="team-mode"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-indigo-600"
                  />
                  <span className="font-semibold text-slate-800">Gabungkan / Tambah Tim Baru</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: PARSED VILLAGE RESULT */}
          {activeTab === 'desa' && villageResult && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between text-xs">
                <span className="font-bold">{villageResult.villages.length} Desa Terdeteksi dari Excel</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 max-h-56 overflow-y-auto">
                <div className="flex flex-wrap gap-1.5">
                  {villageResult.villages.map((v, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800">
                      {i + 1}. {v}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="village-mode"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-indigo-600"
                  />
                  <span className="font-semibold text-slate-800">Gantikan Seluruh Daftar Desa</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="village-mode"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-indigo-600"
                  />
                  <span className="font-semibold text-slate-800">Gabungkan / Tambah Desa Baru</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {activeTab === 'jadwal' && scheduleResult && (
              <span>Siap mengimpor <strong className="text-emerald-700">{scheduleResult.validRows}</strong> tugas ke sistem.</span>
            )}
            {activeTab === 'tim' && teamResult && (
              <span>Siap mengimpor <strong className="text-indigo-700">{teamResult.teams.length}</strong> tim.</span>
            )}
            {activeTab === 'desa' && villageResult && (
              <span>Siap mengimpor <strong className="text-sky-700">{villageResult.villages.length}</strong> desa.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={
                loading ||
                (activeTab === 'jadwal' && (!scheduleResult || scheduleResult.schedules.length === 0)) ||
                (activeTab === 'tim' && (!teamResult || teamResult.teams.length === 0)) ||
                (activeTab === 'desa' && (!villageResult || villageResult.villages.length === 0))
              }
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Konfirmasi & Terapkan Impor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
