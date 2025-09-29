const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { Pengguna } = require("../models");
const authenticateToken = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize");

const router = express.Router();

// --- RUTE AUTENTIKASI GOOGLE ---
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login?error=google-auth-failed",
    session: false,
  }),
  async (req, res) => {
    try {
      const user = req.user;
      const accessTokenPayload = {
        id: user.id,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        id_cabang: user.id_cabang,
        usaha_id: user.usaha_id,
      };
      const accessToken = jwt.sign(accessTokenPayload, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });
      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "30d" }
      );
      await user.update({ refresh_token: refreshToken });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      res.redirect(`http://localhost:5173/login/success?token=${accessToken}`);
    } catch (error) {
      res.redirect(`http://localhost:5173/login?error=callback-failed`);
    }
  }
);

// --- RUTE AUTENTIKASI BIASA ---
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await Pengguna.findOne({ where: { username } });
    if (!user || user.status !== "aktif" || !user.password) {
      return res.status(401).json({ message: "Username atau password salah." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Username atau password salah." });
    }
    const accessTokenPayload = {
      id: user.id,
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      role: user.role,
      id_cabang: user.id_cabang,
      usaha_id: user.usaha_id,
    };
    const accessToken = jwt.sign(accessTokenPayload, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" }
    );
    await user.update({ refresh_token: refreshToken });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken });
  } catch (error) {
    // TAMBAHKAN LOG INI UNTUK MELIHAT ERROR ASLINYA
    console.error("🔥 ERROR SAAT LOGIN:", error);
    res
      .status(500)
      .json({
        message: "Terjadi kesalahan pada server.",
        error: error.message,
      });
  }
});

router.get("/refresh-token", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(401);
    const user = await Pengguna.findOne({
      where: { refresh_token: refreshToken },
    });
    if (!user) return res.sendStatus(403);
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err || user.id !== decoded.id) return res.sendStatus(403);
      const accessTokenPayload = {
        id: user.id,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        id_cabang: user.id_cabang,
        usaha_id: user.usaha_id,
      };
      const accessToken = jwt.sign(accessTokenPayload, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });
      res.json({ accessToken });
    });
  } catch (error) {
    res.sendStatus(500);
  }
});

router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const user = await Pengguna.findOne({
        where: { refresh_token: refreshToken },
      });
      if (user) {
        await user.update({ refresh_token: null });
      }
    }
    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logout berhasil." });
  } catch (error) {
    res.sendStatus(500);
  }
});

// --- RUTE MANAJEMEN USER ---
router.get(
  "/",
  authenticateToken,
  authorize(["owner", "admin"]),
  async (req, res) => {
    try {
      const options = {
        attributes: { exclude: ["password", "refresh_token"] },
        where: { status: "aktif", usaha_id: req.user.usaha_id },
      };
      if (req.user.role === "admin") {
        options.where.id_cabang = req.user.id_cabang;
        options.where.role = "kasir";
      }
      const pengguna = await Pengguna.findAll(options);
      res.json(pengguna);
    } catch (error) {
      res.status(500).json({ message: "Gagal mengambil daftar pengguna." });
    }
  }
);

