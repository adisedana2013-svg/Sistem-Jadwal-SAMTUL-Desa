import { Team, ScheduleItem } from '../types';
import { HARI_INDONESIA, BULAN_INDONESIA } from '../constants/initialData';

export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const tgl = d.getDate();
  const bln = BULAN_INDONESIA[d.getMonth()];
  const thn = d.getFullYear();
  return `${tgl} ${bln} ${thn}`;
}

export function formatDateDDMMYYYY(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateYYYYMMDD(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getMonthYearKey(dateStr: string): string {
  // dateStr can be 'YYYY-MM-DD' or 'DD/MM/YYYY'
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    return `${parts[0]}-${parts[1]}`;
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    return `${parts[2]}-${parts[1]}`;
  }
  return '';
}

export function getMonthYearLabel(monthKey: string): string {
  // monthKey format: 'YYYY-MM'
  if (!monthKey || monthKey === 'all') return 'Semua Bulan';
  const [year, month] = monthKey.split('-');
  const monthIdx = parseInt(month, 10) - 1;
  return `${BULAN_INDONESIA[monthIdx] || month} ${year}`;
}

export function generateScheduleList(
  teams: Team[],
  villages: string[],
  tglMulai: string,
  tglAkhir: string,
  excludeSunday: boolean = true
): ScheduleItem[] {
  if (teams.length === 0 || villages.length === 0) return [];

  const hasil: ScheduleItem[] = [];
  let current = parseDate(tglMulai);
  const akhir = parseDate(tglAkhir);

  let idxTim = 0;
  let idxDesa = 0;
  let periode = 1;
  let siklus = 1;
  const urutanTim = teams.map((_, i) => i);

  while (current <= akhir) {
    const day = current.getDay();
    // If excludeSunday is true, skip Sunday (day 0)
    if (!excludeSunday || day !== 0) {
      const timIdx = urutanTim[idxTim % teams.length];
      const tim = teams[timIdx] || teams[0];
      const desa = villages[idxDesa % villages.length] || villages[0];

      const tglFormatted = formatDateDDMMYYYY(current);
      const tglRaw = formatDateYYYYMMDD(current);
      const hariStr = HARI_INDONESIA[day];

      hasil.push({
        id: `sch-${hasil.length + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        tanggal: tglFormatted,
        tanggalRaw: tglRaw,
        hari: hariStr,
        timKode: tim.kode,
        petugas1: tim.p1,
        petugas2: tim.p2,
        desa: desa,
        periode: periode,
        siklus: siklus,
        status: 'terjadwal',
        keterangan: '',
        _edit: false,
        _original: null
      });

      idxTim++;
      idxDesa++;

      // When all villages in the list are covered, advance cycle & rotate team order
      if (idxDesa % villages.length === 0) {
        siklus++;
        if (urutanTim.length > 1) {
          const first = urutanTim.shift();
          if (first !== undefined) {
            urutanTim.push(first);
          }
        }
        periode++;
      }
    }
    current = addDays(current, 1);
  }

  return hasil;
}

export function recalculatePeriodAndCycle(schedules: ScheduleItem[], villageCount: number): ScheduleItem[] {
  let periode = 1;
  let siklus = 1;
  let idxDesa = 0;

  return schedules.map((item) => {
    const updated = {
      ...item,
      periode,
      siklus
    };
    idxDesa++;
    if (villageCount > 0 && idxDesa % villageCount === 0) {
      siklus++;
      periode++;
    }
    return updated;
  });
}
