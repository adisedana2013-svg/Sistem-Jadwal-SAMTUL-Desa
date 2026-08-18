import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  UserCheck, 
  Clock, 
  ShieldCheck, 
  Info,
  X
} from 'lucide-react';
import { ScheduleItem, Team } from '../types';
import { BULAN_INDONESIA, HARI_INDONESIA } from '../constants/initialData';
import { formatDateIndo } from '../utils/scheduleGenerator';

interface CalendarMonthViewProps {
  schedules: ScheduleItem[];
  selectedMonthKey: string; // '2026-08' or 'all'
  availableMonths: string[];
  onSelectMonth: (monthKey: string) => void;
  teams: Team[];
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  schedules,
  selectedMonthKey,
  availableMonths,
  onSelectMonth,
  teams
}) => {
  // Determine current active month in calendar
  const activeMonthKey = selectedMonthKey !== 'all' ? selectedMonthKey : (availableMonths[0] || '2026-08');
  const [yearStr, monthStr] = activeMonthKey.split('-');
  const year = parseInt(yearStr || '2026', 10);
  const monthIdx = parseInt(monthStr || '8', 10) - 1; // 0-based

  const [selectedDaySchedules, setSelectedDaySchedules] = useState<{
    dateStr: string;
    items: ScheduleItem[];
  } | null>(null);

  // Calculate calendar grid days
  const firstDayOfMonth = new Date(year, monthIdx, 1);
  const lastDayOfMonth = new Date(year, monthIdx + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday

  const calendarCells = [];
  // Empty padding cells before 1st of month
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push(null);
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const formattedDateRaw = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = (startDayOfWeek + d - 1) % 7;
    const daySchedules = schedules.filter(s => s.tanggalRaw === formattedDateRaw);
    calendarCells.push({
      dayNumber: d,
      dateRaw: formattedDateRaw,
      dayOfWeek,
      isSunday: dayOfWeek === 0,
      schedules: daySchedules
    });
  }

  const handlePrev = () => {
    const idx = availableMonths.indexOf(activeMonthKey);
    if (idx > 0) {
      onSelectMonth(availableMonths[idx - 1]);
    }
  };

  const handleNext = () => {
    const idx = availableMonths.indexOf(activeMonthKey);
    if (idx >= 0 && idx < availableMonths.length - 1) {
      onSelectMonth(availableMonths[idx + 1]);
    }
  };

  const teamColorMap: Record<string, string> = {
    A: 'bg-blue-100 text-blue-800 border-blue-300',
    B: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    C: 'bg-purple-100 text-purple-800 border-purple-300',
    D: 'bg-amber-100 text-amber-800 border-amber-300',
    E: 'bg-rose-100 text-rose-800 border-rose-300',
    F: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    G: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    H: 'bg-teal-100 text-teal-800 border-teal-300',
    I: 'bg-violet-100 text-violet-800 border-violet-300',
    J: 'bg-orange-100 text-orange-800 border-orange-300',
    K: 'bg-pink-100 text-pink-800 border-pink-300',
    L: 'bg-lime-100 text-lime-800 border-lime-300',
    M: 'bg-sky-100 text-sky-800 border-sky-300',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
      {/* Calendar Header */}
      <div className="px-5 py-4 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10 text-emerald-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              {BULAN_INDONESIA[monthIdx]} {year}
            </h2>
            <p className="text-xs text-slate-300">
              Jadwal Satuan Tugas Pengamanan Lingkungan SAMTUL Desa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={availableMonths.indexOf(activeMonthKey) <= 0}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold px-2.5 py-1 bg-white/10 rounded-md">
            {BULAN_INDONESIA[monthIdx]} {year}
          </span>
          <button
            onClick={handleNext}
            disabled={availableMonths.indexOf(activeMonthKey) >= availableMonths.length - 1}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Bulan Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-700 py-2.5">
        <div className="text-rose-600">MINGGU</div>
        <div>SENIN</div>
        <div>SELASA</div>
        <div>RABU</div>
        <div>KAMIS</div>
        <div>JUMAT</div>
        <div className="text-slate-800">SABTU</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-slate-200">
        {calendarCells.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} className="bg-slate-50/50 min-h-[100px] p-2" />;
          }

          const hasSchedules = cell.schedules.length > 0;

          return (
            <div
              key={cell.dateRaw}
              onClick={() => {
                if (hasSchedules) {
                  setSelectedDaySchedules({
                    dateStr: cell.dateRaw,
                    items: cell.schedules
                  });
                }
              }}
              className={`min-h-[110px] p-2 transition-all flex flex-col justify-between ${
                cell.isSunday 
                  ? 'bg-rose-50/40 text-slate-400' 
                  : 'bg-white hover:bg-slate-50'
              } ${hasSchedules ? 'cursor-pointer hover:shadow-inner' : ''}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    cell.isSunday 
                      ? 'text-rose-600 bg-rose-100/70 font-black' 
                      : 'text-slate-800 bg-slate-100'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {cell.isSunday ? (
                  <span className="text-[10px] font-semibold text-rose-500 bg-rose-100 px-1.5 py-0.5 rounded">
                    Libur
                  </span>
                ) : hasSchedules ? (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-200">
                    {cell.schedules.length} Tim
                  </span>
                ) : null}
              </div>

              {/* Tasks preview in calendar box */}
              <div className="space-y-1 overflow-hidden flex-1">
                {cell.schedules.slice(0, 2).map((sch) => {
                  const colorCls = teamColorMap[sch.timKode] || 'bg-slate-100 text-slate-800 border-slate-300';
                  return (
                    <div
                      key={sch.id}
                      className={`text-[11px] leading-tight px-1.5 py-1 rounded border truncate font-medium ${colorCls}`}
                      title={`Tim ${sch.timKode}: ${sch.desa} (${sch.petugas1} & ${sch.petugas2})`}
                    >
                      <span className="font-bold">Tim {sch.timKode}</span> &bull; {sch.desa}
                    </div>
                  );
                })}

                {cell.schedules.length > 2 && (
                  <div className="text-[10px] text-indigo-600 font-semibold text-center hover:underline">
                    +{cell.schedules.length - 2} tugas lainnya
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Details Modal */}
      {selectedDaySchedules && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Detail Jadwal: {formatDateIndo(selectedDaySchedules.dateStr)}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedDaySchedules.items.length} Penugasan Tim Pengamanan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDaySchedules(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2.5 flex-1 pr-1">
              {selectedDaySchedules.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-900 text-white">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Tim {item.timKode}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Periode {item.periode} &bull; Siklus {item.siklus}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-700">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>Desa Tujuan: {item.desa}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-600 pl-5">
                      <span>Petugas: {item.petugas1} & {item.petugas2}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedDaySchedules(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
