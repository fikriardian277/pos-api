// file: pos-api/routes/paket.routes.js

const express = require("express");
const { Paket, Layanan } = require("../models"); // Pastikan model diimpor dengan benar
const authenticateToken = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize");

const router = express.Router();

// GET all packages for a business
router.get("/", authenticateToken, async (req, res) => {
  try {
    const pakets = await Paket.findAll({
      where: { usaha_id: req.user.usaha_id },
    });
    res.json(pakets);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data paket.", error: error.message });
  }
});

// POST: Create a new package
router.post(
  "/",
  authenticateToken,
  authorize(["owner", "admin"]),
  async (req, res) => {
    try {
      // [FIX] Tambahkan 'minimal_order' saat mengambil data dari body
      const {
        nama_paket,
        harga,
        estimasi_waktu,
        satuan,
        id_layanan,
        minimal_order,
      } = req.body;
      const { usaha_id } = req.user;

      const layanan = await Layanan.findOne({
        where: { id: id_layanan, usaha_id },
      });
      if (!layanan) {
        return res
          .status(404)
          .json({ message: "Layanan tidak ditemukan di usaha Anda." });
      }

      const paketBaru = await Paket.create({
        nama_paket,
        harga,
        estimasi_waktu,
        satuan,
        id_layanan,
        minimal_order: minimal_order || 0, // Menggunakan variabel yang sudah didefinisikan
        usaha_id,
      });
      res.status(201).json(paketBaru);
    } catch (error) {
      console.error("ERROR CREATE PAKET:", error); // Tambahkan log untuk debugging
      res
        .status(500)
        .json({ message: "Gagal membuat paket.", error: error.message });
    }
  }
);

// PUT: Update a package
router.put(
  "/:id",
  authenticateToken,
  authorize(["owner", "admin"]),
  async (req, res) => {
    try {
      // [FIX] Tambahkan 'minimal_order' saat mengambil data dari body
      const {
        nama_paket,
        harga,
        estimasi_waktu,
        satuan,
        id_layanan,
        minimal_order,
      } = req.body;
      const { usaha_id } = req.user;

      const paket = await Paket.findOne({
        where: { id: req.params.id, usaha_id },
      });
      if (!paket)
        return res.status(404).json({ message: "Paket tidak ditemukan." });

      // Validasi layanan baru jika diubah
      if (id_layanan && id_layanan !== paket.id_layanan) {
        const layanan = await Layanan.findOne({
          where: { id: id_layanan, usaha_id },
        });
        if (!layanan)
          return res
            .status(404)
            .json({ message: "Layanan baru tidak ditemukan." });
      }

      await paket.update({
        nama_paket,
        harga,
        estimasi_waktu,
        satuan,
        id_layanan,
        minimal_order: minimal_order || 0, // Menggunakan variabel yang sudah didefinisikan
      });
      res.json(paket);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Gagal mengupdate paket.", error: error.message });
    }
  }
);

// DELETE: Delete a package
router.delete(
  "/:id",
  authenticateToken,
  authorize(["owner", "admin"]),
  async (req, res) => {
    try {
      const paket = await Paket.findOne({
        where: { id: req.params.id, usaha_id: req.user.usaha_id },
      });
      if (!paket)
        return res.status(404).json({ message: "Paket tidak ditemukan." });

      await paket.destroy();
      res.json({ message: "Paket berhasil dihapus." });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Gagal menghapus paket.", error: error.message });
    }
  }
);

module.exports = router;
