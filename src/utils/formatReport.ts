import { ReportFormData, TRIBRATA_LOGO_PATH } from '../types/report';

const HARI_INDONESIA = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentTimeDot(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}.${m}`;
}

export function getIndonesianDay(isoDate: string): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  const date = new Date(y, m - 1, d);
  return HARI_INDONESIA[date.getDay()] ?? '';
}

export function formatIndonesianDate(isoDate: string): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const monthName = BULAN_INDONESIA[m - 1] ?? '';
  return `${d} ${monthName} ${y}`;
}

export function formatTimeDisplay(timeStr: string): string {
  return timeStr.trim().replace(':', '.');
}

export function formatWhatsAppMessage(data: ReportFormData): string {
  const b = (text: string) => (data.gunakanBoldWa && text.trim() ? `*${text.trim()}*` : text.trim());
  const ic = (emoji: string, text: string) =>
    data.gunakanIkonWa ? `${emoji} ${text}` : text;

  const hari = data.hariOverride.trim() || getIndonesianDay(data.tanggal);
  const tanggalFormatted = formatIndonesianDate(data.tanggal);
  const jamMulai = formatTimeDisplay(data.jamMulai || '08.00');
  const jamSelesai = data.sampaiSelesai
    ? 'Selesai'
    : `${formatTimeDisplay(data.jamSelesai || '10.00')} Wib`;
  const pukul = `${jamMulai} Wib-${jamSelesai}`;

  const kelurahanText = data.kelurahan.trim()
    ? data.kelurahan.trim().toLowerCase().startsWith('kel.')
      ? data.kelurahan.trim()
      : `Kel.${data.kelurahan.trim()}`
    : '';
  const kecamatanText = data.kecamatan.trim()
    ? data.kecamatan.trim().toLowerCase().startsWith('kec.')
      ? data.kecamatan.trim()
      : `Kec.${data.kecamatan.trim()}`
    : '';
  const wilayahLine = [kelurahanText, kecamatanText].filter(Boolean).join(' ');

  const pelaksanaParts = [
    data.jabatanPelaksana.trim(),
    kelurahanText,
    data.namaPelaksana.trim(),
    data.kesatuanPelaksana
      ? toTitleCasePreservingAcronyms(data.kesatuanPelaksana)
      : '',
  ].filter(Boolean);

  const pelaksanaHeader = pelaksanaParts.join(' ');
  const narasiBody = data.narasi.trim();
  const paragraph = pelaksanaHeader
    ? `${ic('👮', b(pelaksanaHeader))} ${narasiBody}`.trim()
    : narasiBody;

  const lines: string[] = [];

  if (data.kesatuanInduk.trim()) {
    lines.push(b(data.kesatuanInduk));
  }
  if (data.kesatuanPelaksana.trim()) {
    lines.push(b(data.kesatuanPelaksana));
  }
  lines.push('===========================');
  lines.push('');

  lines.push(ic('📩', b('Kepada Yth :')));
  lines.push(data.kepadaYth.trim() || '-');
  lines.push('');

  lines.push(ic('📤', b('Dari :')));
  lines.push(data.dari.trim() || '-');
  lines.push('');

  lines.push(ic('📌', b('Perihal :')));
  lines.push(data.perihal.trim() || '-');
  lines.push('');

  const tempatLengkap = [data.namaJalan.trim(), data.tempat.trim()]
    .filter(Boolean)
    .join(', ');

  lines.push(ic('📋', b('Mohon ijin melaporkan kegiatan pada :')));
  lines.push(ic('☀️', `Hari      : ${hari}`));
  lines.push(ic('📅', `Tanggal : ${tanggalFormatted}`));
  lines.push(ic('⏰', `Pukul     : ${pukul}`));
  lines.push(ic('📍', `Tempat   : ${tempatLengkap || '-'}`));
  if (wilayahLine) {
    lines.push(ic('🏘️', wilayahLine));
  }
  lines.push('');

  if (paragraph) {
    lines.push(paragraph);
    lines.push('');
  }

  if (data.penutup.trim()) {
    lines.push(ic('✅', data.penutup.trim()));
  }

  if (data.akhiran.trim()) {
    lines.push('');
    lines.push(ic('🔰', b(data.akhiran)));
  }

  return lines.join('\n');
}

function toTitleCasePreservingAcronyms(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 2) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function normalizeWhatsAppPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith('8')) {
    return `62${digits}`;
  }
  return digits;
}

export function buildWhatsAppUrl(message: string, phoneNumber?: string): string {
  const normalized = phoneNumber ? normalizeWhatsAppPhone(phoneNumber) : '';
  const encoded = encodeURIComponent(message);
  if (normalized) {
    return `https://wa.me/${normalized}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function convertImageFileToPngBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas context tidak tersedia'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) resolve(blob);
            else reject(new Error('Gagal mengonversi gambar ke PNG'));
          },
          'image/png',
          0.95
        );
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal memuat gambar'));
    };
    img.src = url;
  });
}

