// file: pos-api/index.js

// --------------------------------
// 1. IMPOR SEMUA LIBRARY
// --------------------------------
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const { initDB } = require("./models");

// --------------------------------
// 2. INISIALISASI APLIKASI
// --------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// --------------------------------
// 3. KONFIGURASI & MIDDLEWARE (Urutan di sini PENTING!)
// --------------------------------
const corsOptions = {
  origin: [process.env.FRONTEND_URL, "http://localhost:5173"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json()); // Body parser untuk JSON
app.use(cookieParser()); // Cookie parser

// [FIX] Middleware untuk menyajikan file statis (logo, dll) dari folder 'public'
app.use(express.static("public"));

// Konfigurasi Passport.js
app.use(passport.initialize());
require("./config/passport")(passport);

// --------------------------------
// 4. DAFTARKAN SEMUA RUTE API
// --------------------------------
app.use("/api/usaha", require("./routes/usaha.routes"));
app.use("/api/pengguna", require("./routes/pengguna.routes"));
app.use("/api/layanan", require("./routes/layanan.routes"));
app.use("/api/pelanggan", require("./routes/pelanggan.routes"));
app.use("/api/transaksi", require("./routes/transaksi.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/cabang", require("./routes/cabang.routes"));
app.use("/api/kategori", require("./routes/kategori.routes"));
app.use("/api/paket", require("./routes/paket.routes"));
app.use("/api/laporan", require("./routes/laporan.routes"));
app.use("/api/akun", require("./routes/akun.routes"));
app.use("/api/pengaturan", require("./routes/pengaturan.routes"));

// Rute dasar untuk cek status API
app.get("/", (req, res) => {
  res.json({ message: "POS API is running!" });
});

// --------------------------------
// 5. JALANKAN DATABASE & SERVER
// --------------------------------
const run = async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`✅ Server berjalan di port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Tidak dapat menjalankan server:", error);
  }
};

run();
