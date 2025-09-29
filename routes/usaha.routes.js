const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // <-- [PENTING] Impor JWT
const { Usaha, Pengguna, InvoiceCounter, sequelize } = require("../models");

const router = express.Router();

router.post("/register", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { nama_usaha, nama_lengkap, username, email, password } = req.body;
    if (!nama_usaha || !nama_lengkap || !username || !email || !password) {
      return res.status(400).json({ message: "Semua field wajib diisi." });
    }

    const usahaBaru = await Usaha.create({ nama_usaha }, { transaction: t });

    await InvoiceCounter.create({ usaha_id: usahaBaru.id }, { transaction: t });

    const hashedPassword = await bcrypt.hash(password, 10);
    const ownerBaru = await Pengguna.create(
      {
        nama_lengkap,
        username,
        email,
        password: hashedPassword,
        role: "owner",
        usaha_id: usahaBaru.id,
      },
      { transaction: t }
    );

    // --- [LOGIKA BARU] Langsung Buat Token di Sini ---
    const accessTokenPayload = {
      id: ownerBaru.id,
      username: ownerBaru.username,
      nama_lengkap: ownerBaru.nama_lengkap,
      role: ownerBaru.role,
      id_cabang: ownerBaru.id_cabang,
      usaha_id: ownerBaru.usaha_id,
    };
    const accessToken = jwt.sign(accessTokenPayload, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(
      { id: ownerBaru.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" }
    );

    await ownerBaru.update({ refresh_token: refreshToken }, { transaction: t });
    // --------------------------------------------------

    await t.commit();

    // Kirim refresh token sebagai cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Kirim access token sebagai JSON agar bisa langsung dipakai login
    res.status(201).json({
      message: "Pendaftaran usaha berhasil!",
      accessToken: accessToken, // <-- Kirim accessToken
    });
  } catch (error) {
    await t.rollback();
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Username atau email sudah terdaftar." });
    }
    res
      .status(500)
      .json({ message: "Gagal mendaftarkan usaha.", error: error.message });
  }
});

module.exports = router;