export async function createCollageFile(files: File[]): Promise<File> {
  const loaded = await Promise.all(
    files.slice(0, 6).map(
      (file) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          const url = URL.createObjectURL(file);
          img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Gagal memuat foto kolase'));
          };
          img.src = url;
        })
    )
  );

  const count = loaded.length;
  const cols = count === 1 ? 1 : 2;
  const rows = Math.ceil(count / cols);
  const cellW = 800;
  const cellH = 600;
  const gap = 12;

  const canvas = document.createElement('canvas');
  canvas.width = cols * cellW + (cols + 1) * gap;
  canvas.height = rows * cellH + (rows + 1) * gap;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak tersedia');

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  loaded.forEach((img, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = gap + col * (cellW + gap);
    const y = gap + row * (cellH + gap);

    // Cover crop inside cell
    const scale = Math.max(cellW / img.naturalWidth, cellH / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const dx = x + (cellW - drawW) / 2;
    const dy = y + (cellH - drawH) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, cellW, cellH);
    ctx.clip();
    ctx.drawImage(img, dx, dy, drawW, drawH);
    ctx.restore();
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Gagal membuat kolase'));
          return;
        }
        resolve(new File([blob], `dokumentasi-giat-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92
    );
  });
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Gagal memuat gambar: ${src}`));
    img.src = src;
  });
}

export async function stampInfographicKopOnFile(
  file: File,
  data: ReportFormData
): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const photo = await loadHtmlImage(objectUrl);

    const w = photo.naturalWidth;
    const h = photo.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(photo, 0, 0, w, h);

    const hari = data.hariOverride.trim() || getIndonesianDay(data.tanggal);
    const tgl = formatIndonesianDate(data.tanggal);
    const jamMulai = formatTimeDisplay(data.jamMulai || '08.00');
    const pukulFoto = `${jamMulai} Wib`;

    const namaJalanText = data.namaJalan.trim();
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

    const timestampLines = [
      `${hari}, ${tgl}, ${pukulFoto}`,
      namaJalanText,
      kelText,
      kecText,
      provText,
    ].filter(Boolean);

    // Normal-sized Arial Narrow white text, transparent background, bottom-right placement
    const fontSize = Math.max(16, Math.min(40, Math.round(Math.min(w, h) * 0.036)));
    const lineHeight = Math.round(fontSize * 1.28);
    const padX = Math.max(14, Math.round(w * 0.025));
    const padY = Math.max(12, Math.round(h * 0.022));

    ctx.save();
    ctx.font = `600 ${fontSize}px "Arial Narrow", "Archivo Narrow", Arial, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = Math.max(4, Math.round(fontSize * 0.28));
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    const totalLines = timestampLines.length;
    timestampLines.forEach((lineText, idx) => {
      const y = h - padY - (totalLines - 1 - idx) * lineHeight;
      ctx.fillText(lineText, w - padX, y, w - padX * 2);
    });
    ctx.restore();

    return await new Promise<File>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(
            new File([blob], `ts-${file.name.replace(/\.[^.]+$/, '')}.jpg`, {
              type: 'image/jpeg',
            })
          );
        },
        'image/jpeg',
        0.92
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