router.post(
  "/register",
  authenticateToken,
  authorize(["owner", "admin"]),
  async (req, res) => {
    try {
      const { nama_lengkap, username, password, role, id_cabang } = req.body;
      const creator = req.user;

      // --- [LOGIKA BARU] Cek User yang Sudah Ada ---
      const existingUser = await Pengguna.findOne({
        where: {
          username: username,
          usaha_id: creator.usaha_id,
        },
      });

      if (existingUser) {
        // Jika user ditemukan dan statusnya aktif, kirim error seperti biasa
        if (existingUser.status === "aktif") {
          return res
            .status(400)
            .json({ message: "Username sudah digunakan oleh pengguna aktif." });
        }

        // Jika user ditemukan tapi NONAKTIF, kirim respons khusus
        if (existingUser.status === "nonaktif") {
          return res.status(409).json({
            // 409 Conflict adalah status yang tepat
            message: `Username '${username}' sudah ada tapi tidak aktif. Aktifkan kembali?`,
            action: "reactivate",
            userId: existingUser.id,
          });
        }
      }
      // --- [AKHIR LOGIKA BARU] ---

      // Jika tidak ada user sama sekali (existingUser adalah null), lanjutkan proses pembuatan user baru
      if (creator.role === "admin" && role !== "kasir") {
        return res
          .status(403)
          .json({ message: "Admin hanya bisa membuat kasir." });
      }
      if (role === "owner") {
        return res
          .status(403)
          .json({ message: "Role owner tidak bisa dibuat." });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await Pengguna.create({
        nama_lengkap,
        username,
        password: hashedPassword,
        role,
        id_cabang: creator.role === "admin" ? creator.id_cabang : id_cabang,
        usaha_id: creator.usaha_id,
      });
      const { password: _, ...userResponse } = newUser.toJSON();
      res
        .status(201)
        .json({ message: "Pengguna berhasil dibuat!", data: userResponse });
    } catch (error) {
      console.error("🔥 ERROR SAAT BUAT PENGGUNA:", error);
      res
        .status(500)
        .json({ message: "Gagal membuat pengguna.", error: error.message });
    }
  }
);

router.put(
  "/:id",
  authenticateToken,
  authorize(["owner", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nama_lengkap, role, id_cabang } = req.body;
      const loggedInUser = req.user;
      const userToUpdate = await Pengguna.findOne({
        where: { id: id, usaha_id: loggedInUser.usaha_id },
      });
      if (!userToUpdate) {
        return res
          .status(404)
          .json({ message: "Pengguna tidak ditemukan di usaha Anda." });
      }
      if (
        loggedInUser.role === "admin" &&
        userToUpdate.id_cabang !== loggedInUser.id_cabang
      ) {
        return res.status(403).json({
          message:
            "Akses ditolak. Anda hanya bisa mengedit user di cabang Anda.",
        });
      }
      if (loggedInUser.role !== "owner" && role && role !== userToUpdate.role) {
        return res
          .status(403)
          .json({ message: "Hanya owner yang bisa mengubah role." });
      }
      await userToUpdate.update({ nama_lengkap, role, id_cabang });
      const {
        password: _,
        refresh_token: __,
        ...userResponse
      } = userToUpdate.toJSON();
      res
        .status(200)
        .json({ message: "Pengguna berhasil diupdate.", data: userResponse });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Gagal mengupdate pengguna.", error: error.message });
    }
  }
);

router.put(
  "/:id/reactivate",
  authenticateToken,
  authorize(["owner", "admin"]),
  async (req, res) => {
    try {
      const userToReactivate = await Pengguna.findOne({
        where: {
          id: req.params.id,
          usaha_id: req.user.usaha_id, // Pastikan user ini milik usaha yang sama
        },
      });

      if (!userToReactivate) {
        return res.status(404).json({ message: "Pengguna tidak ditemukan." });
      }

      if (userToReactivate.status === "aktif") {
        return res.status(400).json({ message: "Pengguna ini sudah aktif." });
      }

      userToReactivate.status = "aktif";
      // Opsional: reset data lain jika perlu, misal password
      // const newPassword = ...;
      // userToReactivate.password = await bcrypt.hash(newPassword, 10);

      await userToReactivate.save();

      const { password: _, ...userResponse } = userToReactivate.toJSON();
      res.json({
        message: "Pengguna berhasil diaktifkan kembali.",
        data: userResponse,
      });
    } catch (error) {
      res.status(500).json({
        message: "Gagal mengaktifkan pengguna.",
        error: error.message,
      });
    }
  }
);

router.delete(
  "/:id",
  authenticateToken,
  authorize(["owner", "admin"]),
  async (req, res) => {
    try {
      const userIdToDeactivate = parseInt(req.params.id, 10);
      const loggedInUser = req.user;
      if (userIdToDeactivate === loggedInUser.id) {
        return res.status(400).json({
          message: "Anda tidak dapat menonaktifkan akun Anda sendiri.",
        });
      }
      const userToDeactivate = await Pengguna.findOne({
        where: { id: userIdToDeactivate, usaha_id: loggedInUser.usaha_id },
      });
      if (!userToDeactivate) {
        return res
          .status(404)
          .json({ message: "User tidak ditemukan di usaha Anda." });
      }
      if (userToDeactivate.role === "owner") {
        return res
          .status(400)
          .json({ message: "Akun owner tidak dapat dinonaktifkan." });
      }
      userToDeactivate.status = "nonaktif";
      await userToDeactivate.save();
      res.json({
        message: `User ${userToDeactivate.username} berhasil dinonaktifkan.`,
      });
    } catch (error) {
      res.status(500).json({ message: "Gagal menonaktifkan user." });
    }
  }
);

module.exports = router;
