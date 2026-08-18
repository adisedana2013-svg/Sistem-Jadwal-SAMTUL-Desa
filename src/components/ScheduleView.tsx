import React, { useState } from 'react';
import { 
  ScheduleItem, 
  ViewMode, 
  Team, 
  FilterState 
} from '../types';
import { CalendarMonthView } from './CalendarMonthView';
import { 
  Shield, 
  MapPin, 
  User, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Sparkles,
  Info
} from 'lucide-react';
import { formatDateIndo } from '../utils/scheduleGenerator';

interface ScheduleViewProps {
  schedules: ScheduleItem[];
  allSchedules: ScheduleItem[];
  teams: Team[];
  villages: string[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  availableMonths: string[];
  onOpenEditTab: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedules,
  allSchedules,
  teams,
  villages,
  viewMode,
  onViewModeChange,
  filters,
  onFilterChange,
  availableMonths,
  onOpenEditTab
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const totalRows = schedules.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIdx = (safePage - 1) * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, totalRows);
  const currentRows = schedules.slice(startIdx, endIdx);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const getTeamPillClass = (timKode: string) => {
    const map: Record<string, string> = {
      A: 'bg-blue-50 text-blue-800 border-blue-200',
      B: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      C: 'bg-purple-50 text-purple-800 border-purple-200',
      D: 'bg-amber-50 text-amber-800 border-amber-200',
      E: 'bg-rose-50 text-rose-800 border-rose-200',
      F: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      G: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      H: 'bg-teal-50 text-teal-800 border-teal-200',
      I: 'bg-violet-50 text-violet-800 border-violet-200',
      J: 'bg-orange-50 text-orange-800 border-orange-200',
      K: 'bg-pink-50 text-pink-800 border-pink-200',
      L: 'bg-lime-50 text-lime-800 border-lime-200',
      M: 'bg-sky-50 text-sky-800 border-sky-200',
    };
    return map[timKode] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  if (viewMode === 'calendar') {
    return (
      <CalendarMonthView
        schedules={schedules}
        selectedMonthKey={filters.month}
        availableMonths={availableMonths}
        onSelectMonth={(mKey) => onFilterChange({ month: mKey })}
        teams={teams}
      />
    );
  }

  if (viewMode === 'matrix') {
    // Group schedules by date
    const datesMap = new Map<string, { tanggal: string; hari: string; raw: string; items: ScheduleItem[] }>();
    schedules.forEach((item) => {
      if (!datesMap.has(item.tanggalRaw)) {
        datesMap.set(item.tanggalRaw, {
          tanggal: item.tanggal,
          hari: item.hari,
          raw: item.tanggalRaw,
          items: []
        });
      }
      datesMap.get(item.tanggalRaw)!.items.push(item);
    });

    const dateList = Array.from(datesMap.values()).sort((a, b) => a.raw.localeCompare(b.raw));

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold tracking-tight">Matriks Distribusi Tim per Tanggal</h3>
          </div>
          <span className="text-xs text-slate-300">
            {dateList.length} Tanggal Penugasan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3 w-28 whitespace-nowrap">Tanggal & Hari</th>
                {teams.map((t) => (
                  <th key={t.kode} className="p-2.5 text-center whitespace-nowrap min-w-[120px] border-l border-slate-200">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-white font-bold">
                      Tim {t.kode}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {dateList.map((dRow) => (
                <tr key={dRow.raw} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-semibold text-slate-900 bg-slate-50/50">
                    <div>{dRow.tanggal}</div>
                    <div className="text-[10px] text-slate-500 font-bold">{dRow.hari}</div>
                  </td>
                  {teams.map((t) => {
                    const match = dRow.items.find((item) => item.timKode === t.kode);
                    return (
                      <td key={t.kode} className="p-2 border-l border-slate-100 text-center align-middle">
                        {match ? (
                          <div className={`p-1.5 rounded-lg border text-[11px] font-medium leading-tight ${getTeamPillClass(t.kode)}`}>
                            <div className="font-bold truncate">{match.desa}</div>
                            <div className="text-[9px] opacity-75">P-{match.periode} &bull; S-{match.siklus}</div>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono text-[11px]">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
      {/* Table Top Header Info */}
      <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span className="text-xs sm:text-sm font-bold tracking-tight">
            Tabel Rincian Jadwal Penugasan SAMTUL
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span>Menampilkan baris {totalRows > 0 ? startIdx + 1 : 0} - {endIdx} dari {totalRows}</span>
        </div>
      </div>

      {/* Table Component */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse" id="jadwalTable">
          <thead>
            <tr className="bg-slate-100/90 text-slate-800 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 w-12 text-center">No</th>
              <th className="py-3 px-3 w-28 whitespace-nowrap">Tanggal</th>
              <th className="py-3 px-3 w-24 whitespace-nowrap">Hari</th>
              <th className="py-3 px-3 w-20 text-center whitespace-nowrap">Tim</th>
              <th className="py-3 px-4 min-w-[220px]">Nama Petugas</th>
              <th className="py-3 px-4 min-w-[170px]">Desa Pengamanan</th>
              <th className="py-3 px-3 w-20 text-center whitespace-nowrap">Periode</th>
              <th className="py-3 px-3 w-20 text-center whitespace-nowrap">Siklus</th>
              <th className="py-3 px-3 w-24 text-center whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700" id="tableBody">
            {currentRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Info className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">Tidak ada jadwal yang sesuai dengan filter.</p>
                    <button
                      onClick={onOpenEditTab}
                      className="mt-1 text-xs text-indigo-600 font-semibold hover:underline"
                    >
                      Buka Kelola Jadwal untuk menambah atau mereset data &rarr;
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              currentRows.map((row, idx) => {
                const globalIndex = startIdx + idx + 1;
                const pillCls = getTeamPillClass(row.timKode);

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-indigo-50/40 transition-colors group"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {globalIndex}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {row.tanggal}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {row.hari}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black border shadow-2xs ${pillCls}`}>
                        {row.timKode}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900 leading-tight">
                        {row.petugas1}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        & {row.petugas2}
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="inline-flex items-center gap-1 font-semibold text-indigo-950 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{row.desa}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                        P-{row.periode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        S-{row.siklus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {row.status || 'Terjadwal'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Halaman <span className="font-bold text-slate-800">{safePage}</span> dari {totalPages}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(1)}
              disabled={safePage === 1}
              className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  return (
                    <React.Fragment key={p}>
                      {prev && p - prev > 1 && <span className="px-1 text-slate-400">...</span>}
                      <button
                        onClick={() => goToPage(p)}
                        className={`min-w-[28px] h-7 px-2 rounded-md font-semibold transition-all ${
                          p === safePage
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
