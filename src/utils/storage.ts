import { Team, ScheduleItem, ReportConfig, BackupData } from '../types';
import { DEFAULT_TIM, DEFAULT_DESA, DEFAULT_TGL_MULAI, DEFAULT_TGL_AKHIR, DEFAULT_REPORT_CONFIG } from '../constants/initialData';
import { generateScheduleList } from './scheduleGenerator';

const STORAGE_KEYS = {
  TEAMS: 'samtul_teams_v2',
  VILLAGES: 'samtul_villages_v2',
  SCHEDULES: 'samtul_schedules_v2',
  TGL_MULAI: 'samtul_tgl_mulai_v2',
  TGL_AKHIR: 'samtul_tgl_akhir_v2',
  EXCLUDE_SUNDAY: 'samtul_exclude_sunday_v2',
  REPORT_CONFIG: 'samtul_report_config_v2',
  SNAPSHOTS: 'samtul_saved_snapshots_v2'
};

export interface LocalSnapshot {
  id: string;
  name: string;
  timestamp: string;
  data: BackupData;
}

export function loadInitialAppState(): {
  teams: Team[];
  villages: string[];
  schedules: ScheduleItem[];
  tglMulai: string;
  tglAkhir: string;
  excludeSunday: boolean;
  reportConfig: ReportConfig;
} {
  try {
    const rawTeams = localStorage.getItem(STORAGE_KEYS.TEAMS);
    const rawVillages = localStorage.getItem(STORAGE_KEYS.VILLAGES);
    const rawSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    const rawTglMulai = localStorage.getItem(STORAGE_KEYS.TGL_MULAI);
    const rawTglAkhir = localStorage.getItem(STORAGE_KEYS.TGL_AKHIR);
    const rawExcludeSunday = localStorage.getItem(STORAGE_KEYS.EXCLUDE_SUNDAY);
    const rawReportConfig = localStorage.getItem(STORAGE_KEYS.REPORT_CONFIG);

    const teams: Team[] = rawTeams ? JSON.parse(rawTeams) : DEFAULT_TIM;
    const villages: string[] = rawVillages ? JSON.parse(rawVillages) : DEFAULT_DESA;
    const tglMulai = rawTglMulai || DEFAULT_TGL_MULAI;
    const tglAkhir = rawTglAkhir || DEFAULT_TGL_AKHIR;
    const excludeSunday = rawExcludeSunday !== null ? JSON.parse(rawExcludeSunday) : true;
    const reportConfig: ReportConfig = rawReportConfig ? { ...DEFAULT_REPORT_CONFIG, ...JSON.parse(rawReportConfig) } : DEFAULT_REPORT_CONFIG;

    let schedules: ScheduleItem[] = [];
    if (rawSchedules) {
      schedules = JSON.parse(rawSchedules);
    } else {
      schedules = generateScheduleList(teams, villages, tglMulai, tglAkhir, excludeSunday);
    }

    return {
      teams,
      villages,
      schedules,
      tglMulai,
      tglAkhir,
      excludeSunday,
      reportConfig
    };
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    return {
      teams: DEFAULT_TIM,
      villages: DEFAULT_DESA,
      schedules: generateScheduleList(DEFAULT_TIM, DEFAULT_DESA, DEFAULT_TGL_MULAI, DEFAULT_TGL_AKHIR, true),
      tglMulai: DEFAULT_TGL_MULAI,
      tglAkhir: DEFAULT_TGL_AKHIR,
      excludeSunday: true,
      reportConfig: DEFAULT_REPORT_CONFIG
    };
  }
}

