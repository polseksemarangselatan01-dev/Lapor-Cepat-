import React, { useState } from 'react';
import {
  Calendar,
  FileText,
  FolderOpen,
  MapPin,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import { SavedReport } from '../types/report';
import { formatIndonesianDate, getIndonesianDay } from '../utils/formatReport';

interface HistoryViewProps {
  reports: SavedReport[];
  onLoadReport: (report: SavedReport) => void;
  onDeleteReport: (id: string) => void;
  onBackToForm: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  reports,
  onLoadReport,
  onDeleteReport,
  onBackToForm,
}) => {
  const [query, setQuery] = useState('');

  const filtered = reports.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      r.data.perihal.toLowerCase().includes(q) ||
      r.data.tempat.toLowerCase().includes(q) ||
      r.data.kelurahan.toLowerCase().includes(q) ||
      r.data.namaPelaksana.toLowerCase().includes(q) ||
      r.data.narasi.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Riwayat Laporan Tersimpan</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Draft laporan tersimpan secara lokal di perangkat ini untuk dipakai ulang kapan saja
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari perihal, kelurahan..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <FileText className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            {reports.length === 0 ? 'Belum ada laporan tersimpan' : 'Tidak ada laporan yang cocok'}
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {reports.length === 0
              ? 'Klik tombol "Simpan Draft" di panel pratinjau WhatsApp untuk menyimpan laporan kegiatan Anda.'
              : 'Coba kata kunci pencarian yang lain atau hapus filter pencarian.'}
          </p>
          <button
            type="button"
            onClick={onBackToForm}
            className="mt-5 min-h-[42px] inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Kembali ke Formulir
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const hari = item.data.hariOverride || getIndonesianDay(item.data.tanggal);
            const tgl = formatIndonesianDate(item.data.tanggal);
            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 transition-colors hover:border-slate-300"
              >
                <div className="min-w-0 space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {item.data.perihal || 'Laporan Kegiatan'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {hari}, {tgl}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {item.data.tempat} Kel.{item.data.kelurahan}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      {item.data.namaPelaksana}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 pt-0.5">
                    {item.data.narasi}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onLoadReport(item)}
                    className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span>Muat ke Form</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteReport(item.id)}
                    aria-label="Hapus draft"
                    className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
