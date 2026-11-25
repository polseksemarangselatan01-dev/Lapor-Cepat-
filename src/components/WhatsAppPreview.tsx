import React, { useMemo, useState } from 'react';
import {
  BookmarkPlus,
  Calendar,
  Camera,
  Check,
  CheckCheck,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Sparkles,
} from 'lucide-react';
import {
  ReportFormData,
  ReportImage,
  TRIBRATA_LOGO_PATH,
} from '../types/report';
import {
  buildWhatsAppUrl,
  convertImageFileToPngBlob,
  formatIndonesianDate,
  formatTimeDisplay,
  getCurrentTimeDot,
  getIndonesianDay,
  stampInfographicKopOnFile,
} from '../utils/formatReport';

interface WhatsAppPreviewProps {
  data: ReportFormData;
  images: ReportImage[];
  formattedMessage: string;
  onChange: <K extends keyof ReportFormData>(key: K, value: ReportFormData[K]) => void;
  onSaveToHistory: () => void;
  historySavedFeedback: boolean;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'warning') => void;
}

function renderWhatsAppFormattedLine(
  line: string,
  lineIdx: number
): React.ReactNode {
  if (!line) return <br key={lineIdx} />;

  // Parse *bold* segments safely without raw HTML injection
  const segments = line.split(/(\*[^*]+\*)/g);
  return (
    <span key={lineIdx} className="block leading-[1.45]">
      {segments.map((seg, idx) => {
        if (seg.startsWith('*') && seg.endsWith('*') && seg.length > 2) {
          return (
            <strong key={idx} className="font-bold text-white">
              {seg.slice(1, -1)}
            </strong>
          );
        }
        return <React.Fragment key={idx}>{seg}</React.Fragment>;
      })}
    </span>
  );
}

