# 🎬 NG NONTON — Gratis Film & Series
**by Setya Adi Hutama**

Platform streaming film dan series gratis, modern, profesional.

---

## 🚀 Cara Menjalankan

### 1. Install Node.js
Download di https://nodejs.org (versi LTS)

### 2. Dapat API Key TMDB (GRATIS)
1. Daftar di https://www.themoviedb.org
2. Login → klik foto profil → **Settings**
3. Klik menu **API** di sidebar kiri
4. Klik **Create** → pilih **Developer**
5. Isi form sederhana
6. Copy **API Key (v3 auth)**

### 3. Masukkan API Key
Buka file `public/app.js`, cari baris:
```js
const TMDB_KEY = 'YOUR_TMDB_API_KEY';
```
Ganti `YOUR_TMDB_API_KEY` dengan API key kamu.

### 4. Jalankan Server
```bash
node server.js
```

Server akan tampil:
```
╔════════════════════════════════════════╗
║        NG NONTON GRATIS - SERVER       ║
╠════════════════════════════════════════╣
║  Local:   http://localhost:3000        ║
║  Network: http://192.168.1.x:3000      ║
╠════════════════════════════════════════╣
║  By: Setya Adi Hutama                  ║
╚════════════════════════════════════════╝
```

Buka browser ke alamat **Network** untuk akses dari device lain di jaringan yang sama.

---

## 🎯 Fitur
- 🎬 Ribuan film & series dari TMDB
- 📺 5 sumber streaming alternatif (VidSrc, EmbedSu, SuperEmbed, AutoEmbed, 2Embed)
- 🔍 Pencarian real-time
- 📌 Watchlist (tersimpan di browser)
- 🌐 Akses dari HP/tablet satu jaringan
- 📱 Responsive mobile
- 🌍 Bahasa Indonesia

## 📡 Sumber Streaming
Film dimuat dari embed player publik:
- **VidSrc** — vidsrc.to
- **EmbedSu** — embed.su
- **SuperEmbed** — multiembed.mov
- **AutoEmbed** — autoembed.co
- **2Embed** — 2embed.cc

Kalau satu source tidak jalan, coba ganti ke source lain di player.

---

## ⚠️ Disclaimer
Aplikasi ini hanya untuk keperluan belajar dan pengembangan pribadi.
