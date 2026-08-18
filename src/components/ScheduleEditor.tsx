import React, { useState } from 'react';
import { 
  ScheduleItem, 
  Team, 
  DutyStatus 
} from '../types';
import { 
  Edit3, 
  Save, 
  X, 
  Plus, 
  RotateCcw, 
  ArrowLeftRight, 
  Trash2, 
  Calendar, 
  Check, 
  AlertCircle,
  HelpCircle,
  Wand2,
  Upload
} from 'lucide-react';
import { HARI_INDONESIA } from '../constants/initialData';
import { formatDateDDMMYYYY, formatDateYYYYMMDD, parseDate } from '../utils/scheduleGenerator';

interface ScheduleEditorProps {
  schedules: ScheduleItem[];
  teams: Team[];
  villages: string[];
  onSaveScheduleRow: (updatedItem: ScheduleItem) => void;
  onDeleteScheduleRow: (id: string | number) => void;
  onAddScheduleRow: (newItem: Partial<ScheduleItem>) => void;
  onSwapSchedules: (id1: string | number, id2: string | number) => void;
  onRegenerateAll: (tglMulai: string, tglAkhir: string, excludeSunday: boolean) => void;
  onResetAllDefault: () => void;
  onOpenImportExcel?: () => void;
  tglMulai: string;
  tglAkhir: string;
  excludeSunday: boolean;
}

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  schedules,
  teams,
  villages,
  onSaveScheduleRow,
  onDeleteScheduleRow,
  onAddScheduleRow,
  onSwapSchedules,
  onRegenerateAll,
  onResetAllDefault,
  onOpenImportExcel,
  tglMulai,
  tglAkhir,
  excludeSunday
}) => {
  // Local state for row editing
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editForm, setEditForm] = useState<{
    tanggalRaw: string;
    timKode: string;
    desa: string;
    status: DutyStatus;
    keterangan: string;
  }>({
    tanggalRaw: '',
    timKode: '',
    desa: '',
    status: 'terjadwal',
    keterangan: ''
  });

  // Local filter in editor
  const [filterTim, setFilterTim] = useState('all');
  const [filterDesa, setFilterDesa] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  // Add Row Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRowForm, setNewRowForm] = useState({
    tanggalRaw: new Date().toISOString().split('T')[0],
    timKode: teams[0]?.kode || 'A',
    desa: villages[0] || '',
    status: 'terjadwal' as DutyStatus,
    keterangan: ''
  });

  // Regenerate Modal State
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [regenStartDate, setRegenStartDate] = useState(tglMulai);
  const [regenEndDate, setRegenEndDate] = useState(tglAkhir);
  const [regenExcludeSunday, setRegenExcludeSunday] = useState(excludeSunday);

  // Swap Modal State
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapFirstId, setSwapFirstId] = useState<string | number | ''>('');
  const [swapSecondId, setSwapSecondId] = useState<string | number | ''>('');

  // Filtering
  const filteredList = schedules.filter((row) => {
    if (filterTim !== 'all' && row.timKode !== filterTim) return false;
    if (filterDesa !== 'all' && row.desa !== filterDesa) return false;
    if (filterSearch.trim() !== '') {
      const q = filterSearch.toLowerCase();
      const match =
        row.desa.toLowerCase().includes(q) ||
        row.petugas1.toLowerCase().includes(q) ||
        row.petugas2.toLowerCase().includes(q) ||
        row.timKode.toLowerCase().includes(q) ||
        row.tanggal.includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredList.length / rowsPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = (safePage - 1) * rowsPerPage;
  const currentRows = filteredList.slice(startIdx, startIdx + rowsPerPage);

  const startEdit = (row: ScheduleItem) => {
    setEditingId(row.id);
    setEditForm({
      tanggalRaw: row.tanggalRaw,
      timKode: row.timKode,
      desa: row.desa,
      status: row.status || 'terjadwal',
      keterangan: row.keterangan || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (row: ScheduleItem) => {
    const d = parseDate(editForm.tanggalRaw);
    if (isNaN(d.getTime())) {
      alert('Tanggal tidak valid!');
      return;
    }

    const tim = teams.find((t) => t.kode === editForm.timKode) || {
      kode: editForm.timKode,
      p1: row.petugas1,
      p2: row.petugas2
    };

    const updatedItem: ScheduleItem = {
      ...row,
      tanggalRaw: editForm.tanggalRaw,
      tanggal: formatDateDDMMYYYY(d),
      hari: HARI_INDONESIA[d.getDay()],
      timKode: editForm.timKode,
      petugas1: tim.p1,
      petugas2: tim.p2,
      desa: editForm.desa,
      status: editForm.status,
      keterangan: editForm.keterangan
    };

    onSaveScheduleRow(updatedItem);
    setEditingId(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = parseDate(newRowForm.tanggalRaw);
    const tim = teams.find((t) => t.kode === newRowForm.timKode);

    onAddScheduleRow({
      tanggalRaw: newRowForm.tanggalRaw,
      tanggal: formatDateDDMMYYYY(d),
      hari: HARI_INDONESIA[d.getDay()],
      timKode: newRowForm.timKode,
      petugas1: tim?.p1 || '',
      petugas2: tim?.p2 || '',
      desa: newRowForm.desa,
      status: newRowForm.status,
      keterangan: newRowForm.keterangan
    });

    setIsAddModalOpen(false);
  };

  const handleSwapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapFirstId || !swapSecondId) return;
    onSwapSchedules(swapFirstId, swapSecondId);
    setIsSwapModalOpen(false);
    setSwapFirstId('');
    setSwapSecondId('');
  };

  const handleRegenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirm('Regenerate akan menghitung ulang seluruh jadwal otomatis berdasarkan tanggal yang Anda tentukan. Lanjutkan?')) {
      onRegenerateAll(regenStartDate, regenEndDate, regenExcludeSunday);
      setIsRegenerateModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                <Edit3 className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Kelola & Edit Jadwal Tugas
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ubah penugasan per baris, sisipkan jadwal tambahan, tukar tanggal tugas, atau regenerate ulang.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto">
            {onOpenImportExcel && (
              <button
                onClick={onOpenImportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all active:scale-95"
                title="Impor jadwal langsung dari berkas Excel"
              >
                <Upload className="w-4 h-4 text-cyan-300" />
                <span>Impor Excel</span>
              </button>
            )}

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tugas</span>
            </button>

            <button
              onClick={() => setIsSwapModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all active:scale-95"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Tukar Jadwal</span>
            </button>

            <button
              onClick={() => setIsRegenerateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all active:scale-95"
            >
              <Wand2 className="w-4 h-4" />
              <span>Regenerate Otomatis</span>
            </button>

            <button
              onClick={onResetAllDefault}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 shadow-xs transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>

        {/* Quick Filter inside editor */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <input
            type="text"
            placeholder="Cari dalam editor..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
          />

          <select
            value={filterTim}
            onChange={(e) => setFilterTim(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 font-medium"
          >
            <option value="all">Semua Tim</option>
            {teams.map((t) => (
              <option key={t.kode} value={t.kode}>Tim {t.kode}</option>
            ))}
          </select>

          <select
            value={filterDesa}
            onChange={(e) => setFilterDesa(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 font-medium"
          >
            <option value="all">Semua Desa</option>
            {villages.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 w-32">Tanggal</th>
                <th className="py-3 px-3 w-20">Hari</th>
                <th className="py-3 px-3 w-24">Tim</th>
                <th className="py-3 px-4 min-w-[200px]">Petugas</th>
                <th className="py-3 px-4 min-w-[180px]">Desa</th>
                <th className="py-3 px-3 w-28">Status</th>
                <th className="py-3 px-3 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Tidak ada jadwal yang ditemukan.
                  </td>
                </tr>
              ) : (
                currentRows.map((row, idx) => {
                  const globalIdx = startIdx + idx + 1;
                  const isEditing = editingId === row.id;

                  if (isEditing) {
                    return (
                      <tr key={row.id} className="bg-amber-50/70">
                        <td className="py-2.5 px-3 text-center font-bold text-amber-900">
                          {globalIdx}
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="date"
                            value={editForm.tanggalRaw}
                            onChange={(e) => setEditForm({ ...editForm, tanggalRaw: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2 text-slate-500 font-medium">
                          {editForm.tanggalRaw ? HARI_INDONESIA[parseDate(editForm.tanggalRaw).getDay()] : '-'}
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={editForm.timKode}
                            onChange={(e) => setEditForm({ ...editForm, timKode: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 outline-none font-bold"
                          >
                            {teams.map((t) => (
                              <option key={t.kode} value={t.kode}>Tim {t.kode}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2 text-slate-600">
                          {(() => {
                            const selectedTim = teams.find((t) => t.kode === editForm.timKode);
                            return selectedTim ? `${selectedTim.p1} & ${selectedTim.p2}` : '-';
                          })()}
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={editForm.desa}
                            onChange={(e) => setEditForm({ ...editForm, desa: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 outline-none font-medium"
                          >
                            {villages.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as DutyStatus })}
                            className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 outline-none font-medium"
                          >
                            <option value="terjadwal">Terjadwal</option>
                            <option value="terlaksana">Terlaksana</option>
                            <option value="ijin">Izin</option>
                            <option value="pengganti">Pengganti</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => saveEdit(row)}
                              className="p-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                              title="Simpan"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {globalIdx}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {row.tanggal}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-600">
                        {row.hari}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                          Tim {row.timKode}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        <div className="font-semibold">{row.petugas1}</div>
                        <div className="text-[11px] text-slate-500">& {row.petugas2}</div>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {row.desa}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          {row.status || 'Terjadwal'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => startEdit(row)}
                            className="p-1.5 rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                            title="Edit baris ini"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus tugas Tim ${row.timKode} pada ${row.tanggal}?`)) {
                                onDeleteScheduleRow(row.id);
                              }
                            }}
                            className="p-1.5 rounded-md bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                            title="Hapus tugas ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Menampilkan Halaman <span className="font-bold">{safePage}</span> dari {totalPages}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add Row */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              <span>Tambah Tugas Baru</span>
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Penugasan</label>
                <input
                  type="date"
                  required
                  value={newRowForm.tanggalRaw}
                  onChange={(e) => setNewRowForm({ ...newRowForm, tanggalRaw: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tim Petugas</label>
                <select
                  value={newRowForm.timKode}
                  onChange={(e) => setNewRowForm({ ...newRowForm, timKode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:bg-white font-medium"
                >
                  {teams.map((t) => (
                    <option key={t.kode} value={t.kode}>
                      Tim {t.kode} ({t.p1} & {t.p2})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Desa Tujuan</label>
                <select
                  value={newRowForm.desa}
                  onChange={(e) => setNewRowForm({ ...newRowForm, desa: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:bg-white font-medium"
                >
                  {villages.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Penugasan</label>
                <select
                  value={newRowForm.status}
                  onChange={(e) => setNewRowForm({ ...newRowForm, status: e.target.value as DutyStatus })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:bg-white font-medium"
                >
                  <option value="terjadwal">Terjadwal</option>
                  <option value="terlaksana">Terlaksana</option>
                  <option value="ijin">Izin</option>
                  <option value="pengganti">Pengganti</option>
                </select>
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
                  Simpan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Swap Schedules */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-sky-600" />
              <span>Tukar Jadwal Penugasan</span>
            </h3>

            <form onSubmit={handleSwapSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tugas Pertama (A)</label>
                <select
                  required
                  value={swapFirstId}
                  onChange={(e) => setSwapFirstId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:bg-white font-medium"
                >
                  <option value="">-- Pilih Tugas Pertama --</option>
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.tanggal} &bull; Tim {s.timKode} &bull; Desa {s.desa}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tugas Kedua (B)</label>
                <select
                  required
                  value={swapSecondId}
                  onChange={(e) => setSwapSecondId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:bg-white font-medium"
                >
                  <option value="">-- Pilih Tugas Kedua --</option>
                  {schedules
                    .filter((s) => s.id !== swapFirstId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.tanggal} &bull; Tim {s.timKode} &bull; Desa {s.desa}
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900 text-xs leading-relaxed">
                💡 Tim dan Petugas pada Tugas A akan ditukar dengan Tim dan Petugas pada Tugas B. Tanggal dan desa tetap di tempat semula.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSwapModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!swapFirstId || !swapSecondId}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-semibold shadow-xs"
                >
                  Tukar Penugasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Regenerate All */}
      {isRegenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-indigo-600" />
              <span>Regenerate Jadwal Otomatis</span>
            </h3>

            <form onSubmit={handleRegenerateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  required
                  value={regenStartDate}
                  onChange={(e) => setRegenStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Selesai</label>
                <input
                  type="date"
                  required
                  value={regenEndDate}
                  onChange={(e) => setRegenEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="regen-exclude-sunday"
                  checked={regenExcludeSunday}
                  onChange={(e) => setRegenExcludeSunday(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <label htmlFor="regen-exclude-sunday" className="font-semibold text-slate-700 cursor-pointer">
                  Liburkan Hari Minggu (Tidak ada penugasan di hari Minggu)
                </label>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs leading-relaxed">
                ⚠️ Perhatian: Penjadwalan baru akan dibuat secara matematis bergiliran (rolling rotation) melintasi {villages.length} Desa dan {teams.length} Tim.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegenerateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  Mulai Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
