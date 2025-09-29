const express = require("express");
const { Cabang } = require("../models");
const authenticateToken = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize");

const router = express.Router();

// Middleware ini memastikan semua rute di bawah ini hanya bisa diakses oleh 'owner'
router.use(authenticateToken, authorize(["owner"]));

// POST: Membuat cabang baru, terikat pada usaha si owner
router.post("/", async (req, res) => {
  try {
    const { nama_cabang, alamat, nomor_telepon } = req.body;
    const { usaha_id } = req.user; // Ambil usaha_id dari token owner

    const cabangBaru = await Cabang.create({
      nama_cabang,
      alamat,
      nomor_telepon,
      usaha_id: usaha_id, // [FIX] Wajib sertakan usaha_id
    });
    res.status(201).json(cabangBaru);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Nama cabang sudah ada." });
    }
    res
      .status(500)
      .json({ message: "Gagal membuat cabang", error: error.message });
  }
});

// GET: Mendapatkan semua cabang milik usaha si owner
router.get("/", async (req, res) => {
  try {
    // [FIX] Filter cabang berdasarkan usaha_id
    const cabangs = await Cabang.findAll({
      where: { usaha_id: req.user.usaha_id },
    });
    res.json(cabangs);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data cabang", error: error.message });
  }
});

// GET: Mendapatkan detail satu cabang, milik usaha si owner
router.get("/:id", async (req, res) => {
  try {
    // [FIX] Cari cabang berdasarkan ID DAN usaha_id
    const cabang = await Cabang.findOne({
      where: { id: req.params.id, usaha_id: req.user.usaha_id },
    });
    if (!cabang) {
      return res.status(404).json({ message: "Cabang tidak ditemukan" });
    }
    res.json(cabang);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mengambil detail cabang", error: error.message });
  }
});

// PUT: Mengupdate cabang, milik usaha si owner
router.put("/:id", async (req, res) => {
  try {
    // [FIX] Cari cabang berdasarkan ID DAN usaha_id sebelum update
    const cabang = await Cabang.findOne({
      where: { id: req.params.id, usaha_id: req.user.usaha_id },
    });
    if (!cabang) {
      return res.status(404).json({ message: "Cabang tidak ditemukan" });
    }
    await cabang.update(req.body);
    res.json({ message: "Cabang berhasil diperbarui", data: cabang });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Nama cabang sudah digunakan." });
    }
    res
      .status(500)
      .json({ message: "Gagal memperbarui cabang", error: error.message });
  }
});

// DELETE: Menghapus cabang, milik usaha si owner
router.delete("/:id", async (req, res) => {
  try {
    // [FIX] Cari cabang berdasarkan ID DAN usaha_id sebelum dihapus
    const cabang = await Cabang.findOne({
      where: { id: req.params.id, usaha_id: req.user.usaha_id },
    });
    if (!cabang) {
      return res.status(404).json({ message: "Cabang tidak ditemukan" });
    }
    await cabang.destroy();
    res.json({ message: "Cabang berhasil dihapus" });
  } catch (error) {
    // Jika error karena cabang masih punya user/transaksi/pelanggan terkait
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res
        .status(400)
        .json({
          message:
            "Gagal menghapus: Cabang ini masih memiliki data terkait (staff/pelanggan/transaksi).",
        });
    }
    res
      .status(500)
      .json({ message: "Gagal menghapus cabang", error: error.message });
  }
});

module.exports = router;
