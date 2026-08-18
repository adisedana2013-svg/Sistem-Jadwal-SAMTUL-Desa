import React, { useState } from 'react';
import { ScheduleItem, Team, FilterState } from '../types';
import { 
  BarChart3, 
  FileSpreadsheet, 
  FileDown, 
  CheckCircle, 
  TrendingUp, 
  Award, 
  Activity,
  Layers,
  Users,
  Building,
  CheckCheck
} from 'lucide-react';
import { exportStatsToExcel } from '../utils/exportUtils';
import { getMonthYearLabel } from '../utils/scheduleGenerator';

interface StatisticsViewProps {
  schedules: ScheduleItem[];
  allSchedules: ScheduleItem[];
  teams: Team[];
  villages: string[];
  availableMonths: string[];
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  schedules,
  allSchedules,
  teams,
  villages,
  availableMonths,
  filters,
  onFilterChange
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(filters.month);

  // Compute stats according to selectedMonth
  const targetSchedules = selectedMonth === 'all' 
    ? allSchedules 
    : allSchedules.filter(s => s.tanggalRaw.startsWith(selectedMonth));

  const totalTugas = targetSchedules.length;
  const totalTim = teams.length;
  const totalPetugas = teams.length * 2;
  const rataRata = totalTim > 0 ? (totalTugas / totalTim).toFixed(1) : '0';

  // Workload per team
  const teamStats = teams.map((t) => {
    const count = targetSchedules.filter((s) => s.timKode === t.kode).length;
    const pct = totalTugas > 0 ? ((count / totalTugas) * 100).toFixed(1) : '0.0';
    return {
      kode: t.kode,
      p1: t.p1,
      p2: t.p2,
      total: count,
      persen: `${pct}%`
    };
  }).sort((a, b) => b.total - a.total);

  // Village coverage stats
  const villageStats = villages.map((v) => {
    const count = targetSchedules.filter((s) => s.desa === v).length;
    return { name: v, count };
  }).sort((a, b) => b.count - a.count);

  const coveredVillagesCount = villageStats.filter(v => v.count > 0).length;
  const coveragePercent = villages.length > 0 ? ((coveredVillagesCount / villages.length) * 100).toFixed(0) : '0';

  const handleExportStats = () => {
    exportStatsToExcel(teamStats, totalTugas);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Statistik & Rekapitulasi Beban Tugas
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analisis pemerataan tugas petugas pengamanan dan cakupan desa
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              onFilterChange({ month: e.target.value });
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold outline-none"
          >
            <option value="all">📊 Semua Bulan</option>
            {availableMonths.map((mKey) => (
              <option key={mKey} value={mKey}>{getMonthYearLabel(mKey)}</option>
            ))}
          </select>

          <button
            onClick={handleExportStats}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Statistik</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Penugasan</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalTugas}</div>
          <div className="text-[11px] text-slate-500 mt-1">Jadwal Tugas Aktif</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Rata-rata / Tim</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{rataRata} <span className="text-xs font-normal text-slate-500">tugas</span></div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Distribusi Seimbang</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Cakupan Desa</span>
            <Building className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-900">{coveredVillagesCount} / {villages.length}</div>
          <div className="text-[11px] text-sky-600 font-medium mt-1">{coveragePercent}% desa terlayani</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Personel</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900">{totalPetugas}</div>
          <div className="text-[11px] text-slate-500 mt-1">Dalam {totalTim} Tim Lapangan</div>
        </div>
      </div>

      {/* Team Workload Bars */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Peringkat & Beban Kerja per Tim</span>
          </span>
          <span className="text-xs font-normal text-slate-500">
            {selectedMonth === 'all' ? 'Seluruh Periode' : getMonthYearLabel(selectedMonth)}
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamStats.map((item, idx) => {
            const maxVal = teamStats[0]?.total || 1;
            const progress = maxVal > 0 ? (item.total / maxVal) * 100 : 0;

            return (
              <div key={item.kode} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                      {item.kode}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{item.p1}</div>
                      <div className="text-[10px] text-slate-500">& {item.p2}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-sm text-slate-900">{item.total} <span className="text-[10px] font-normal text-slate-500">tugas</span></div>
                    <div className="text-[10px] font-semibold text-indigo-600">{item.persen}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table Detailed Recap */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
          <span>Tabel Rincian Rekapitulasi Tim</span>
          <span className="text-slate-300 font-normal">{teamStats.length} Tim</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <th className="p-3 w-12 text-center">No</th>
                <th className="p-3 w-16 text-center">Tim</th>
                <th className="p-3 min-w-[220px]">Petugas 1</th>
                <th className="p-3 min-w-[220px]">Petugas 2</th>
                <th className="p-3 w-28 text-center">Jumlah Tugas</th>
                <th className="p-3 w-28 text-center">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {teamStats.map((s, idx) => (
                <tr key={s.kode} className="hover:bg-slate-50">
                  <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                  <td className="p-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded font-black text-xs bg-slate-900 text-white">
                      {s.kode}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-900">{s.p1}</td>
                  <td className="p-3 font-semibold text-slate-900">{s.p2}</td>
                  <td className="p-3 text-center font-bold text-slate-900">{s.total}</td>
                  <td className="p-3 text-center font-semibold text-indigo-700">{s.persen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
