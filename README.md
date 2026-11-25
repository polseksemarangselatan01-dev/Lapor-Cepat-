# SiapLapor WA

Aplikasi web formulir laporan kegiatan lapangan siap kirim WhatsApp, dilengkapi template cepat, penyimpanan profil personel dan riwayat lokal, unggah multi-foto, kolase otomatis, serta timestamp foto otomatis.

## Cara Deploy ke GitHub Pages

1. Unggah (push) seluruh file proyek ini ke repository GitHub Anda (branch `main` atau `master`).
2. Buka repository di GitHub, lalu masuk ke menu **Settings** → **Pages**.
3. Pada bagian **Build and deployment** → **Source**, pilih **GitHub Actions**.
4. Workflow di `.github/workflows/deploy.yml` akan otomatis berjalan setiap ada push ke branch `main`/`master` (atau bisa dijalankan manual melalui tab **Actions** → **Deploy ke GitHub Pages** → **Run workflow**).
5. Setelah selesai, link aplikasi aktif akan tampil di halaman **Settings** → **Pages** (format: `https://<username>.github.io/<nama-repo>/`).

## Menjalankan di Komputer Lokal

```bash
npm install
npm run dev
```

Untuk build produksi:

```bash
npm run build
```
