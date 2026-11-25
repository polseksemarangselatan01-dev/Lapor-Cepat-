import React, { useRef, useState } from 'react';
import {
  BadgeCheck,
  Building,
  Building2,
  Calendar,
  CalendarClock,
  Camera,
  Check,
  Clock,
  Clock3,
  FileText,
  ImagePlus,
  Landmark,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  Plus,
  RefreshCw,
  Send,
  Shield,
  ShieldCheck,
  Signpost,
  Sparkles,
  Sun,
  Tag,
  Trash2,
  User,
  UserCheck,
  Wand2,
} from 'lucide-react';
import {
  ACTIVITY_TEMPLATES,
  ActivityTemplate,
  KELURAHAN_SEMARANG_SELATAN,
  PENUTUP_PRESETS,
  PERIHAL_PRESETS,
  ReportFormData,
  ReportImage,
  TRIBRATA_LOGO_PATH,
} from '../types/report';
import {
  createCollageFile,
  formatBytes,
  formatIndonesianDate,
  getIndonesianDay,
} from '../utils/formatReport';

interface ReportFormProps {
  data: ReportFormData;
  photoSlots: (ReportImage | null)[];
  onChange: <K extends keyof ReportFormData>(key: K, value: ReportFormData[K]) => void;
  onApplyTemplate: (template: ActivityTemplate) => void;
  onSetSlotImages: (slotIndex: number, files: FileList | File[]) => void;
  onAddPhotoSlot: () => void;
  onRemoveSlotImage: (slotIndex: number) => void;
  onReplaceWithCollage: (collageFile: File) => void;
  onSaveProfile: () => void;
  profileSaved: boolean;
}

interface PhotoSlotCardProps {
  slotIndex: number;
  title: string;
  image: ReportImage | null;
  onSetFiles: (slotIndex: number, files: FileList | File[]) => void;
  onRemove: (slotIndex: number) => void;
}