export function saveAppState(state: {
  teams: Team[];
  villages: string[];
  schedules: ScheduleItem[];
  tglMulai: string;
  tglAkhir: string;
  excludeSunday: boolean;
  reportConfig: ReportConfig;
}) {
  try {
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(state.teams));
    localStorage.setItem(STORAGE_KEYS.VILLAGES, JSON.stringify(state.villages));
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(state.schedules));
    localStorage.setItem(STORAGE_KEYS.TGL_MULAI, state.tglMulai);
    localStorage.setItem(STORAGE_KEYS.TGL_AKHIR, state.tglAkhir);
    localStorage.setItem(STORAGE_KEYS.EXCLUDE_SUNDAY, JSON.stringify(state.excludeSunday));
    localStorage.setItem(STORAGE_KEYS.REPORT_CONFIG, JSON.stringify(state.reportConfig));
  } catch (err) {
    console.error('Error saving state to localStorage:', err);
  }
}

export function createBackupPayload(state: {
  teams: Team[];
  villages: string[];
  schedules: ScheduleItem[];
  tglMulai: string;
  tglAkhir: string;
  excludeSunday: boolean;
  reportConfig: ReportConfig;
}): BackupData {
  return {
    version: '2.0',
    appName: 'Jadwal SAMTUL Desa',
    exportedAt: new Date().toISOString(),
    tglMulai: state.tglMulai,
    tglAkhir: state.tglAkhir,
    excludeSunday: state.excludeSunday,
    teams: state.teams,
    villages: state.villages,
    schedules: state.schedules,
    reportConfig: state.reportConfig
  };
}

export function validateAndParseBackupJSON(jsonStr: string): {
  success: boolean;
  data?: BackupData;
  error?: string;
  stats?: {
    teamsCount: number;
    villagesCount: number;
    schedulesCount: number;
    dateSpan: string;
  };
} {
  try {
    const parsed = JSON.parse(jsonStr);

    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Format file JSON tidak valid (bukan objek).' };
    }

    if (!Array.isArray(parsed.teams) || parsed.teams.length === 0) {
      return { success: false, error: 'Data JSON tidak memiliki daftar Tim (teams) yang valid.' };
    }

    if (!Array.isArray(parsed.villages) || parsed.villages.length === 0) {
      return { success: false, error: 'Data JSON tidak memiliki daftar Desa (villages) yang valid.' };
    }

    if (!Array.isArray(parsed.schedules)) {
      return { success: false, error: 'Data JSON tidak memiliki daftar Jadwal (schedules) yang valid.' };
    }

    const backupData: BackupData = {
      version: parsed.version || '2.0',
      appName: parsed.appName || 'Jadwal SAMTUL Desa',
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      tglMulai: parsed.tglMulai || DEFAULT_TGL_MULAI,
      tglAkhir: parsed.tglAkhir || DEFAULT_TGL_AKHIR,
      excludeSunday: parsed.excludeSunday !== undefined ? parsed.excludeSunday : true,
      teams: parsed.teams,
      villages: parsed.villages,
      schedules: parsed.schedules,
      reportConfig: {
        ...DEFAULT_REPORT_CONFIG,
        ...(parsed.reportConfig || {})
      }
    };

    return {
      success: true,
      data: backupData,
      stats: {
        teamsCount: backupData.teams.length,
        villagesCount: backupData.villages.length,
        schedulesCount: backupData.schedules.length,
        dateSpan: `${backupData.tglMulai} s.d. ${backupData.tglAkhir}`
      }
    };
  } catch (e: any) {
    return { success: false, error: `Gagal membaca JSON: ${e.message || 'Syntax error'}` };
  }
}

export function loadSnapshots(): LocalSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSnapshot(name: string, payload: BackupData): LocalSnapshot[] {
  const existing = loadSnapshots();
  const newSnapshot: LocalSnapshot = {
    id: `snap-${Date.now()}`,
    name: name || `Backup ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`,
    timestamp: new Date().toISOString(),
    data: payload
  };
  const updated = [newSnapshot, ...existing.slice(0, 9)]; // keep max 10
  localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(updated));
  return updated;
}

export function deleteSnapshot(id: string): LocalSnapshot[] {
  const existing = loadSnapshots();
  const updated = existing.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(updated));
  return updated;
}
