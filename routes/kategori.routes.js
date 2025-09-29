const express = require("express");
const { Kategori } = require("../models");
const authenticateToken = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize");

const router = express.Router();

// GET: Mendapatkan semua kategori, difilter berdasarkan usaha
router.get("/", authenticateToken, async (req, res) => {
  try {
    // [FIX] Filter kategori berdasarkan usaha_id pengguna yang login
    const kategoris = await Kategori.findAll({
      where: { usaha_id: req.user.usaha_id },
      order: [["createdAt", "ASC"]],
    });
    res.json(kategoris);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Gagal mengambil data kategori.",
        error: error.message,
      });
  }
});

// POST: Membuat kategori baru, terikat pada usaha si pembuat
router.post(
  "/",
  authenticateToken,
  authorize(["owner", "admin"]),
  async (req, res) => {
    try {
      const { nama_kategori } = req.body;
      const { usaha_id } = req.user;

      const kategoriBaru = await Kategori.create({
        nama_kategori,
        usaha_id: usaha_id, // [FIX] Simpan usaha_id
      });
      res.status(201).json(kategoriBaru);
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({ message: "Nama kategori sudah ada." });
      }
      res
        .status(500)
        .json({ message: "Gagal membuat kategori.", error: error.message });
    }
  }
);

// PUT: Mengupdate kategori, pastikan kategori milik usaha yang sama
router.put(
  "/:id",
  authenticateToken,
  authorize(["owner", "admin"]),
  async (req, res) => {
    try {
      const { nama_kategori } = req.body;

      // [FIX] Cari kategori berdasarkan ID DAN usaha_id
      const kategori = await Kategori.findOne({
        where: { id: req.params.id, usaha_id: req.user.usaha_id },
      });
      if (!kategori)
        return res
          .status(404)
          .json({ message: "Kategori tidak ditemukan di usaha Anda." });

      kategori.nama_kategori = nama_kategori;
      await kategori.save();
      res.json(kategori);
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res
          .status(400)
          .json({ message: "Nama kategori sudah digunakan." });
      }
      res
        .status(500)
        .json({ message: "Gagal mengupdate kategori.", error: error.message });
    }
  }
);

// DELETE: Menghapus kategori, pastikan kategori milik usaha yang sama
router.delete(
  "/:id",
  authenticateToken,
  authorize(["owner", "admin"]),
  async (req, res) => {
    try {
      // [FIX] Cari kategori berdasarkan ID DAN usaha_id
      const kategori = await Kategori.findOne({
        where: { id: req.params.id, usaha_id: req.user.usaha_id },
      });
      if (!kategori)
        return res
          .status(404)
          .json({ message: "Kategori tidak ditemukan di usaha Anda." });

      await kategori.destroy();
      res.json({ message: "Kategori berhasil dihapus." });
    } catch (error) {
      // Menangani error jika kategori masih punya layanan terkait
      if (error.name === "SequelizeForeignKeyConstraintError") {
        return res
          .status(400)
          .json({
            message:
              "Gagal menghapus: Kategori ini masih memiliki layanan terkait.",
          });
      }
      res
        .status(500)
        .json({ message: "Gagal menghapus kategori.", error: error.message });
    }
  }
);

module.exports = router;