const PhotoSlotCard: React.FC<PhotoSlotCardProps> = ({
  slotIndex,
  title,
  image,
  onSetFiles,
  onRemove,
}) => {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onSetFiles(slotIndex, e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col rounded-2xl border-2 border-dashed p-4 transition-colors ${
        image
          ? 'border-solid border-slate-200 bg-slate-50/60'
          : isDragging
          ? 'border-emerald-500 bg-emerald-50/60'
          : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
      }`}
    >
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onSetFiles(slotIndex, e.target.files);
            e.target.value = '';
          }
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onSetFiles(slotIndex, e.target.files);
            e.target.value = '';
          }
        }}
      />

      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-800">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-mono tabular-nums text-[11px]">
            {slotIndex + 1}
          </span>
          {title}
        </span>
        {image && (
          <span className="text-[11px] font-mono tabular-nums text-slate-400">
            {formatBytes(image.sizeBytes)}
          </span>
        )}
      </div>

      {image ? (
        <div className="flex-1 flex flex-col justify-between gap-3">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
            <img
              src={image.previewUrl}
              alt={title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="min-h-[40px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              <span>Ganti</span>
            </button>
            <button
              type="button"
              onClick={() => onRemove(slotIndex)}
              aria-label={`Hapus ${title}`}
              className="min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-slate-200 text-emerald-600 shadow-xs">
            <ImagePlus className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-slate-800">
            Seret foto atau pilih di bawah
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">JPG, PNG, WebP</p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 w-full">
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="min-h-[42px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              <span>Galeri</span>
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="min-h-[42px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Camera className="h-3.5 w-3.5 text-emerald-600" />
              <span>Kamera</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ReportForm: React.FC<ReportFormProps> = ({
  data,
  photoSlots,
  onChange,
  onApplyTemplate,
  onSetSlotImages,
  onAddPhotoSlot,
  onRemoveSlotImage,
  onReplaceWithCollage,
  onSaveProfile,
  profileSaved,
}) => {
  const [creatingCollage, setCreatingCollage] = useState(false);

  const autoHari = getIndonesianDay(data.tanggal);
  const formattedTanggal = formatIndonesianDate(data.tanggal);
  const filledImages = photoSlots.filter((s): s is ReportImage => s !== null);
  const canMakeCollage = filledImages.length >= 2;

  const handleMakeCollage = async () => {
    if (filledImages.length < 2) return;
    setCreatingCollage(true);
    try {
      const collage = await createCollageFile(filledImages.map((img) => img.file));
      onReplaceWithCollage(collage);
    } finally {
      setCreatingCollage(false);
    }
  };

  const inputBaseClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10';
  const inputPlainClass = `${inputBaseClass} pl-3.5`;
  const inputIconClass = `${inputBaseClass} pl-10`;
  const labelClass = 'block text-xs font-semibold text-slate-700 mb-1.5';

  return (
    <div className="space-y-6">
      {/* Section 1: Template Cepat */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Template Cepat Giat</h2>
              <p className="text-xs text-slate-500">
                Pilih jenis kegiatan untuk mengisi perihal, narasi, dan penutup otomatis
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {ACTIVITY_TEMPLATES.map((tpl) => {
            const isActive = data.perihal.toLowerCase() === tpl.perihal.toLowerCase();
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onApplyTemplate(tpl)}
                className={`min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {tpl.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 2: Kop Kesatuan & Surat */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 p-1.5">
              <img
                src={TRIBRATA_LOGO_PATH}
                alt="Logo Tri Brata"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Kop Kesatuan & Tujuan Laporan</h2>
              <p className="text-xs text-slate-500">
                Identitas kesatuan, pejabat penerima, dan perihal laporan
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="kesatuanInduk" className={labelClass}>
              Kesatuan Induk
            </label>
            <div className="relative">
              <Shield className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="kesatuanInduk"
                type="text"
                value={data.kesatuanInduk}
                onChange={(e) => onChange('kesatuanInduk', e.target.value)}
                placeholder="Contoh: POLRESTABES SEMARANG"
                className={inputIconClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="kesatuanPelaksana" className={labelClass}>
              Kesatuan Pelaksana
            </label>
            <div className="relative">
              <Building className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="kesatuanPelaksana"
                type="text"
                value={data.kesatuanPelaksana}
                onChange={(e) => onChange('kesatuanPelaksana', e.target.value)}
                placeholder="Contoh: POLSEK SEMARANG SELATAN"
                className={inputIconClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="kepadaYth" className={labelClass}>
              Kepada Yth
            </label>
            <div className="relative">
              <UserCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="kepadaYth"
                type="text"
                value={data.kepadaYth}
                onChange={(e) => onChange('kepadaYth', e.target.value)}
                placeholder="Contoh: Kapolrestabes Semarang"
                className={inputIconClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="dari" className={labelClass}>
              Dari
            </label>
            <div className="relative">
              <Send className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="dari"
                type="text"
                value={data.dari}
                onChange={(e) => onChange('dari', e.target.value)}
                placeholder="Contoh: Kapolsek Semarang Selatan"
                className={inputIconClass}
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="perihal" className={labelClass}>
              Perihal Kegiatan
            </label>
            <div className="relative">
              <Tag className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600" />
              <input
                id="perihal"
                type="text"
                value={data.perihal}
                onChange={(e) => onChange('perihal', e.target.value)}
                placeholder="Contoh: Sambang dan Binluh"
                className={inputIconClass}
                list="perihal-options"
              />
            </div>
            <datalist id="perihal-options">
              {PERIHAL_PRESETS.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>
        </div>
      </section>

      {/* Section 3: Waktu & Lokasi */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Hari, Tanggal, Jam & Tempat</h2>
            <p className="text-xs text-slate-500">
              Hari otomatis mengikuti tanggal yang dipilih
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tanggal */}
          <div>
            <label htmlFor="tanggal" className={labelClass}>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-sky-600" />
                Tanggal Kegiatan
              </span>
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-600" />
              <input
                id="tanggal"
                type="date"
                value={data.tanggal}
                onChange={(e) => onChange('tanggal', e.target.value)}
                className={`${inputIconClass} tabular-nums`}
              />
            </div>
            {formattedTanggal && (
              <p className="mt-1 text-[11px] text-slate-500">
                Terformat: <span className="font-medium text-slate-700">{autoHari}, {formattedTanggal}</span>
              </p>
            )}
          </div>

          {/* Hari */}
          <div>
            <label htmlFor="hariOverride" className={labelClass}>
              <span className="inline-flex items-center gap-1.5">
                <Sun className="h-3.5 w-3.5 text-amber-600" />
                Hari (Otomatis / Edit Manual)
              </span>
            </label>
            <div className="relative">
              <Sun className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600" />
              <input
                id="hariOverride"
                type="text"
                value={data.hariOverride}
                onChange={(e) => onChange('hariOverride', e.target.value)}
                placeholder={autoHari || 'Otomatis dari tanggal'}
                className={inputIconClass}
              />
            </div>
          </div>

          {/* Jam Mulai */}
          <div>
            <label htmlFor="jamMulai" className={labelClass}>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                Jam / Pukul Mulai (WIB)
              </span>
            </label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
              <input
                id="jamMulai"
                type="text"
                value={data.jamMulai}
                onChange={(e) => onChange('jamMulai', e.target.value)}
                placeholder="10.30"
                className={`${inputIconClass} font-mono tabular-nums`}
              />
            </div>
          </div>

          {/* Jam Selesai */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="jamSelesai" className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-slate-500" />
                Jam Selesai
              </label>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={data.sampaiSelesai}
                  onChange={(e) => onChange('sampaiSelesai', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                s/d Selesai
              </label>
            </div>
            <div className="relative">
              <Clock3 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="jamSelesai"
                type="text"
                disabled={data.sampaiSelesai}
                value={data.sampaiSelesai ? 'Selesai' : data.jamSelesai}
                onChange={(e) => onChange('jamSelesai', e.target.value)}
                placeholder="12.00"
                className={`${inputIconClass} font-mono tabular-nums disabled:opacity-60 disabled:cursor-not-allowed`}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Nama Jalan (Opsional) */}
          <div className="sm:col-span-3">
            <label htmlFor="namaJalan" className={labelClass}>
              <span className="inline-flex items-center gap-1.5">
                <Signpost className="h-3.5 w-3.5 text-amber-600" />
                Nama Jalan (Opsional)
              </span>
            </label>
            <div className="relative">
              <Signpost className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600" />
              <input
                id="namaJalan"
                type="text"
                value={data.namaJalan}
                onChange={(e) => onChange('namaJalan', e.target.value)}
                placeholder="Contoh: Jl. Veteran / Jl. Pandanaran (kosongkan jika tidak ada)"
                className={inputIconClass}
              />
            </div>
          </div>

          {/* Tempat */}
          <div className="sm:col-span-3">
            <label htmlFor="tempat" className={labelClass}>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-rose-600" />
                Tempat / Alamat Spesifik
              </span>
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-600" />
              <input
                id="tempat"
                type="text"
                value={data.tempat}
                onChange={(e) => onChange('tempat', e.target.value)}
                placeholder="Contoh: RW 05 / Balai Warga / Pos Kamling"
                className={inputIconClass}
              />
            </div>
          </div>

          {/* Kelurahan */}
          <div className="sm:col-span-1">
            <label htmlFor="kelurahan" className={labelClass}>
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                Kelurahan
              </span>
            </label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-600" />
              <input
                id="kelurahan"
                type="text"
                value={data.kelurahan}
                onChange={(e) => onChange('kelurahan', e.target.value)}
                placeholder="Contoh: Barusari"
                list="kelurahan-options"
                className={inputIconClass}
              />
            </div>
            <datalist id="kelurahan-options">
              {KELURAHAN_SEMARANG_SELATAN.map((kel) => (
                <option key={kel} value={kel} />
              ))}
            </datalist>
          </div>

          {/* Kecamatan */}
          <div>
            <label htmlFor="kecamatan" className={labelClass}>
              <span className="inline-flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 text-sky-600" />
                Kecamatan
              </span>
            </label>
            <div className="relative">
              <Landmark className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-600" />
              <input
                id="kecamatan"
                type="text"
                value={data.kecamatan}
                onChange={(e) => onChange('kecamatan', e.target.value)}
                placeholder="Semarang Selatan"
                className={inputIconClass}
              />
            </div>
          </div>

          {/* Provinsi */}
          <div>
            <label htmlFor="provinsi" className={labelClass}>
              <span className="inline-flex items-center gap-1.5">
                <MapIcon className="h-3.5 w-3.5 text-emerald-600" />
                Provinsi
              </span>
            </label>
            <div className="relative">
              <MapIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
              <input
                id="provinsi"
                type="text"
                value={data.provinsi}
                onChange={(e) => onChange('provinsi', e.target.value)}
                placeholder="Jawa Tengah"
                className={inputIconClass}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Pelaksana & Narasi */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Personel & Narasi Kegiatan</h2>
              <p className="text-xs text-slate-500">
                Identitas pelaksana dan uraian lengkap laporan kegiatan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSaveProfile}
            className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {profileSaved ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Profil Tersimpan</span>
              </>
            ) : (
              <span>Simpan Profil Personel</span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="jabatanPelaksana" className={labelClass}>
              Jabatan / Fungsi
            </label>
            <div className="relative">
              <BadgeCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="jabatanPelaksana"
                type="text"
                value={data.jabatanPelaksana}
                onChange={(e) => onChange('jabatanPelaksana', e.target.value)}
                placeholder="Contoh: Bhabinkamtibmas"
                className={inputIconClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="namaPelaksana" className={labelClass}>
              Pangkat & Nama Personel
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="namaPelaksana"
                type="text"
                value={data.namaPelaksana}
                onChange={(e) => onChange('namaPelaksana', e.target.value)}
                placeholder="Contoh: Aipda A Arwani"
                className={inputIconClass}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label htmlFor="narasi" className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                Uraian Narasi Kegiatan
              </label>
              <span className="text-[11px] font-mono tabular-nums text-slate-400">
                {data.narasi.length} karakter
              </span>
            </div>
            <textarea
              id="narasi"
              rows={5}
              value={data.narasi}
              onChange={(e) => onChange('narasi', e.target.value)}
              placeholder="Tuliskan uraian giat secara lengkap..."
              className={`${inputPlainClass} leading-relaxed resize-y`}
            />
            <p className="mt-1.5 text-[11px] text-slate-500">
              Identitas pelaksana (<span className="font-medium text-slate-700">{data.jabatanPelaksana} Kel.{data.kelurahan} {data.namaPelaksana}</span>) otomatis ditambahkan di awal paragraf.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="penutup" className={labelClass}>
                Kalimat Penutup
              </label>
              <input
                id="penutup"
                type="text"
                value={data.penutup}
                onChange={(e) => onChange('penutup', e.target.value)}
                list="penutup-options"
                placeholder="Giat berjalan dengan aman dan tertib."
                className={inputPlainClass}
              />
              <datalist id="penutup-options">
                {PENUTUP_PRESETS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="akhiran" className={labelClass}>
                Akhiran / Sandi
              </label>
              <input
                id="akhiran"
                type="text"
                value={data.akhiran}
                onChange={(e) => onChange('akhiran', e.target.value)}
                placeholder="Dump"
                className={inputPlainClass}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 pt-2">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={data.gunakanBoldWa}
                onChange={(e) => onChange('gunakanBoldWa', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
              />
              Format tebal WhatsApp (*Kop*, *Pelaksana*, *Dump*)
            </label>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={data.gunakanIkonWa}
                onChange={(e) => onChange('gunakanIkonWa', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
              />
              Ikon info grafis pada hasil kirim WA
            </label>
          </div>
        </div>
      </section>

      {/* Section 5: 2 Kolom Dokumentasi Foto (Bisa Beberapa Foto) */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Dokumentasi Foto ({filledImages.length}/6 Foto)
              </h2>
              <p className="text-xs text-slate-500">
                Pilih beberapa foto sekaligus atau isi per kolom untuk dikirim bersama 1 narasi WA
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {photoSlots.length < 6 && (
              <button
                type="button"
                onClick={onAddPhotoSlot}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4 text-emerald-600" />
                <span>Tambah Kolom Foto</span>
              </button>
            )}

            {canMakeCollage && (
              <button
                type="button"
                disabled={creatingCollage}
                onClick={handleMakeCollage}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
              >
                <LayoutGrid className="h-4 w-4" />
                <span>
                  {creatingCollage
                    ? 'Menggabungkan...'
                    : `Gabung ${filledImages.length} Foto Jadi 1 Kolase`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Photo Input Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {photoSlots.map((slotImg, idx) => (
            <PhotoSlotCard
              key={idx}
              slotIndex={idx}
              title={`Foto Dokumentasi ${idx + 1}`}
              image={slotImg}
              onSetFiles={onSetSlotImages}
              onRemove={onRemoveSlotImage}
            />
          ))}
        </div>

        {canMakeCollage && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>
              Tip: Di HP semua foto langsung terkirim bersama 1 narasi. Di WhatsApp Web komputer, Anda bisa menyalin foto satu-persatu atau klik <strong>Gabung {filledImages.length} Foto Jadi 1 Kolase</strong> agar cukup 1x tempel (Ctrl+V).
            </span>
          </p>
        )}
      </section>
    </div>
  );
};
