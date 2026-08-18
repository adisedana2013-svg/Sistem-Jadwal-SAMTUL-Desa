import React from 'react';
import { 
  CalendarDays, 
  CalendarCheck, 
  Users, 
  MapPin, 
  BarChart3, 
  Printer, 
  Database,
  FileSpreadsheet,
  FileDown,
  RefreshCw,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  totalSchedules: number;
  totalTeams: number;
  totalVillages: number;
  tglMulaiFormatted: string;
  tglAkhirFormatted: string;
  onQuickExportExcel: () => void;
  onQuickExportPDF: () => void;
  onOpenBackupModal: () => void;
  onOpenPrintReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  totalSchedules,
  totalTeams,
  totalVillages,
  tglMulaiFormatted,
  tglAkhirFormatted,
  onQuickExportExcel,
  onQuickExportPDF,
  onOpenBackupModal,
  onOpenPrintReport
}) => {
  const tabs = [
    { id: 'jadwal' as ActiveTab, label: 'Jadwal Tugas', icon: CalendarDays, desc: 'Lihat Kalender & Tabel' },
    { id: 'kelola' as ActiveTab, label: 'Kelola Jadwal', icon: CalendarCheck, desc: 'Edit & Atur Penugasan' },
    { id: 'tim' as ActiveTab, label: 'Kelola Tim', icon: Users, desc: `${totalTeams} Tim Petugas` },
    { id: 'desa' as ActiveTab, label: 'Data Master', icon: MapPin, desc: `${totalVillages} Desa & Wilayah` },
    { id: 'statistik' as ActiveTab, label: 'Statistik & Analisis', icon: BarChart3, desc: 'Beban Kerja & Cakupan' },
    { id: 'laporan' as ActiveTab, label: 'Cetak Laporan', icon: Printer, desc: 'KOP & Tanda Tangan' },
    { id: 'backup' as ActiveTab, label: 'Backup / Restore JSON', icon: Database, desc: 'Impor / Ekspor Data' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30 no-print">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center text-white shadow-md shadow-indigo-950/20">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                SISTEM JADWAL SAMTUL DESA
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Tahun 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>Satuan Pengamanan Lingkungan</span>
              <span className="text-slate-300">•</span>
              <span>{tglMulaiFormatted} s.d. {tglAkhirFormatted}</span>
              <span className="text-slate-300">•</span>
              <span className="text-indigo-600 font-medium">{totalVillages} Desa & {totalTeams} Tim</span>
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            id="btn-quick-report"
            onClick={onOpenPrintReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all active:scale-95"
            title="Buka Cetak Laporan Resmi"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Laporan</span>
          </button>

          <button
            id="btn-quick-excel"
            onClick={onQuickExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95"
            title="Ekspor Jadwal ke Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            id="btn-quick-pdf"
            onClick={onQuickExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all active:scale-95"
            title="Ekspor Jadwal ke PDF"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          <button
            id="btn-quick-backup"
            onClick={onOpenBackupModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-all active:scale-95"
            title="Backup & Restore JSON"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>JSON Backup</span>
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 py-1.5 min-w-max" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-nav-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-900 shadow-xs border border-indigo-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.id === 'jadwal' && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
                    {totalSchedules}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
