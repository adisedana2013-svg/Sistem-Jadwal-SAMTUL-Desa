import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Team, 
  ScheduleItem, 
  ReportConfig, 
  BackupData, 
  FilterState, 
  ViewMode, 
  ActiveTab 
} from './types';
import { 
  DEFAULT_TIM, 
  DEFAULT_DESA, 
  DEFAULT_TGL_MULAI, 
  DEFAULT_TGL_AKHIR, 
  DEFAULT_REPORT_CONFIG 
} from './constants/initialData';
import { 
  loadInitialAppState, 
  saveAppState 
} from './utils/storage';
import { 
  generateScheduleList, 
  formatDateIndo, 
  getMonthYearKey, 
  recalculatePeriodAndCycle 
} from './utils/scheduleGenerator';
import { 
  exportScheduleToExcel, 
  exportScheduleToPDF 
} from './utils/exportUtils';
import { Header } from './components/Header';
import { MonthlyFilterBar } from './components/MonthlyFilterBar';
import { ScheduleView } from './components/ScheduleView';
import { ScheduleEditor } from './components/ScheduleEditor';
import { TeamManager } from './components/TeamManager';
import { VillageManager } from './components/VillageManager';
import { StatisticsView } from './components/StatisticsView';
import { ReportPrintView } from './components/ReportPrintView';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  // App State initialized from LocalStorage or Defaults
  const [initialData] = useState(() => loadInitialAppState());
  const [teams, setTeams] = useState<Team[]>(initialData.teams);
  const [villages, setVillages] = useState<string[]>(initialData.villages);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialData.schedules);
  const [tglMulai, setTglMulai] = useState<string>(initialData.tglMulai);
  const [tglAkhir, setTglAkhir] = useState<string>(initialData.tglAkhir);
  const [excludeSunday, setExcludeSunday] = useState<boolean>(initialData.excludeSunday);
  const [reportConfig, setReportConfig] = useState<ReportConfig>(initialData.reportConfig);

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('jadwal');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    month: 'all',
    periode: 'all',
    timKode: 'all',
    desa: 'all',
    search: '',
    status: 'all'
  });

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    saveAppState({
      teams,
      villages,
      schedules,
      tglMulai,
      tglAkhir,
      excludeSunday,
      reportConfig
    });
  }, [teams, villages, schedules, tglMulai, tglAkhir, excludeSunday, reportConfig]);

  // Toast Helper
  const addToast = useCallback((type: ToastMessage['type'], message: string, subMessage?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, message, subMessage }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Compute available months dynamically from all schedule rows
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    schedules.forEach((item) => {
      const key = getMonthYearKey(item.tanggalRaw);
      if (key) monthsSet.add(key);
    });
    return Array.from(monthsSet).sort();
  }, [schedules]);

  // Compute maximum period
  const maxPeriod = useMemo(() => {
    if (schedules.length === 0) return 1;
    return Math.max(...schedules.map((s) => s.periode || 1));
  }, [schedules]);

  // Filtered schedules for viewing
  const filteredSchedules = useMemo(() => {
    return schedules.filter((item) => {
      // Month filter
      if (filters.month !== 'all') {
        const itemMonth = getMonthYearKey(item.tanggalRaw);
        if (itemMonth !== filters.month) return false;
      }
      // Periode filter
      if (filters.periode !== 'all') {
        if (item.periode.toString() !== filters.periode) return false;
      }
      // Tim filter
      if (filters.timKode !== 'all') {
        if (item.timKode !== filters.timKode) return false;
      }
      // Desa filter
      if (filters.desa !== 'all') {
        if (item.desa !== filters.desa) return false;
      }
      // Search query
      if (filters.search.trim() !== '') {
        const q = filters.search.toLowerCase();
        const matches =
          item.desa.toLowerCase().includes(q) ||
          item.petugas1.toLowerCase().includes(q) ||
          item.petugas2.toLowerCase().includes(q) ||
          item.timKode.toLowerCase().includes(q) ||
          item.tanggal.includes(q) ||
          item.hari.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [schedules, filters]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      month: 'all',
      periode: 'all',
      timKode: 'all',
      desa: 'all',
      search: '',
      status: 'all'
    });
    addToast('info', 'Filter berhasil direset');
  };

  // Quick export handlers
  const handleQuickExportExcel = () => {
    try {
      const dataToExport = filteredSchedules.length > 0 ? filteredSchedules : schedules;
      exportScheduleToExcel(dataToExport);
      addToast('success', 'Berhasil mengekspor Excel', `${dataToExport.length} baris jadwal diekspor.`);
    } catch (err: any) {
      addToast('error', 'Gagal ekspor Excel', err.message);
    }
  };

  const handleQuickExportPDF = () => {
    try {
      const dataToExport = filteredSchedules.length > 0 ? filteredSchedules : schedules;
      const filterInfo = filters.month !== 'all' ? `Bulan ${filters.month}` : undefined;
      exportScheduleToPDF(dataToExport, reportConfig, tglMulai, tglAkhir, filterInfo);
      addToast('success', 'Berhasil membuat dokumen PDF', `${dataToExport.length} baris jadwal dibuat.`);
    } catch (err: any) {
      addToast('error', 'Gagal membuat PDF', err.message);
    }
  };

  // Schedule Management Handlers
  const handleSaveScheduleRow = (updatedItem: ScheduleItem) => {
    const updated = schedules.map((s) => (s.id === updatedItem.id ? updatedItem : s));
    setSchedules(updated);
    addToast('success', 'Jadwal berhasil diperbarui', `Tugas Tim ${updatedItem.timKode} pada ${updatedItem.tanggal}`);
  };

  const handleDeleteScheduleRow = (id: string | number) => {
    const updated = schedules.filter((s) => s.id !== id);
    setSchedules(updated);
    addToast('info', 'Baris jadwal dihapus');
  };

  const handleAddScheduleRow = (newItem: Partial<ScheduleItem>) => {
    const newRow: ScheduleItem = {
      id: `sch-manual-${Date.now()}`,
      tanggal: newItem.tanggal || '',
      tanggalRaw: newItem.tanggalRaw || '',
      hari: newItem.hari || '',
      timKode: newItem.timKode || 'A',
      petugas1: newItem.petugas1 || '',
      petugas2: newItem.petugas2 || '',
      desa: newItem.desa || '',
      periode: maxPeriod,
      siklus: 1,
      status: newItem.status || 'terjadwal',
      keterangan: newItem.keterangan || ''
    };
    const updated = [...schedules, newRow].sort((a, b) => a.tanggalRaw.localeCompare(b.tanggalRaw));
    setSchedules(updated);
    addToast('success', 'Tugas baru berhasil ditambahkan', `${newRow.tanggal} &bull; Tim ${newRow.timKode}`);
  };

  const handleSwapSchedules = (id1: string | number, id2: string | number) => {
    const item1 = schedules.find((s) => s.id === id1);
    const item2 = schedules.find((s) => s.id === id2);
    if (!item1 || !item2) return;

    const updated = schedules.map((s) => {
      if (s.id === id1) {
        return {
          ...s,
          timKode: item2.timKode,
          petugas1: item2.petugas1,
          petugas2: item2.petugas2
        };
      }
      if (s.id === id2) {
        return {
          ...s,
          timKode: item1.timKode,
          petugas1: item1.petugas1,
          petugas2: item1.petugas2
        };
      }
      return s;
    });

    setSchedules(updated);
    addToast('success', 'Pertukaran jadwal berhasil', `Tim ${item1.timKode} &bull; Tim ${item2.timKode}`);
  };

  const handleRegenerateAll = (newStart: string, newEnd: string, newExcludeSunday: boolean) => {
    setTglMulai(newStart);
    setTglAkhir(newEnd);
    setExcludeSunday(newExcludeSunday);

    const generated = generateScheduleList(teams, villages, newStart, newEnd, newExcludeSunday);
    setSchedules(generated);
    addToast('success', 'Regenerasi jadwal selesai', `${generated.length} penugasan dibuat (${newStart} s.d. ${newEnd})`);
  };

  const handleResetAllDefault = () => {
    if (confirm('Apakah Anda yakin ingin mereset seluruh data jadwal, tim, dan desa ke default awal?')) {
      const defTeams = JSON.parse(JSON.stringify(DEFAULT_TIM));
      const defVillages = JSON.parse(JSON.stringify(DEFAULT_DESA));
      const defStart = DEFAULT_TGL_MULAI;
      const defEnd = DEFAULT_TGL_AKHIR;
      const defExclude = true;

      setTeams(defTeams);
      setVillages(defVillages);
      setTglMulai(defStart);
      setTglAkhir(defEnd);
      setExcludeSunday(defExclude);
      setReportConfig(DEFAULT_REPORT_CONFIG);

      const generated = generateScheduleList(defTeams, defVillages, defStart, defEnd, defExclude);
      setSchedules(generated);

      addToast('success', 'Seluruh data berhasil direset ke default');
    }
  };

  // Team & Village Handlers
  const handleSaveTeams = (newTeams: Team[]) => {
    setTeams(newTeams);
    // update officer names in schedules
    const updatedSchedules = schedules.map((sch) => {
      const matchTeam = newTeams.find((t) => t.kode === sch.timKode);
      if (matchTeam) {
        return {
          ...sch,
          petugas1: matchTeam.p1,
          petugas2: matchTeam.p2
        };
      }
      return sch;
    });
    setSchedules(updatedSchedules);
    addToast('success', 'Data Tim berhasil disimpan');
  };

  const handleResetTeamsDefault = () => {
    if (confirm('Reset daftar tim ke 13 Tim default?')) {
      handleSaveTeams(JSON.parse(JSON.stringify(DEFAULT_TIM)));
    }
  };

  const handleSaveVillages = (newVillages: string[]) => {
    setVillages(newVillages);
    addToast('success', 'Daftar Desa diperbarui', `Total ${newVillages.length} Desa`);
  };

  const handleResetVillagesDefault = () => {
    if (confirm('Reset daftar desa ke 49 Desa default?')) {
      setVillages(JSON.parse(JSON.stringify(DEFAULT_DESA)));
      addToast('success', 'Daftar desa direset ke 49 Desa default');
    }
  };

  // Restore State from JSON
  const handleRestoreState = (backupData: BackupData) => {
    setTeams(backupData.teams);
    setVillages(backupData.villages);
    setSchedules(backupData.schedules);
    setTglMulai(backupData.tglMulai);
    setTglAkhir(backupData.tglAkhir);
    setExcludeSunday(backupData.excludeSunday);
    if (backupData.reportConfig) {
      setReportConfig(backupData.reportConfig);
    }
    setActiveTab('jadwal');
    addToast(
      'success',
      'Data JSON berhasil dipulihkan!',
      `${backupData.schedules.length} jadwal, ${backupData.teams.length} tim, ${backupData.villages.length} desa dimuat.`
    );
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col justify-between">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div>
        {/* Navigation Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          totalSchedules={schedules.length}
          totalTeams={teams.length}
          totalVillages={villages.length}
          tglMulaiFormatted={formatDateIndo(tglMulai)}
          tglAkhirFormatted={formatDateIndo(tglAkhir)}
          onQuickExportExcel={handleQuickExportExcel}
          onQuickExportPDF={handleQuickExportPDF}
          onOpenBackupModal={() => setActiveTab('backup')}
          onOpenPrintReport={() => setActiveTab('laporan')}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* TAB 1: JADWAL TUGAS (With Monthly Filter Bar) */}
          {activeTab === 'jadwal' && (
            <div>
              <MonthlyFilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                availableMonths={availableMonths}
                maxPeriod={maxPeriod}
                teams={teams}
                villages={villages}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filteredCount={filteredSchedules.length}
                totalCount={schedules.length}
              />

              <ScheduleView
                schedules={filteredSchedules}
                allSchedules={schedules}
                teams={teams}
                villages={villages}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filters={filters}
                onFilterChange={handleFilterChange}
                availableMonths={availableMonths}
                onOpenEditTab={() => setActiveTab('kelola')}
              />
            </div>
          )}

          {/* TAB 2: KELOLA & EDIT JADWAL */}
          {activeTab === 'kelola' && (
            <ScheduleEditor
              schedules={schedules}
              teams={teams}
              villages={villages}
              onSaveScheduleRow={handleSaveScheduleRow}
              onDeleteScheduleRow={handleDeleteScheduleRow}
              onAddScheduleRow={handleAddScheduleRow}
              onSwapSchedules={handleSwapSchedules}
              onRegenerateAll={handleRegenerateAll}
              onResetAllDefault={handleResetAllDefault}
              tglMulai={tglMulai}
              tglAkhir={tglAkhir}
              excludeSunday={excludeSunday}
            />
          )}

          {/* TAB 3: KELOLA TIM */}
          {activeTab === 'tim' && (
            <TeamManager
              teams={teams}
              schedules={schedules}
              onSaveTeams={handleSaveTeams}
              onResetTeamsDefault={handleResetTeamsDefault}
            />
          )}

          {/* TAB 4: DATA MASTER DESA */}
          {activeTab === 'desa' && (
            <VillageManager
              villages={villages}
              schedules={schedules}
              onSaveVillages={handleSaveVillages}
              onResetVillagesDefault={handleResetVillagesDefault}
            />
          )}

          {/* TAB 5: STATISTIK & ANALISIS */}
          {activeTab === 'statistik' && (
            <StatisticsView
              schedules={filteredSchedules}
              allSchedules={schedules}
              teams={teams}
              villages={villages}
              availableMonths={availableMonths}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          )}

          {/* TAB 6: CETAK LAPORAN RESMI */}
          {activeTab === 'laporan' && (
            <ReportPrintView
              schedules={filteredSchedules}
              allSchedules={schedules}
              teams={teams}
              villages={villages}
              reportConfig={reportConfig}
              onUpdateReportConfig={(newCfg) => {
                setReportConfig(newCfg);
                addToast('success', 'Konfigurasi KOP & TTD berhasil disimpan');
              }}
              tglMulai={tglMulai}
              tglAkhir={tglAkhir}
              availableMonths={availableMonths}
            />
          )}

          {/* TAB 7: BACKUP & RESTORE JSON */}
          {activeTab === 'backup' && (
            <BackupRestoreModal
              isOpen={true}
              onClose={() => setActiveTab('jadwal')}
              currentState={{
                teams,
                villages,
                schedules,
                tglMulai,
                tglAkhir,
                excludeSunday,
                reportConfig
              }}
              onRestoreState={handleRestoreState}
              onResetAllDefault={handleResetAllDefault}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>
            Aplikasi Jadwal SAMTUL Desa &bull; Periode {formatDateIndo(tglMulai)} s.d. {formatDateIndo(tglAkhir)}
          </p>
          <div className="flex items-center gap-3">
            <span>{teams.length} Tim</span>
            <span>&bull;</span>
            <span>{villages.length} Desa</span>
            <span>&bull;</span>
            <span>{schedules.length} Total Penugasan</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
