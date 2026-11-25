import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  FileEdit,
  HelpCircle,
  Info,
  RotateCcw,
  Send,
  Smartphone,
  Monitor,
  AlertTriangle,
} from 'lucide-react';
import { ReportForm } from './components/ReportForm';
import { WhatsAppPreview } from './components/WhatsAppPreview';
import { HistoryView } from './components/HistoryView';
import {
  ACTIVITY_TEMPLATES,
  ActivityTemplate,
  ReportFormData,
  ReportImage,
  SavedReport,
} from './types/report';
import {
  buildWhatsAppUrl,
  convertImageFileToPngBlob,
  formatWhatsAppMessage,
  getTodayIsoDate,
  stampInfographicKopOnFile,
} from './utils/formatReport';

const PROFILE_STORAGE_KEY = 'siaplapor_profile_v1';
const HISTORY_STORAGE_KEY = 'siaplapor_history_v1';

function createInitialFormData(): ReportFormData {
  let savedProfile: Partial<ReportFormData> = {};
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) savedProfile = JSON.parse(raw);
  } catch {
    // ignore storage errors
  }

  return {
    kesatuanInduk: savedProfile.kesatuanInduk ?? 'POLRESTABES SEMARANG',
    kesatuanPelaksana: savedProfile.kesatuanPelaksana ?? 'POLSEK SEMARANG SELATAN',
    kepadaYth: savedProfile.kepadaYth ?? 'Kapolrestabes Semarang',
    dari: savedProfile.dari ?? 'Kapolsek Semarang Selatan',
    perihal: 'Sambang dan Binluh',
    tanggal: getTodayIsoDate(),
    hariOverride: '',
    jamMulai: '10.30',
    jamSelesai: '12.00',
    sampaiSelesai: true,
    tempat: 'RW 05',
    namaJalan: '',
    kelurahan: savedProfile.kelurahan ?? 'Barusari',
    kecamatan: savedProfile.kecamatan ?? 'Semarang Selatan',
    provinsi: savedProfile.provinsi ?? 'Jawa Tengah',
    jabatanPelaksana: savedProfile.jabatanPelaksana ?? 'Bhabinkamtibmas',
    namaPelaksana: savedProfile.namaPelaksana ?? 'Aipda A Arwani',
    narasi: ACTIVITY_TEMPLATES[0].narasiBuilder({
      jabatan: savedProfile.jabatanPelaksana ?? 'Bhabinkamtibmas',
      kelurahan: savedProfile.kelurahan ?? 'Barusari',
      nama: savedProfile.namaPelaksana ?? 'Aipda A Arwani',
      kesatuan: savedProfile.kesatuanPelaksana ?? 'POLSEK SEMARANG SELATAN',
      tempat: 'RW 05',
    }),
    penutup: 'Giat berjalan dengan aman dan tertib.',
    akhiran: 'Dump',
    gunakanBoldWa: true,
    gunakanIkonWa: true,
    stempelKopFoto: true,
    nomorTujuanWa: savedProfile.nomorTujuanWa ?? '',
    namaGrupPreview: savedProfile.kesatuanPelaksana ?? 'POLSEK SEMARANG SELATAN',
  };
}

type ActiveTab = 'form' | 'history' | 'guide';
type MobilePane = 'edit' | 'preview';

