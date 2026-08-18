import React, { useState } from 'react';
import { Team, ScheduleItem } from '../types';
import { 
  Users, 
  UserPlus, 
  ArrowLeftRight, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  ShieldCheck, 
  RotateCcw, 
  Phone,
  CheckCircle2,
  AlertTriangle,
  Upload
} from 'lucide-react';

interface TeamManagerProps {
  teams: Team[];
  schedules: ScheduleItem[];
  onSaveTeams: (newTeams: Team[]) => void;
  onResetTeamsDefault: () => void;
  onOpenImportExcel?: () => void;
}

export const TeamManager: React.FC<TeamManagerProps> = ({
  teams,
  schedules,
  onSaveTeams,
  onResetTeamsDefault,
  onOpenImportExcel
}) => {
  const [localTeams, setLocalTeams] = useState<Team[]>(JSON.parse(JSON.stringify(teams)));
  const [editingKode, setEditingKode] = useState<string | null>(null);
  const [editP1, setEditP1] = useState('');
  const [editP2, setEditP2] = useState('');
  const [editTel1, setEditTel1] = useState('');
  const [editTel2, setEditTel2] = useState('');

  // Add Team Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTeamKode, setNewTeamKode] = useState('');
  const [newTeamP1, setNewTeamP1] = useState('');
  const [newTeamP2, setNewTeamP2] = useState('');

  // Swap Officer Modal
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapFrom, setSwapFrom] = useState<{ timKode: string; position: 'p1' | 'p2'; officerName: string }>({
    timKode: '',
    position: 'p1',
    officerName: ''
  });
  const [swapTargetTeam, setSwapTargetTeam] = useState('');
  const [swapTargetPosition, setSwapTargetPosition] = useState<'p1' | 'p2'>('p1');

  // Compute duty count per team
  const dutyCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    teams.forEach(t => { counts[t.kode] = 0; });
    schedules.forEach(s => {
      if (counts[s.timKode] !== undefined) {
        counts[s.timKode]++;
      }
    });
    return counts;
  }, [teams, schedules]);

  const handleStartEdit = (t: Team) => {
    setEditingKode(t.kode);
    setEditP1(t.p1);
    setEditP2(t.p2);
    setEditTel1(t.telepon1 || '');
    setEditTel2(t.telepon2 || '');
  };

  const handleSaveEdit = (kode: string) => {
    if (!editP1.trim() || !editP2.trim()) {
      alert('Nama kedua petugas wajib diisi!');
      return;
    }

    const updated = localTeams.map((t) => {
      if (t.kode === kode) {
        return {
          ...t,
          p1: editP1.trim().toUpperCase(),
          p2: editP2.trim().toUpperCase(),
          telepon1: editTel1.trim(),
          telepon2: editTel2.trim()
        };
      }
      return t;
    });

    setLocalTeams(updated);
    onSaveTeams(updated);
    setEditingKode(null);
  };

  const handleOpenSwapModal = (timKode: string, position: 'p1' | 'p2', officerName: string) => {
    setSwapFrom({ timKode, position, officerName });
    const otherTeam = teams.find(t => t.kode !== timKode);
    setSwapTargetTeam(otherTeam ? otherTeam.kode : '');
    setSwapTargetPosition(position);
    setIsSwapModalOpen(true);
  };

  const handleConfirmSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapTargetTeam) return;

    const updated = localTeams.map(t => ({ ...t }));
    const sourceTeam = updated.find(t => t.kode === swapFrom.timKode);
    const targetTeam = updated.find(t => t.kode === swapTargetTeam);

    if (sourceTeam && targetTeam) {
      const officerFromSource = sourceTeam[swapFrom.position];
      const officerFromTarget = targetTeam[swapTargetPosition];

      sourceTeam[swapFrom.position] = officerFromTarget;
      targetTeam[swapTargetPosition] = officerFromSource;

      setLocalTeams(updated);
      onSaveTeams(updated);
    }

    setIsSwapModalOpen(false);
  };

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    const kode = newTeamKode.trim().toUpperCase();
    if (!kode || !newTeamP1.trim() || !newTeamP2.trim()) {
      alert('Semua field wajib diisi!');
      return;
    }

    if (localTeams.some(t => t.kode === kode)) {
      alert(`Kode Tim ${kode} sudah digunakan!`);
      return;
    }

    const updated = [
      ...localTeams,
      {
        kode,
        p1: newTeamP1.trim().toUpperCase(),
        p2: newTeamP2.trim().toUpperCase()
      }
    ].sort((a, b) => a.kode.localeCompare(b.kode));

    setLocalTeams(updated);
    onSaveTeams(updated);
    setIsAddModalOpen(false);
    setNewTeamKode('');
    setNewTeamP1('');
    setNewTeamP2('');
  };

  const handleDeleteTeam = (kode: string) => {
    if (localTeams.length <= 1) {
      alert('Minimal harus ada 1 Tim!');
      return;
    }
    if (confirm(`Yakin ingin menghapus Tim ${kode}? Jadwal yang terkait akan disesuaikan.`)) {
      const updated = localTeams.filter(t => t.kode !== kode);
      setLocalTeams(updated);
      onSaveTeams(updated);
    }
  };

  const getNextAvailableCode = () => {
    const existing = localTeams.map(t => t.kode);
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      if (!existing.includes(letter)) return letter;
    }
    return 'Z';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Manajemen Tim & Petugas SAMTUL
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total {localTeams.length} Tim &bull; {localTeams.length * 2} Petugas Aktif
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {onOpenImportExcel && (
            <button
              onClick={onOpenImportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all active:scale-95"
            >
              <Upload className="w-4 h-4 text-cyan-300" />
              <span>Impor Excel Tim</span>
            </button>
          )}

          <button
            onClick={() => {
              setNewTeamKode(getNextAvailableCode());
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Tim Baru</span>
          </button>

          <button
            onClick={onResetTeamsDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Tim Default</span>
          </button>
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {localTeams.map((team) => {
          const isEditing = editingKode === team.kode;
          const count = dutyCounts[team.kode] || 0;

          return (
            <div
              key={team.kode}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-4.5 flex flex-col justify-between"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {team.kode}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">TIM {team.kode}</h3>
                      <span className="text-[10px] text-slate-500 font-medium">2 Petugas Keamanan</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {count} Penugasan
                  </span>
                </div>

                {/* Card Body */}
                {isEditing ? (
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Petugas 1</label>
                      <input
                        type="text"
                        value={editP1}
                        onChange={(e) => setEditP1(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-indigo-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Petugas 2</label>
                      <input
                        type="text"
                        value={editP2}
                        onChange={(e) => setEditP2(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-indigo-500 font-semibold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 text-xs">
                    {/* Officer 1 */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between group">
                      <div className="min-w-0 pr-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Petugas 1</div>
                        <div className="font-bold text-slate-900 truncate">{team.p1}</div>
                      </div>
                      <button
                        onClick={() => handleOpenSwapModal(team.kode, 'p1', team.p1)}
                        className="p-1 rounded-md text-amber-600 hover:bg-amber-100 transition-colors"
                        title="Tukar Petugas 1 ke Tim Lain"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Officer 2 */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between group">
                      <div className="min-w-0 pr-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Petugas 2</div>
                        <div className="font-bold text-slate-900 truncate">{team.p2}</div>
                      </div>
                      <button
                        onClick={() => handleOpenSwapModal(team.kode, 'p2', team.p2)}
                        className="p-1 rounded-md text-amber-600 hover:bg-amber-100 transition-colors"
                        title="Tukar Petugas 2 ke Tim Lain"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
                {isEditing ? (
                  <div className="flex items-center gap-2 w-full justify-end">
                    <button
                      onClick={() => setEditingKode(null)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleSaveEdit(team.kode)}
                      className="px-3 py-1 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 shadow-xs"
                    >
                      <Save className="w-3 h-3" />
                      <span>Simpan</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleStartEdit(team)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Ubah Nama</span>
                    </button>

                    <button
                      onClick={() => handleDeleteTeam(team.kode)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Team */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              <span>Tambah Tim Baru</span>
            </h3>

            <form onSubmit={handleAddTeam} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kode Tim (1 Huruf)</label>
                <input
                  type="text"
                  maxLength={1}
                  required
                  value={newTeamKode}
                  onChange={(e) => setNewTeamKode(e.target.value.toUpperCase())}
                  className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center font-bold outline-none focus:border-indigo-500 focus:bg-white uppercase"
                  placeholder="N"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Petugas 1</label>
                <input
                  type="text"
                  required
                  value={newTeamP1}
                  onChange={(e) => setNewTeamP1(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:bg-white"
                  placeholder="Masukkan nama lengkap petugas 1"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Petugas 2</label>
                <input
                  type="text"
                  required
                  value={newTeamP2}
                  onChange={(e) => setNewTeamP2(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:bg-white"
                  placeholder="Masukkan nama lengkap petugas 2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                >
                  Tambah Tim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Swap Officer */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-amber-500" />
              <span>Tukar Petugas Antar Tim</span>
            </h3>

            <form onSubmit={handleConfirmSwap} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Petugas yang Ditukar</label>
                <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 font-bold text-slate-800">
                  {swapFrom.officerName} (Tim {swapFrom.timKode} - {swapFrom.position === 'p1' ? 'Petugas 1' : 'Petugas 2'})
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pindah ke Tim Tujuan</label>
                <select
                  required
                  value={swapTargetTeam}
                  onChange={(e) => setSwapTargetTeam(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:bg-white font-semibold"
                >
                  {localTeams
                    .filter((t) => t.kode !== swapFrom.timKode)
                    .map((t) => (
                      <option key={t.kode} value={t.kode}>
                        Tim {t.kode} ({t.p1} & {t.p2})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Posisi di Tim Tujuan</label>
                <select
                  value={swapTargetPosition}
                  onChange={(e) => setSwapTargetPosition(e.target.value as 'p1' | 'p2')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:bg-white font-medium"
                >
                  <option value="p1">Posisi Petugas 1</option>
                  <option value="p2">Posisi Petugas 2</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                💡 Petugas pada posisi tujuan akan otomatis menggantikan posisi di Tim {swapFrom.timKode}.
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSwapModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs"
                >
                  Konfirmasi Tukar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
