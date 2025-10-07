const express = require("express");
const { Layanan, Kategori, Paket } = require("../models");
const authenticateToken = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize");

const router = express.Router();

// GET: Mendapatkan semua layanan, difilter berdasarkan usaha
router.get("/", authenticateToken, async (req, res) => {
  try {
    // [FIX] Tambahkan 'where' untuk memfilter Kategori berdasarkan usaha_id
    const layanans = await Kategori.findAll({
      where: { usaha_id: req.user.usaha_id },
      include: [
        {
          model: Layanan,
          as: "layanans", // <-- Gunakan alias
          include: [
            {
              model: Paket,
              as: "pakets", // <-- Gunakan alias
            },
          ],
        },
      ],
      order: [["createdAt", "ASC"]],
    });
    res.json(layanans);
  } catch (error) {
    // TAMBAHKAN BARIS INI UNTUK MELIHAT ERROR DI LOG RENDER
    console.error("!!! ERROR SAAT GET LAYANAN:", error);

    res
      .status(500)
      .json({ message: "Gagal mengambil data layanan.", error: error.message });
  }
});

// POST: Membuat layanan baru, terikat pada usaha si pembuat
router.post(
  "/",
  authenticateToken,
  authorize(["owner", "admin"]),
  async (req, res) => {
    try {
      const { nama_layanan, id_kategori, catatan } = req.body;
      const { usaha_id } = req.user;

      // [FIX] Validasi bahwa kategori yang dipilih adalah milik usaha yang sama
      const kategori = await Kategori.findOne({
        where: { id: id_kategori, usaha_id: usaha_id },
      });
      if (!kategori) {
        return res
          .status(404)
          .json({ message: "Kategori tidak ditemukan di usaha Anda." });
      }

      const layananBaru = await Layanan.create({
        nama_layanan,
        id_kategori,
        catatan,
        usaha_id: usaha_id, // [FIX] Simpan usaha_id
      });
      res.status(201).json(layananBaru);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Gagal membuat layanan.", error: error.message });
    }
  }
);

// PUT: Mengupdate layanan, pastikan layanan milik usaha yang sama
router.put(
  "/:id",
  authenticateToken,
  authorize(["owner", "admin"]),
  async (req, res) => {
    try {
      const { nama_layanan, id_kategori, catatan } = req.body;
      const { usaha_id } = req.user;

      // [FIX] Cari layanan berdasarkan ID DAN usaha_id
      const layanan = await Layanan.findOne({
        where: { id: req.params.id, usaha_id: usaha_id },
      });
      if (!layanan)
        return res
          .status(404)
          .json({ message: "Layanan tidak ditemukan di usaha Anda." });

      // (Opsional tapi aman) Jika kategori diubah, validasi juga kategori baru
      if (id_kategori && id_kategori !== layanan.id_kategori) {
        const kategori = await Kategori.findOne({
          where: { id: id_kategori, usaha_id: usaha_id },
        });
        if (!kategori)
          return res
            .status(404)
            .json({ message: "Kategori baru tidak ditemukan di usaha Anda." });
      }

      await layanan.update({ nama_layanan, id_kategori, catatan });
      res.json(layanan);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Gagal mengupdate layanan.", error: error.message });
    }
  }
);

// DELETE: Menghapus layanan, pastikan layanan milik usaha yang sama
router.delete(
  "/:id",
  authenticateToken,
  authorize(["owner", "admin"]),
  async (req, res) => {
    try {
      // [FIX] Cari layanan berdasarkan ID DAN usaha_id
      const layanan = await Layanan.findOne({
        where: { id: req.params.id, usaha_id: req.user.usaha_id },
      });
      if (!layanan)
        return res
          .status(404)
          .json({ message: "Layanan tidak ditemukan di usaha Anda." });

      await layanan.destroy();
      res.json({ message: "Layanan berhasil dihapus." });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Gagal menghapus layanan.", error: error.message });
    }
  }
);

module.exports = router;