export default function App() {
  const [formData, setFormData] = useState<ReportFormData>(createInitialFormData);
  const [photoSlots, setPhotoSlots] = useState<(ReportImage | null)[]>([
    null,
    null,
  ]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('form');
  const [mobilePane, setMobilePane] = useState<MobilePane>('edit');
  const [profileSaved, setProfileSaved] = useState(false);
  const [historySavedFeedback, setHistorySavedFeedback] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState<{
    message: string;
    tone: 'success' | 'info' | 'warning';
  } | null>(null);

  const images = useMemo(
    () => photoSlots.filter((slot): slot is ReportImage => slot !== null),
    [photoSlots]
  );

  const formattedMessage = useMemo(() => formatWhatsAppMessage(formData), [formData]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      photoSlots.forEach((img) => {
        if (img) URL.revokeObjectURL(img.previewUrl);
      });
    };
  }, []);

  const showToast = (message: string, tone: 'success' | 'info' | 'warning' = 'info') => {
    setToast({ message, tone });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const handleFieldChange = <K extends keyof ReportFormData>(
    key: K,
    value: ReportFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyTemplate = (template: ActivityTemplate) => {
    setFormData((prev) => ({
      ...prev,
      perihal: template.perihal,
      narasi: template.narasiBuilder({
        jabatan: prev.jabatanPelaksana,
        kelurahan: prev.kelurahan,
        nama: prev.namaPelaksana,
        kesatuan: prev.kesatuanPelaksana,
        tempat: prev.tempat,
      }),
      penutup: template.penutup,
    }));
    showToast(`Template "${template.label}" diterapkan.`, 'success');
  };

  const handleSetSlotImages = (slotIndex: number, fileList: FileList | File[]) => {
    const incoming = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (incoming.length === 0) {
      showToast('Pilih file gambar (JPG, PNG, atau WebP).', 'warning');
      return;
    }

    const MAX_PHOTOS = 6;

    setPhotoSlots((prev) => {
      const next = [...prev];
      const createEntry = (file: File): ReportImage => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        sizeBytes: file.size,
      });

      if (next[slotIndex]) {
        URL.revokeObjectURL(next[slotIndex]!.previewUrl);
      }
      next[slotIndex] = createEntry(incoming[0]);

      // Distribute additional selected photos into empty slots or append new slots up to MAX_PHOTOS
      let fileIdx = 1;
      for (let i = 0; i < next.length && fileIdx < incoming.length; i++) {
        if (i !== slotIndex && !next[i]) {
          next[i] = createEntry(incoming[fileIdx]);
          fileIdx++;
        }
      }
      while (fileIdx < incoming.length && next.length < MAX_PHOTOS) {
        next.push(createEntry(incoming[fileIdx]));
        fileIdx++;
      }

      if (fileIdx < incoming.length) {
        showToast(`Maksimal ${MAX_PHOTOS} foto dokumentasi per laporan.`, 'info');
      }

      return next;
    });
  };

  const handleAddPhotoSlot = () => {
    setPhotoSlots((prev) => {
      if (prev.length >= 6) return prev;
      return [...prev, null];
    });
  };

  const handleRemoveSlotImage = (slotIndex: number) => {
    setPhotoSlots((prev) => {
      const next = [...prev];
      if (next[slotIndex]) {
        URL.revokeObjectURL(next[slotIndex]!.previewUrl);
      }
      // Keep at least 2 base photo columns; remove extra empty columns above index 1
      if (slotIndex >= 2) {
        next.splice(slotIndex, 1);
      } else {
        next[slotIndex] = null;
      }
      return next;
    });
  };

  const handleReplaceWithCollage = (collageFile: File) => {
    setPhotoSlots((prev) => {
      prev.forEach((img) => {
        if (img) URL.revokeObjectURL(img.previewUrl);
      });
      return [
        {
          id: `collage-${Date.now()}`,
          file: collageFile,
          previewUrl: URL.createObjectURL(collageFile),
          name: collageFile.name,
          sizeBytes: collageFile.size,
        },
        null,
      ];
    });
    showToast('Foto berhasil digabungkan menjadi 1 kolase siap kirim WhatsApp.', 'success');
  };

  const handleSaveProfile = () => {
    try {
      const profileToSave = {
        kesatuanInduk: formData.kesatuanInduk,
        kesatuanPelaksana: formData.kesatuanPelaksana,
        kepadaYth: formData.kepadaYth,
        dari: formData.dari,
        kelurahan: formData.kelurahan,
        kecamatan: formData.kecamatan,
        provinsi: formData.provinsi,
        jabatanPelaksana: formData.jabatanPelaksana,
        namaPelaksana: formData.namaPelaksana,
        nomorTujuanWa: formData.nomorTujuanWa,
      };
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileToSave));
      setProfileSaved(true);
      showToast('Profil personel & kesatuan disimpan untuk pengisian berikutnya.', 'success');
      setTimeout(() => setProfileSaved(false), 2500);
    } catch {
      showToast('Gagal menyimpan profil ke penyimpanan lokal.', 'warning');
    }
  };

  const handleSaveToHistory = () => {
    const newEntry: SavedReport = {
      id: `${Date.now()}`,
      savedAt: new Date().toISOString(),
      data: formData,
    };
    const updated = [newEntry, ...savedReports].slice(0, 30);
    setSavedReports(updated);
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage quota errors
    }
    setHistorySavedFeedback(true);
    showToast('Laporan disimpan ke Riwayat.', 'success');
    setTimeout(() => setHistorySavedFeedback(false), 2200);
  };

  const handleLoadReport = (report: SavedReport) => {
    setFormData({
      ...report.data,
      namaJalan: report.data.namaJalan ?? '',
      provinsi: report.data.provinsi ?? 'Jawa Tengah',
      gunakanIkonWa: report.data.gunakanIkonWa ?? true,
      stempelKopFoto: report.data.stempelKopFoto ?? true,
    });
    setActiveTab('form');
    setMobilePane('edit');
    showToast(`Laporan "${report.data.perihal}" dimuat ke formulir.`, 'success');
  };

  const handleDeleteReport = (id: string) => {
    const updated = savedReports.filter((r) => r.id !== id);
    setSavedReports(updated);
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleResetForm = () => {
    photoSlots.forEach((img) => {
      if (img) URL.revokeObjectURL(img.previewUrl);
    });
    setPhotoSlots([null, null]);
    setFormData(createInitialFormData());
    setActiveTab('form');
    showToast('Formulir dikembalikan ke setelan awal.', 'info');
  };

  const handleQuickSendMobileBar = async () => {
    await navigator.clipboard.writeText(formattedMessage).catch(() => {});

    const preparedFiles =
      images.length > 0 && formData.stempelKopFoto
        ? await Promise.all(
            images.map((img) => stampInfographicKopOnFile(img.file, formData))
          )
        : images.map((i) => i.file);

    if (preparedFiles.length > 0 && navigator.share && navigator.canShare) {
      if (navigator.canShare({ files: preparedFiles })) {
        try {
          await navigator.share({
            files: preparedFiles,
            text: formattedMessage,
            title: formData.perihal || 'Laporan Kegiatan',
          });
          return;
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return;
        }
      }
    }

    if (preparedFiles.length > 0 && typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      try {
        const pngBlob = await convertImageFileToPngBlob(preparedFiles[0]);
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
        showToast('WhatsApp dibuka dengan narasi! Foto juga disalin — tempel (Ctrl+V) di chat WA.', 'info');
      } catch {
        // ignore clipboard image error
      }
    }

    const url = buildWhatsAppUrl(formattedMessage, formData.nomorTujuanWa);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F6F8] text-slate-900">
      {/* Top Bar: Clean 3-zone contract */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-8 px-4 sm:px-6 h-16">
          {/* Zone 1: Single-line brand mark */}
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-emerald-400">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              SiapLapor WA
            </span>
          </button>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'form'
                  ? 'text-slate-900 font-semibold underline decoration-emerald-600 decoration-2 underline-offset-8'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Formulir Laporan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'history'
                  ? 'text-slate-900 font-semibold underline decoration-emerald-600 decoration-2 underline-offset-8'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Riwayat ({savedReports.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'guide'
                  ? 'text-slate-900 font-semibold underline decoration-emerald-600 decoration-2 underline-offset-8'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Cara Kirim Foto
            </button>
          </nav>

          {/* Zone 3: Single primary utility action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetForm}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span>Reset Form</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Secondary Tab Bar (only on < md) */}
      <div className="md:hidden border-b border-slate-200 bg-white px-4 py-2 flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('form')}
          className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'form' ? 'bg-slate-900 text-white' : 'text-slate-600 bg-slate-100'
          }`}
        >
          Formulir
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'history' ? 'bg-slate-900 text-white' : 'text-slate-600 bg-slate-100'
          }`}
        >
          Riwayat ({savedReports.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('guide')}
          className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'guide' ? 'bg-slate-900 text-white' : 'text-slate-600 bg-slate-100'
          }`}
        >
          Cara Kirim Foto
        </button>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-20 right-4 left-4 sm:left-auto sm:max-w-md z-50">
          <div
            className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-xs font-medium shadow-lg ${
              toast.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : toast.tone === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-slate-200 bg-white text-slate-800'
            }`}
          >
            {toast.tone === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : toast.tone === 'warning' ? (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-[1360px] px-4 sm:px-6 py-6 pb-24 lg:pb-10">
        {activeTab === 'form' && (
          <>
            {/* Intro strip */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 text-balance">
                  Formulir Laporan Kegiatan Siap Kirim WhatsApp
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Isi data kegiatan, unggah foto dokumentasi, lalu kirim bersamaan dengan narasi laporan ke grup atau kontak WhatsApp.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap shrink-0">
                <span>Format: Kop Resmi</span>
                <span aria-hidden="true">·</span>
                <span>{images.length}/6 Foto terlampir</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form */}
              <div
                className={`lg:col-span-7 ${
                  mobilePane === 'preview' ? 'hidden lg:block' : 'block'
                }`}
              >
                <ReportForm
                  data={formData}
                  photoSlots={photoSlots}
                  onChange={handleFieldChange}
                  onApplyTemplate={handleApplyTemplate}
                  onSetSlotImages={handleSetSlotImages}
                  onAddPhotoSlot={handleAddPhotoSlot}
                  onRemoveSlotImage={handleRemoveSlotImage}
                  onReplaceWithCollage={handleReplaceWithCollage}
                  onSaveProfile={handleSaveProfile}
                  profileSaved={profileSaved}
                />
              </div>

              {/* Right Column: Live WhatsApp Preview & Dispatch */}
              <div
                className={`lg:col-span-5 lg:sticky lg:top-20 ${
                  mobilePane === 'edit' ? 'hidden lg:block' : 'block'
                }`}
              >
                <WhatsAppPreview
                  data={formData}
                  images={images}
                  formattedMessage={formattedMessage}
                  onChange={handleFieldChange}
                  onSaveToHistory={handleSaveToHistory}
                  historySavedFeedback={historySavedFeedback}
                  onNotify={showToast}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <HistoryView
            reports={savedReports}
            onLoadReport={handleLoadReport}
            onDeleteReport={handleDeleteReport}
            onBackToForm={() => setActiveTab('form')}
          />
        )}

        {activeTab === 'guide' && (
          <div className="mx-auto max-w-3xl space-y-5">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">
                    Cara Mengirim 1 Narasi & Beberapa Foto ke WhatsApp
                  </h1>
                  <p className="text-xs text-slate-500">
                    Panduan pengiriman di HP (Android/iOS) dan Komputer (WhatsApp Web)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Smartphone className="h-4.5 w-4.5 text-emerald-600" />
                    <span>Melalui HP (Android / iPhone)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs leading-relaxed text-slate-600">
                    <li>Isi formulir dan unggah beberapa foto dokumentasi (bisa pilih langsung beberapa foto sekaligus atau tambah kolom hingga 6 foto).</li>
                    <li>Klik tombol hijau <strong>Kirim 1 Narasi + Foto ke WhatsApp</strong>.</li>
                    <li>Menu berbagi perangkat akan terbuka otomatis membawa semua foto beserta 1 teks narasinya.</li>
                    <li>Pilih ikon <strong>WhatsApp</strong>, pilih grup/kontak tujuan, lalu tekan Kirim.</li>
                  </ol>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Monitor className="h-4.5 w-4.5 text-sky-600" />
                    <span>Melalui Komputer (WhatsApp Web)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs leading-relaxed text-slate-600">
                    <li>Anda dapat mengklik <strong>Gabung Foto Jadi 1 Kolase</strong> bila ingin semua foto tergabung dalam 1 gambar, atau membiarkannya terpisah.</li>
                    <li>Klik tombol hijau <strong>Kirim 1 Narasi + Foto ke WhatsApp</strong> untuk membuka WA Web dengan 1 narasi & menyalin Foto 1.</li>
                    <li>Di kolom chat WhatsApp Web, tekan <strong>Ctrl + V</strong> untuk menempelkan Foto 1, lalu gunakan tombol <strong>Salin Foto 2, 3...</strong> bila ingin menambahkan foto lainnya ke pesan yang sama.</li>
                  </ol>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className="min-h-[42px] rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Kembali ke Formulir
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Compact Bottom Action Bar (visible only on < lg when on Form tab) */}
      {activeTab === 'form' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md px-3 py-2.5">
          <div className="mx-auto flex max-w-lg items-center gap-2">
            <button
              type="button"
              onClick={() => setMobilePane(mobilePane === 'edit' ? 'preview' : 'edit')}
              className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 whitespace-nowrap cursor-pointer"
            >
              {mobilePane === 'edit' ? (
                <>
                  <Eye className="h-4 w-4 text-slate-600" />
                  <span>Pratinjau WA</span>
                </>
              ) : (
                <>
                  <FileEdit className="h-4 w-4 text-slate-600" />
                  <span>Edit Isian</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleQuickSendMobileBar}
              className="min-h-[44px] flex-[1.4] inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>{images.length > 0 ? `Kirim Foto & WA (${images.length})` : 'Kirim ke WA'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
