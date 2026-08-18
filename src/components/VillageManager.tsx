import React, { useState } from 'react';
import { ScheduleItem } from '../types';
import { 
  MapPin, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  RotateCcw, 
  Building2,
  CheckCircle2
} from 'lucide-react';
import { DEFAULT_DESA } from '../constants/initialData';

interface VillageManagerProps {
  villages: string[];
  schedules: ScheduleItem[];
  onSaveVillages: (newVillages: string[]) => void;
  onResetVillagesDefault: () => void;
}

export const VillageManager: React.FC<VillageManagerProps> = ({
  villages,
  schedules,
  onSaveVillages,
  onResetVillagesDefault
}) => {
  const [search, setSearch] = useState('');
  const [newVillageName, setNewVillageName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  // Count visits per village
  const visitCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    villages.forEach(v => { counts[v] = 0; });
    schedules.forEach(s => {
      if (counts[s.desa] !== undefined) {
        counts[s.desa]++;
      }
    });
    return counts;
  }, [villages, schedules]);

  const filteredVillages = villages.filter(v => 
    v.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddVillage = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newVillageName.trim().toUpperCase();
    if (!name) return;
    if (villages.includes(name)) {
      alert(`Desa "${name}" sudah ada dalam daftar!`);
      return;
    }

    const updated = [...villages, name];
    onSaveVillages(updated);
    setNewVillageName('');
  };

  const handleStartEdit = (idx: number, currentName: string) => {
    setEditingIndex(idx);
    setEditName(currentName);
  };

  const handleSaveEdit = (idx: number) => {
    const name = editName.trim().toUpperCase();
    if (!name) return;
    if (villages.some((v, i) => i !== idx && v === name)) {
      alert(`Desa "${name}" sudah ada!`);
      return;
    }

    const updated = [...villages];
    updated[idx] = name;
    onSaveVillages(updated);
    setEditingIndex(null);
  };

  const handleDelete = (idx: number, name: string) => {
    if (villages.length <= 1) {
      alert('Minimal harus ada 1 Desa!');
      return;
    }
    if (confirm(`Hapus desa "${name}" dari data master?`)) {
      const updated = villages.filter((_, i) => i !== idx);
      onSaveVillages(updated);
    }
  };

  const handleSortAZ = () => {
    const updated = [...villages].sort((a, b) => a.localeCompare(b));
    onSaveVillages(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Data Master Desa & Wilayah Pengamanan
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total {villages.length} Desa Terdaftar &bull; Satuan Pengamanan Lingkungan SAMTUL
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto">
          <button
            onClick={handleSortAZ}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
          >
            Urutkan A-Z
          </button>
          <button
            onClick={onResetVillagesDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset 49 Desa Default</span>
          </button>
        </div>
      </div>

      {/* Add New Village and Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form onSubmit={handleAddVillage} className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-2">
          <input
            type="text"
            placeholder="Tambah nama desa baru..."
            value={newVillageName}
            onChange={(e) => setNewVillageName(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500 font-semibold"
          />
          <button
            type="submit"
            disabled={!newVillageName.trim()}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </form>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Cari desa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-2 py-1 text-xs outline-none bg-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Village Badges Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
        <div className="text-xs text-slate-500 font-medium mb-3 flex items-center justify-between">
          <span>Daftar Seluruh Desa ({filteredVillages.length})</span>
          <span>Frekuensi Kunjungan SAMTUL</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {filteredVillages.map((desa, idx) => {
            const originalIndex = villages.indexOf(desa);
            const isEditing = editingIndex === originalIndex;
            const visitCount = visitCounts[desa] || 0;

            if (isEditing) {
              return (
                <div key={originalIndex} className="p-2 rounded-xl bg-amber-50 border border-amber-300 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs bg-white border border-amber-300 rounded font-bold uppercase outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(originalIndex)}
                    className="p-1 text-emerald-700 hover:bg-emerald-100 rounded"
                    title="Simpan"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingIndex(null)}
                    className="p-1 text-slate-500 hover:bg-slate-200 rounded"
                    title="Batal"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={desa}
                className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="text-[10px] font-mono text-slate-400 w-5">
                    {originalIndex + 1}.
                  </span>
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {desa}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {visitCount}x
                  </span>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-1">
                    <button
                      onClick={() => handleStartEdit(originalIndex, desa)}
                      className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                      title="Edit Nama"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(originalIndex, desa)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                      title="Hapus"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
