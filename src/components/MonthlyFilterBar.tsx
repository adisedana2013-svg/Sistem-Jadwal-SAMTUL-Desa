import React from 'react';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Calendar, 
  Table as TableIcon, 
  LayoutGrid, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  MapPin,
  Clock
} from 'lucide-react';
import { FilterState, ViewMode, Team } from '../types';
import { getMonthYearLabel } from '../utils/scheduleGenerator';

interface MonthlyFilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  availableMonths: string[]; // e.g. ['2026-08', '2026-09']
  maxPeriod: number;
  teams: Team[];
  villages: string[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filteredCount: number;
  totalCount: number;
}

export const MonthlyFilterBar: React.FC<MonthlyFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableMonths,
  maxPeriod,
  teams,
  villages,
  viewMode,
  onViewModeChange,
  filteredCount,
  totalCount
}) => {
  const currentMonthIndex = availableMonths.indexOf(filters.month);

  const handlePrevMonth = () => {
    if (filters.month === 'all' && availableMonths.length > 0) {
      onFilterChange({ month: availableMonths[0] });
    } else if (currentMonthIndex > 0) {
      onFilterChange({ month: availableMonths[currentMonthIndex - 1] });
    }
  };

  const handleNextMonth = () => {
    if (filters.month === 'all' && availableMonths.length > 0) {
      onFilterChange({ month: availableMonths[0] });
    } else if (currentMonthIndex >= 0 && currentMonthIndex < availableMonths.length - 1) {
      onFilterChange({ month: availableMonths[currentMonthIndex + 1] });
    }
  };

  const isFiltered = 
    filters.month !== 'all' || 
    filters.periode !== 'all' || 
    filters.timKode !== 'all' || 
    filters.desa !== 'all' || 
    filters.search.trim() !== '' ||
    filters.status !== 'all';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-6 transition-all no-print">
      {/* Top Row: Month Navigation Pills & View Switcher */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        
        {/* Month Selector Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 mr-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filter Bulan:</span>
          </div>

          <button
            id="filter-month-all"
            onClick={() => onFilterChange({ month: 'all' })}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filters.month === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Bulan
          </button>

          {availableMonths.map((mKey) => (
            <button
              key={mKey}
              id={`filter-month-${mKey}`}
              onClick={() => onFilterChange({ month: mKey })}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filters.month === mKey
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {getMonthYearLabel(mKey)}
            </button>
          ))}

          {/* Prev / Next Month arrows */}
          {availableMonths.length > 1 && (
            <div className="flex items-center gap-1 ml-1 border-l border-slate-200 pl-2">
              <button
                id="btn-prev-month"
                onClick={handlePrevMonth}
                disabled={currentMonthIndex <= 0 && filters.month !== 'all'}
                className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="btn-next-month"
                onClick={handleNextMonth}
                disabled={currentMonthIndex >= availableMonths.length - 1}
                className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* View Mode Toggle & Result count */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <div className="text-xs text-slate-500 font-medium">
            Menampilkan <span className="font-bold text-slate-900">{filteredCount}</span> dari {totalCount} jadwal
          </div>

          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              id="view-mode-table"
              onClick={() => onViewModeChange('table')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'table' ? 'bg-white text-indigo-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Tabel Detail"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
            <button
              id="view-mode-calendar"
              onClick={() => onViewModeChange('calendar')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'calendar' ? 'bg-white text-indigo-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Kalender Bulanan"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kalender</span>
            </button>
            <button
              id="view-mode-matrix"
              onClick={() => onViewModeChange('matrix')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'matrix' ? 'bg-white text-indigo-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Matriks Tim vs Tanggal"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Matriks Tim</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Detailed Filters (Search, Team, Desa, Periode, Reset) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-3">
        {/* Search Query */}
        <div className="relative col-span-1 sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="filter-search-input"
            type="text"
            placeholder="Cari nama petugas, desa, atau kode..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Tim Dropdown */}
        <div>
          <select
            id="filter-select-tim"
            value={filters.timKode}
            onChange={(e) => onFilterChange({ timKode: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700 font-medium"
          >
            <option value="all">👥 Semua Tim ({teams.length})</option>
            {teams.map((t) => (
              <option key={t.kode} value={t.kode}>
                Tim {t.kode} ({t.p1.split(' ')[0]} & {t.p2.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>

        {/* Desa Dropdown */}
        <div>
          <select
            id="filter-select-desa"
            value={filters.desa}
            onChange={(e) => onFilterChange({ desa: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700 font-medium"
          >
            <option value="all">🏘️ Semua Desa ({villages.length})</option>
            {villages.map((d) => (
              <option key={d} value={d}>
                Desa {d}
              </option>
            ))}
          </select>
        </div>

        {/* Periode Dropdown */}
        <div>
          <select
            id="filter-select-periode"
            value={filters.periode}
            onChange={(e) => onFilterChange({ periode: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700 font-medium"
          >
            <option value="all">🔄 Semua Periode</option>
            {Array.from({ length: maxPeriod }, (_, i) => i + 1).map((p) => (
              <option key={p} value={p.toString()}>
                Periode {p}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        <div>
          <button
            id="btn-reset-filters"
            onClick={onResetFilters}
            disabled={!isFiltered}
            className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isFiltered
                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>
      </div>
    </div>
  );
};