export const WhatsAppPreview: React.FC<WhatsAppPreviewProps> = ({
  data,
  images,
  formattedMessage,
  onChange,
  onSaveToHistory,
  historySavedFeedback,
  onNotify,
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImageIdx, setCopiedImageIdx] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);

  const timeNow = useMemo(() => getCurrentTimeDot(), []);
  const lines = useMemo(() => formattedMessage.split('\n'), [formattedMessage]);

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function';

  const getPreparedImageFile = async (file: File): Promise<File> => {
    if (!data.stempelKopFoto) return file;
    return stampInfographicKopOnFile(file, data);
  };

  const copyTextToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formattedMessage);
      setCopiedText(true);
      onNotify('Narasi laporan berhasil disalin ke clipboard.', 'success');
      setTimeout(() => setCopiedText(false), 2200);
      return true;
    } catch {
      onNotify('Gagal menyalin teks. Silakan salin manual dari pratinjau.', 'warning');
      return false;
    }
  };

  const copyImageToClipboard = async (index = 0, silent = false): Promise<boolean> => {
    const target = images[index];
    if (!target) return false;
    try {
      const prepared = await getPreparedImageFile(target.file);
      const pngBlob = await convertImageFileToPngBlob(prepared);
      if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
        if (!silent) {
          onNotify('Browser ini belum mendukung salin gambar langsung. Gunakan Unduh Foto.', 'warning');
        }
        return false;
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
      setCopiedImageIdx(index);
      if (!silent) {
        onNotify(
          `Foto ${index + 1} disalin ke clipboard. Tekan Ctrl+V di WhatsApp untuk menempelkan foto.`,
          'success'
        );
      }
      setTimeout(() => setCopiedImageIdx(null), 2500);
      return true;
    } catch {
      if (!silent) {
        onNotify('Tidak dapat menyalin gambar ke clipboard di browser ini.', 'warning');
      }
      return false;
    }
  };

  const handleDownloadImages = async () => {
    if (images.length === 0) return;
    for (let idx = 0; idx < images.length; idx++) {
      const img = images[idx];
      const prepared = await getPreparedImageFile(img.file);
      const url = URL.createObjectURL(prepared);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-giat-${idx + 1}-${prepared.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    onNotify(`${images.length} foto dokumentasi diunduh.`, 'success');
  };

  const openWhatsAppText = () => {
    const url = buildWhatsAppUrl(formattedMessage, data.nomorTujuanWa);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSendImageAndNarrative = async () => {
    try {
      await navigator.clipboard.writeText(formattedMessage);
    } catch {
      // Ignore if clipboard blocked
    }

    if (images.length > 0) {
      setSharing(true);
      const preparedFiles = await Promise.all(
        images.map((img) => getPreparedImageFile(img.file))
      );

      if (canShareFiles && navigator.canShare({ files: preparedFiles })) {
        try {
          await navigator.share({
            files: preparedFiles,
            text: formattedMessage,
            title: data.perihal || 'Laporan Kegiatan',
          });
          onNotify('Berhasil membuka menu kirim! Pilih WhatsApp untuk mengirim foto & narasi.', 'success');
          setSharing(false);
          return;
        } catch (err) {
          setSharing(false);
          if ((err as Error)?.name === 'AbortError') {
            return;
          }
        }
      }
      setSharing(false);

      // Fallback for Desktop browsers
      const imageCopied = await copyImageToClipboard(0, true);
      openWhatsAppText();
      if (imageCopied) {
        onNotify(
          images.length > 1
            ? `WhatsApp dibuka dengan 1 narasi & Foto 1 sudah disalin (Ctrl+V). Gunakan tombol Salin Foto 2..${images.length} di bawah untuk melampirkan foto lainnya.`
            : 'WhatsApp dibuka dengan narasi! Foto juga sudah disalin — tekan Ctrl+V di kolom chat WA untuk melampirkan foto.',
          'info'
        );
      } else {
        await handleDownloadImages();
        onNotify(
          `WhatsApp dibuka dengan 1 narasi, dan ${images.length} foto telah diunduh agar siap dilampirkan di chat WA.`,
          'info'
        );
      }
    } else {
      openWhatsAppText();
      onNotify('Membuka WhatsApp dengan narasi laporan.', 'success');
    }
  };

  const hariDisplay = data.hariOverride.trim() || getIndonesianDay(data.tanggal);
  const tanggalDisplay = formatIndonesianDate(data.tanggal);
  const pukulDisplay = `${formatTimeDisplay(data.jamMulai || '08.00')} - ${
    data.sampaiSelesai ? 'Selesai' : formatTimeDisplay(data.jamSelesai || '10.00')
  }`;
  const pukulFotoDisplay = `${formatTimeDisplay(data.jamMulai || '08.00')} Wib`;
  const namaJalanText = data.namaJalan.trim();
  const alamatLine1 = [namaJalanText, data.tempat.trim()].filter(Boolean).join(', ');
  const kelText = data.kelurahan.trim()
    ? data.kelurahan.trim().toLowerCase().startsWith('kel.')
      ? data.kelurahan.trim()
      : `Kel. ${data.kelurahan.trim()}`
    : '';
  const kecText = data.kecamatan.trim()
    ? data.kecamatan.trim().toLowerCase().startsWith('kec.')
      ? data.kecamatan.trim()
      : `Kec. ${data.kecamatan.trim()}`
    : '';
  const provText = data.provinsi.trim() || 'Jawa Tengah';

  return (
    <div className="space-y-4">
      {/* Infographic Summary Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4">
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={TRIBRATA_LOGO_PATH}
              alt="Logo Tri Brata"
              referrerPolicy="no-referrer"
              className="h-5 w-5 shrink-0 object-contain"
            />
            <span className="truncate text-xs font-bold text-slate-900">
              Ringkasan Info Grafis Siap Kirim
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange('gunakanIkonWa', !data.gunakanIkonWa)}
            className={`min-h-[30px] inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              data.gunakanIkonWa
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{data.gunakanIkonWa ? 'Ikon WA: Aktif' : 'Ikon WA: Nonaktif'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-400">Hari & Tanggal</p>
              <p className="truncate text-xs font-semibold text-slate-800 tabular-nums">
                {hariDisplay}, {tanggalDisplay}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-400">Jam Kegiatan</p>
              <p className="truncate text-xs font-semibold text-slate-800 font-mono tabular-nums">
                {pukulDisplay}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-400">Tempat</p>
              <p className="truncate text-xs font-semibold text-slate-800">
                {alamatLine1 || '-'} · {data.kelurahan || '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Camera className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-400">Lampiran Media</p>
              <p className="truncate text-xs font-semibold text-slate-800 tabular-nums">
                1 Narasi · {images.length} Foto
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Realistic WhatsApp Preview Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#0B141A] shadow-sm">
        {/* WA Top Chat Header */}
        <div className="flex items-center justify-between gap-3 bg-[#1F2C34] px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 p-1.5 border border-amber-400/30">
              <img
                src={TRIBRATA_LOGO_PATH}
                alt="Logo Tri Brata"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">
                {data.namaGrupPreview || data.kesatuanPelaksana || 'Grup WhatsApp'}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                Pratinjau langsung pesan WhatsApp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSaveToHistory}
            className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-white/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Simpan ke riwayat laporan"
          >
            {historySavedFeedback ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-300">Tersimpan</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="h-3.5 w-3.5" />
                <span>Simpan Draft</span>
              </>
            )}
          </button>
        </div>

        {/* WA Chat Area */}
        <div className="p-4 max-h-[540px] overflow-y-auto bg-[#0B141A]">
          <div className="mx-auto max-w-[96%] rounded-2xl rounded-tl-sm bg-[#202C33] p-2.5 text-[13px] text-[#E9EDEF] shadow-xs border border-white/5">
            {/* Sender Name inside Group */}
            <p className="px-1.5 pb-1.5 text-xs font-semibold text-emerald-400">
              {data.namaPelaksana || 'Pelaksana'}
            </p>

            {/* Attached Photo(s) inside same WA bubble */}
            {images.length > 0 && (
              <div
                className={`mb-2 overflow-hidden rounded-xl bg-slate-900 ${
                  images.length === 1
                    ? 'grid grid-cols-1'
                    : 'grid grid-cols-2 gap-1'
                }`}
              >
                {images.slice(0, 4).map((img, idx) => {
                  const extraCount = images.length > 4 && idx === 3 ? images.length - 4 : 0;
                  return (
                    <div
                      key={img.id}
                      className={`relative overflow-hidden ${
                        images.length === 3 && idx === 0
                          ? 'col-span-2 aspect-[16/9]'
                          : 'aspect-[4/3]'
                      }`}
                    >
                      <img
                        src={img.previewUrl}
                        alt={`Lampiran ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                      {/* Live preview of transparent bottom-right Arial Narrow timestamp */}
                      {data.stempelKopFoto && (
                        <div className="pointer-events-none absolute right-2.5 bottom-2 max-w-[92%] text-right font-['Arial_Narrow','Archivo_Narrow',Arial,sans-serif] text-[11px] sm:text-xs leading-[1.28] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                          <p className="truncate">
                            {hariDisplay}, {tanggalDisplay}, {pukulFotoDisplay}
                          </p>
                          {namaJalanText && <p className="truncate">{namaJalanText}</p>}
                          {kelText && <p className="truncate">{kelText}</p>}
                          {kecText && <p className="truncate">{kecText}</p>}
                          {provText && <p className="truncate">{provText}</p>}
                        </div>
                      )}
                      {extraCount > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-bold text-white tabular-nums">
                          +{extraCount}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Message Caption / Narrative */}
            <div className="px-1.5 pb-1 break-words">
              {lines.map((line, i) => renderWhatsAppFormattedLine(line, i))}
            </div>

            {/* Timestamp & Read Receipts */}
            <div className="flex items-center justify-end gap-1 px-1.5 pt-1 text-[10px] font-mono tabular-nums text-slate-400">
              <span>{timeNow}</span>
              <CheckCheck className="h-3.5 w-3.5 text-sky-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Control Panel */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-4">
        <div>
          <label htmlFor="nomorTujuanWa" className="block text-xs font-semibold text-slate-700 mb-1.5">
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-emerald-600" />
              Nomor WA Tujuan (Opsional)
            </span>
          </label>
          <input
            id="nomorTujuanWa"
            type="tel"
            value={data.nomorTujuanWa}
            onChange={(e) => onChange('nomorTujuanWa', e.target.value)}
            placeholder="Kosongkan untuk pilih Grup / Kontak langsung di WA"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 font-mono tabular-nums focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/15"
          />
        </div>

        {/* Toggle for adding bottom-right transparent Arial Narrow timestamp onto photos */}
        {images.length > 0 && (
          <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={data.stempelKopFoto}
              onChange={(e) => onChange('stempelKopFoto', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
            />
            <Clock className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Tambahkan timestamp kegiatan (kanan bawah, Arial Narrow) pada foto</span>
          </label>
        )}

        {/* Primary CTA: Send 1 Narrative + Multiple Photos */}
        <button
          type="button"
          disabled={sharing}
          onClick={handleSendImageAndNarrative}
          className="w-full min-h-[48px] flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
        >
          {images.length > 0 ? (
            <>
              <Share2 className="h-4.5 w-4.5 shrink-0" />
              <span>
                {sharing
                  ? 'Menyiapkan Lampiran...'
                  : `Kirim 1 Narasi + ${images.length} Foto ke WhatsApp`}
              </span>
            </>
          ) : (
            <>
              <MessageCircle className="h-4.5 w-4.5 shrink-0" />
              <span>Kirim Narasi ke WhatsApp</span>
            </>
          )}
        </button>

        {/* Secondary Action Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={copyTextToClipboard}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            {copiedText ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700">Teks Disalin</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-slate-500" />
                <span>Salin 1 Narasi</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={openWhatsAppText}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            <ExternalLink className="h-4 w-4 text-emerald-600" />
            <span>Buka WA (Teks)</span>
          </button>

          {images.length === 1 && (
            <button
              type="button"
              onClick={() => copyImageToClipboard(0, false)}
              className="min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
            >
              {copiedImageIdx === 0 ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700">Foto Disalin</span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 text-slate-500" />
                  <span>Salin Foto (Ctrl+V)</span>
                </>
              )}
            </button>
          )}

          {images.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadImages}
              className={`min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer ${
                images.length > 1 ? 'col-span-2' : ''
              }`}
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Unduh Semua Foto ({images.length})</span>
            </button>
          )}
        </div>

        {/* Multi-photo quick copy buttons for Desktop WhatsApp Web */}
        {images.length > 1 && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-semibold text-slate-600">
              Salin foto per lampiran (untuk tempel Ctrl+V di WhatsApp Web):
            </p>
            <div className="flex flex-wrap gap-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => copyImageToClipboard(idx, false)}
                  className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {copiedImageIdx === idx ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Foto {idx + 1} Disalin</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                      <span>Salin Foto {idx + 1}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Guidance on sending 1 narrative + multiple photos */}
        <p className="text-[11px] leading-relaxed text-slate-500 pt-1 border-t border-slate-100">
          {images.length > 0
            ? 'Di HP (Android/iOS), tombol hijau mengirim 1 narasi bersama seluruh foto sekaligus ke WhatsApp. Di komputer/WhatsApp Web, Foto 1 otomatis disalin (Ctrl+V) dan Anda dapat menyalin Foto 2, 3, dst. atau menggabungkannya jadi 1 kolase.'
            : 'Tambahkan foto di bagian Dokumentasi jika ingin mengirim 1 narasi bersama beberapa gambar sekaligus.'}
        </p>
      </div>
    </div>
  );
};
