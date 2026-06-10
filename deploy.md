# Panduan Deployment SImas

## 📋 Ringkasan

| Komponen | Platform | URL Contoh |
|---|---|---|
| Backend (API) | [Render](https://render.com) | `https://simas-250t.onrender.com` |
| Frontend (Web) | [Vercel](https://vercel.com) | `https://simas-frontend.vercel.app` |
| Database | [Neon](https://neon.tech) (PostgreSQL) | (sudah ada) |

---

## 1. Backend — Deploy ke Render

### 1.1 Prasyarat

- Akun [Render](https://dashboard.render.com/register)
- Repository di GitHub/GitLab/Bitbucket yang berisi kode backend

### 1.2 Langkah-langkah

1. **Push kode ke GitHub** (pastikan folder `backend/` sudah ter-push)

2. **Buat Web Service di Render**
   - Login ke [Render Dashboard](https://dashboard.render.com)
   - Klik **New +** → **Web Service**
   - Hubungkan repository GitHub
   - Isi konfigurasi:

   | Pengaturan | Nilai |
   |---|---|
   | **Name** | `simas-backend` |
   | **Region** | Singapore (paling dekat) |
   | **Branch** | `main` (atau branch Anda) |
   | **Root Directory** | `backend` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install && npx prisma generate` |
   | **Start Command** | `npm start` |
   | **Plan** | Free (atau yang sesuai) |

3. **Set Environment Variables** (di bagian "Environment" atau "Advanced"):

   ```
   DATABASE_URL          = postgresql://neondb_owner:npg_...@ep-...neon.tech/neondb?sslmode=require
   JWT_SECRET            = <ganti-dengan-string-acak-kuat>
   JWT_EXPIRES_IN        = 8h
   PORT                  = 3001
   TARIF_BULANAN         = 10000
   TARIF_MAKAM_PER_JIWA  = 10000
   NODE_ENV              = production
   ```

   > **⚠️ JWT_SECRET**: Ganti dengan string acak yang kuat. Bisa generate dengan: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

4. **Klik "Create Web Service"**

5. Tunggu proses build selesai. Render akan otomatis:
   - Install dependencies (`npm install`)
   - Generate Prisma client (`npx prisma generate`)
   - Menjalankan server (`npm start` → `node src/index.js`)

6. **Akses API** di: `https://simas-250t.onrender.com/api/health`

### 1.3 Inisialisasi Database (Seed)

Jalankan seed di Render via **Shell** tab pada dashboard Render:

```bash
cd backend && npx prisma db push && node prisma/seed.js
```

Atau jalankan dari lokal setelah `DATABASE_URL` diisi:

```bash
cd backend
npx prisma db push
node prisma/seed.js
```

---

## 2. Frontend — Deploy ke Vercel

### 2.1 Prasyarat

- Akun [Vercel](https://vercel.com)
- Repository GitHub (sama dengan backend)

### 2.2 Membuat Konfigurasi

Buat file `vercel.json` di root folder **frontend** (`frontend/vercel.json`):

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://simas-250t.onrender.com/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

> **Penjelasan**:
> - Rule pertama: Semua request `/api/*` diteruskan ke backend Render (solve proxy & CORS)
> - Rule kedua: Semua request lainnya (route React) diarahkan ke `index.html` (SPA fallback)

### 2.3 Langkah-langkah Deploy

1. **Push kode ke GitHub** (pastikan folder `frontend/` termasuk file `vercel.json`)

2. **Import Project ke Vercel**
   - Login ke [Vercel Dashboard](https://vercel.com/dashboard)
   - Klik **Add New...** → **Project**
   - Pilih repository GitHub
   - **Root Directory**: pilih `frontend`
   - **Framework Preset**: pilih `Vite`
   - **Build Command**: otomatis terisi `npm run build`
   - **Output Directory**: otomatis terisi `dist`

3. **Environment Variables** (tidak wajib, tapi opsional):

   ```
   VITE_API_URL = https://simas-250t.onrender.com
   ```

   > Catatan: Karena kita pakai `vercel.json` rewrite, variabel ini tidak diperlukan. Tapi jika suatu saat ingin ganti, bisa digunakan.

4. **Klik "Deploy"**

5. Tunggu deploy selesai. Aplikasi bisa diakses di: `https://simas-frontend.vercel.app`

---

## 3. Update `client.js` untuk Production (Alternatif tanpa vercel.json)

Jika tidak ingin menggunakan `vercel.json`, ubah `frontend/src/api/client.js` menjadi:

```js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});
```

Kemudian set `VITE_API_URL` di Vercel environment variables. Namun pendekatan **vercel.json rewrite lebih disarankan** karena tidak ada perubahan kode.

---

## 4. Konfigurasi CORS Backend

Pastikan CORS di `backend/src/index.js` mengizinkan domain frontend:

```js
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://simas-frontend.vercel.app'
  ],
}));
```

Atau izinkan semua (tidak disarankan untuk production):

```js
app.use(cors());  // sudah ada
```

---

## 5. Verifikasi Deployment

### Cek Backend
```bash
curl https://simas-250t.onrender.com/api/health
# → {"status":"ok","service":"SImas Backend"}
```

### Cek Frontend
- Buka `https://simas-frontend.vercel.app` di browser
- Login dengan akun admin (jalankan seed dulu)
- Pastikan data dari backend muncul

---

## 6. Troubleshooting

| Masalah | Solusi |
|---|---|
| **Backend crash** | Cek log di Render dashboard → Logs. Pastikan `DATABASE_URL` benar. |
| **Prisma Client not found** | Pastikan build command: `npm install && npx prisma generate` |
| **Frontend blank page** | Cek Console browser. Pastikan `vercel.json` rewrite sudah benar. |
| **API 404 di frontend** | Pastikan URL backend di `vercel.json` rewrite sudah benar (tanpa trailing slash). |
| **CORS error** | Tambahkan domain frontend ke `origin` CORS di backend. |
| **Database connection refused** | Pastikan IP Render di-allow di Neon (Neon → Settings → IP Allow → tambahkan `0.0.0.0/0`). |

### Allow IP Render di Neon

Neon membatasi koneksi database berdasarkan IP. Render (free plan) menggunakan IP dinamis, jadi tambahkan aturan:

1. Buka [Neon Console](https://console.neon.tech) → project Anda
2. **Settings** → **IP Allow**
3. Pilih **Allow all** (`0.0.0.0/0`) untuk sementara, atau masukkan IP spesifik Render jika static IP.

---

## 7. Auto Deploy

- **Render**: Setiap push ke branch `main` akan otomatis redeploy (bisa diatur di Settings).
- **Vercel**: Sama, setiap push ke branch `main` otomatis redeploy.

Pastikan folder `backend/` dan `frontend/` di-root repository yang sama.
