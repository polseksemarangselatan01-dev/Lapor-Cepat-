export const TRIBRATA_LOGO_PATH = `${import.meta.env.BASE_URL}assets/aistudio/Logo_Tri_Brata__1___1__7bf85ea6.png`;

export interface ReportImage {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  sizeBytes: number;
}

export interface ReportFormData {
  kesatuanInduk: string;
  kesatuanPelaksana: string;
  kepadaYth: string;
  dari: string;
  perihal: string;
  tanggal: string; // YYYY-MM-DD
  hariOverride: string;
  jamMulai: string;
  jamSelesai: string;
  sampaiSelesai: boolean;
  tempat: string;
  namaJalan: string;
  kelurahan: string;
  kecamatan: string;
  provinsi: string;
  jabatanPelaksana: string;
  namaPelaksana: string;
  narasi: string;
  penutup: string;
  akhiran: string;
  gunakanBoldWa: boolean;
  gunakanIkonWa: boolean;
  stempelKopFoto: boolean;
  nomorTujuanWa: string;
  namaGrupPreview: string;
}

export interface SavedReport {
  id: string;
  savedAt: string;
  data: ReportFormData;
}

export interface ActivityTemplate {
  id: string;
  label: string;
  perihal: string;
  narasiBuilder: (ctx: {
    jabatan: string;
    kelurahan: string;
    nama: string;
    kesatuan: string;
    tempat: string;
  }) => string;
  penutup: string;
}

export const KELURAHAN_SEMARANG_SELATAN = [
  'Barusari',
  'Bulustalan',
  'Lamper Kidul',
  'Lamper Lor',
  'Lamper Tengah',
  'Mugassari',
  'Peterongan',
  'Pleburan',
  'Randusari',
  'Wonodri',
];

export const PERIHAL_PRESETS = [
  'Sambang dan Binluh',
  'Patroli Dialogis',
  'Problem Solving',
  'Monitoring Wilayah',
  'Pengamanan Giat Masyarakat',
  'Koordinasi Kamtibmas',
];

export const PENUTUP_PRESETS = [
  'Giat berjalan dengan aman dan tertib.',
  'Situasi wilayah terpantau aman, lancar, dan kondusif.',
  'Kegiatan selesai dengan tertib, situasi aman terkendali.',
];

export const ACTIVITY_TEMPLATES: ActivityTemplate[] = [
  {
    id: 'sambang-binluh',
    label: 'Sambang & Binluh',
    perihal: 'Sambang dan Binluh',
    narasiBuilder: ({ tempat }) =>
      `giat Sambang dan Binluh di Wilayah ${tempat || 'binaan'} dalam rangka Harkamtibmas koordinasi kamtibmas dengan warga, BKTM menyampaikan pesan kamtibmas dan himbauan waspada C3 bilamana ada kerawanan kamtibmas di lingkungan untuk segera info BKTM, lapor melalui Apk Libas atau Hotline 110`,
    penutup: 'Giat berjalan dengan aman dan tertib.',
  },
  {
    id: 'patroli-dialogis',
    label: 'Patroli Dialogis',
    perihal: 'Patroli Dialogis',
    narasiBuilder: ({ tempat }) =>
      `melaksanakan giat Patroli Dialogis di ${tempat || 'wilayah hukum'} guna antisipasi gangguan kamtibmas serta curat, curas, dan curanmor (C3). Petugas berdialog dengan warga/petugas keamanan setempat serta mengimbau agar segera melapor melalui Apk Libas atau Hotline 110 apabila menemukan hal mencurigakan`,
    penutup: 'Situasi wilayah terpantau aman, lancar, dan kondusif.',
  },
  {
    id: 'problem-solving',
    label: 'Problem Solving',
    perihal: 'Problem Solving',
    narasiBuilder: ({ tempat }) =>
      `melaksanakan giat Problem Solving / mediasi permasalahan warga di ${tempat || 'wilayah binaan'} bersama perangkat kelurahan dan tokoh masyarakat setempat. Kedua belah pihak sepakat menyelesaikan permasalahan secara musyawarah dan kekeluargaan`,
    penutup: 'Giat berjalan dengan aman dan tertib.',
  },
  {
    id: 'pengamanan-giat',
    label: 'Pengamanan Giat',
    perihal: 'Pengamanan Giat Masyarakat',
    narasiBuilder: ({ tempat }) =>
      `melaksanakan giat pengamanan dan pemantauan kegiatan masyarakat di ${tempat || 'lokasi kegiatan'} guna memastikan kelancaran arus lalu lintas serta keamanan lingkungan sekitar hingga acara selesai`,
    penutup: 'Kegiatan selesai dengan tertib, situasi aman terkendali.',
  },
  {
    id: 'monitoring-wilayah',
    label: 'Monitoring Wilayah',
    perihal: 'Monitoring Wilayah',
    narasiBuilder: ({ tempat }) =>
      `melaksanakan giat monitoring situasi kamtibmas dan perkembangan wilayah di ${tempat || 'wilayah binaan'}, berkoordinasi dengan pengurus RT/RW setempat serta memastikan situasi lingkungan tetap kondusif`,
    penutup: 'Situasi wilayah terpantau aman, lancar, dan kondusif.',
  },
];
