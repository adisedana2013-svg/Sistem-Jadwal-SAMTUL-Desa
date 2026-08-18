import React, { useState, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  FileJson, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Trash2, 
  History, 
  Bookmark, 
  Clock, 
  ShieldCheck, 
  X,
  FileCode2,
  HardDrive
} from 'lucide-react';
import { BackupData, ReportConfig, ScheduleItem, Team } from '../types';
import { 
  createBackupPayload, 
  validateAndParseBackupJSON, 
  loadSnapshots, 
  saveSnapshot, 
  deleteSnapshot, 
  LocalSnapshot 
} from '../utils/storage';
import { downloadJSONFile } from '../utils/exportUtils';
import { formatDateIndo } from '../utils/scheduleGenerator';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: {
    teams: Team[];
    villages: string[];
    schedules: ScheduleItem[];
    tglMulai: string;
    tglAkhir: string;
    excludeSunday: boolean;
    reportConfig: ReportConfig;
  };
  onRestoreState: (data: BackupData) => void;
  onResetAllDefault: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  currentState,
  onRestoreState,
  onResetAllDefault
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore' | 'snapshots'>('backup');
  const [snapshots, setSnapshots] = useState<LocalSnapshot[]>(loadSnapshots());
  const [snapshotName, setSnapshotName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<{
    data: BackupData;
    stats: {
      teamsCount: number;
      villagesCount: number;
      schedulesCount: number;
      dateSpan: string;
    };
  } | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadBackup = () => {
    const payload = createBackupPayload(currentState);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadJSONFile(payload, `SAMTUL_Desa_Backup_${dateStr}.json`);
  };

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = createBackupPayload(currentState);
    const updated = saveSnapshot(snapshotName, payload);
    setSnapshots(updated);
    setSnapshotName('');
  };

  const handleDeleteSnapshot = (id: string) => {
    const updated = deleteSnapshot(id);
    setSnapshots(updated);
  };

  const handleApplySnapshot = (snapshot: LocalSnapshot) => {
    if (confirm(`Terapkan snapshot "${snapshot.name}"? Data aktif saat ini akan digantikan.`)) {
      onRestoreState(snapshot.data);
      onClose();
    }
  };

  const processFile = (file: File) => {
    setRestoreError(null);
    setParsedPreview(null);

    if (!file.name.endsWith('.json')) {
      setRestoreError('File harus berupa file JSON (.json)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = validateAndParseBackupJSON(content);
      if (validation.success && validation.data && validation.stats) {
        setParsedPreview({
          data: validation.data,
          stats: validation.stats
        });
      } else {
        setRestoreError(validation.error || 'Format file JSON tidak sesuai dengan skema data SAMTUL.');
      }
    };
    reader.onerror = () => {
      setRestoreError('Gagal membaca file.');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleConfirmRestore = () => {
    if (!parsedPreview) return;
    onRestoreState(parsedPreview.data);
    onClose();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-cyan-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Manajemen Data & Backup / Restore JSON
            </h2>
            <p className="text-xs text-slate-500">
              Amankan data jadwal, unduh cadangan file JSON, atau pulihkan kembali kapan saja.
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'backup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📥 Backup JSON
          </button>
          <button
            onClick={() => setActiveTab('restore')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'restore' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📤 Restore JSON
          </button>
          <button
            onClick={() => setActiveTab('snapshots')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'snapshots' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📑 Snapshot ({snapshots.length})
          </button>
        </div>
      </div>

      {/* TAB 1: BACKUP JSON */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white flex flex-col justify-between space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 text-cyan-300 mb-3">
                <FileCode2 className="w-3.5 h-3.5" />
                <span>Format Standar SAMTUL v2.0</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Unduh Cadangan Lengkap (.JSON)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Menyimpan seluruh data aplikasi ke dalam satu file berkas JSON:
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>{currentState.teams.length} Tim & {currentState.teams.length * 2} Nama Petugas</li>
                <li>{currentState.villages.length} Desa & Wilayah Pengamanan</li>
                <li>{currentState.schedules.length} Baris Jadwal ({currentState.tglMulai} s.d. {currentState.tglAkhir})</li>
                <li>Konfigurasi KOP & Tanda Tangan Laporan Resmi</li>
              </ul>
            </div>

            <button
              onClick={handleDownloadBackup}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File Cadangan JSON</span>
            </button>
          </div>

          {/* Quick Snapshot Creator */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold text-sm">
                <Bookmark className="w-4 h-4 text-indigo-600" />
                <span>Simpan Titik Pemulihan (Snapshot Lokal)</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Simpan status data saat ini langsung di memori browser untuk cadangan cepat sewaktu-waktu tanpa mengunduh file.
              </p>
            </div>

            <form onSubmit={handleCreateSnapshot} className="space-y-3">
              <input
                type="text"
                placeholder="Beri label (contoh: Sebelum Perubahan Tim Sept)..."
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Simpan Snapshot Sekarang</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: RESTORE JSON */}
      {activeTab === 'restore' && (
        <div className="space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              dragActive
                ? 'border-indigo-600 bg-indigo-50/50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <div className="p-3 rounded-full bg-white shadow-xs text-indigo-600">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Pilih atau Tarik File JSON Cadangan (.json) ke Sini
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Format file didukung: SAMTUL Backup v2.0 JSON
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Error Message */}
          {restoreError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">Gagal memvalidasi berkas JSON:</p>
                <p className="mt-0.5">{restoreError}</p>
              </div>
            </div>
          )}

          {/* Preview of Parsed Data */}
          {parsedPreview && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>File JSON Valid & Siap Dipulihkan!</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/70 p-3 rounded-lg border border-emerald-100">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Tim</span>
                  <span className="text-sm font-black text-slate-900">{parsedPreview.stats.teamsCount} Tim</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Desa</span>
                  <span className="text-sm font-black text-slate-900">{parsedPreview.stats.villagesCount} Desa</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Jadwal</span>
                  <span className="text-sm font-black text-slate-900">{parsedPreview.stats.schedulesCount} Baris</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Rentang Tanggal</span>
                  <span className="text-xs font-bold text-slate-900">{parsedPreview.stats.dateSpan}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setParsedPreview(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pulihkan Data Sekarang</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SNAPSHOTS */}
      {activeTab === 'snapshots' && (
        <div className="space-y-3">
          {snapshots.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
              <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">Belum ada snapshot tersimpan.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Buka tab "Backup JSON" dan simpan titik pemulihan untuk mencadangkan data lokal secara instan.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{snap.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>Dibuat: {new Date(snap.timestamp).toLocaleString('id-ID')}</span>
                      <span>&bull;</span>
                      <span>{snap.data.schedules.length} Jadwal, {snap.data.teams.length} Tim</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleApplySnapshot(snap)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                    >
                      Pulihkan
                    </button>
                    <button
                      onClick={() => handleDeleteSnapshot(snap.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Hapus snapshot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
