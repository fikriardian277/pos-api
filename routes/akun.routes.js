// file: routes/akun.routes.js

const express = require("express");
const bcrypt = require("bcryptjs");
const { Pengguna } = require("../models");
const authenticateToken = require("../middleware/auth.middleware");

const router = express.Router();

// --- RUTE UNTUK INFO PROFIL ---

// GET /api/akun/profil -> Mengambil data profil pengguna saat ini
router.get("/profil", authenticateToken, async (req, res) => {
  try {
    // req.user.id didapat dari token JWT setelah login
    const user = await Pengguna.findByPk(req.user.id, {
      attributes: { exclude: ["password"] }, // Jangan kirim password
    });

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }
    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mengambil profil.", error: error.message });
  }
});

// PUT /api/akun/profil -> Memperbarui data profil (contoh: nama lengkap)
router.put("/profil", authenticateToken, async (req, res) => {
  try {
    const { nama_lengkap } = req.body;
    const user = await Pengguna.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    // Hanya perbolehkan update field tertentu
    user.nama_lengkap = nama_lengkap;
    await user.save();

    // Kirim kembali data user yang sudah diupdate (tanpa password)
    const updatedUser = user.toJSON();
    delete updatedUser.password;

    res.json({ message: "Profil berhasil diperbarui.", user: updatedUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal memperbarui profil.", error: error.message });
  }
});

// --- RUTE UNTUK UBAH PASSWORD ---

// PUT /api/akun/ubah-password -> Mengganti password pengguna
router.put("/ubah-password", authenticateToken, async (req, res) => {
  try {
    const { password_lama, password_baru } = req.body;

    if (!password_lama || !password_baru) {
      return res
        .status(400)
        .json({ message: "Password lama dan baru wajib diisi." });
    }

    const user = await Pengguna.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    // 1. Verifikasi password lama
    const isMatch = await bcrypt.compare(password_lama, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password lama salah." });
    }

    // 2. Hash password baru
    const hashedPassword = await bcrypt.hash(password_baru, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password berhasil diubah." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mengubah password.", error: error.message });
  }
});

module.exports = router;
