// file: routes/pengaturan.routes.js

const express = require("express");
const multer = require("multer"); // 1. Impor Multer
const path = require("path");
const { Pengaturan } = require("../models");
const authenticateToken = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/"); // Folder penyimpanan
  },
  filename: function (req, file, cb) {
    // Buat nama file unik: usaha_ID-timestamp.extensi
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, `logo-${req.user.usaha_id}-${uniqueSuffix}`);
  },
});
const upload = multer({ storage: storage });

// GET: Mengambil data pengaturan berdasarkan usaha_id dari token
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { usaha_id } = req.user; // Ambil usaha_id dari token

    // [FIX] Cari pengaturan berdasarkan Primary Key, yaitu usaha_id
    let settings = await Pengaturan.findByPk(usaha_id);

    // Jika belum ada, buat pengaturan default untuk usaha ini
    if (!settings) {
      settings = await Pengaturan.create({ usaha_id: usaha_id });
    }

    res.json(settings);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mengambil pengaturan.", error: error.message });
  }
});

// PUT: Memperbarui data pengaturan berdasarkan usaha_id dari token
router.put("/", authenticateToken, authorize(["owner"]), async (req, res) => {
  try {
    const { usaha_id } = req.user; // Ambil usaha_id dari token

    // [FIX] Gunakan findOrCreate dengan where berdasarkan usaha_id
    const [settings, created] = await Pengaturan.findOrCreate({
      where: { usaha_id: usaha_id },
      defaults: { ...req.body, usaha_id: usaha_id }, // Pastikan usaha_id masuk
    });

    if (!created) {
      // Jika sudah ada, update dengan data dari body
      await settings.update(req.body);
    }

    res.json({ message: "Pengaturan berhasil diperbarui.", data: settings });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal memperbarui pengaturan.", error: error.message });
  }
});

router.post(
  "/upload-logo",
  authenticateToken,
  authorize(["owner"]),
  upload.single("logo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "Tidak ada file yang di-upload." });
      }

      const logoUrl = `${req.protocol}://${req.get("host")}/uploads/${
        req.file.filename
      }`;

      // [FIX] Cari berdasarkan usaha_id, bukan PK
      const pengaturan = await Pengaturan.findOne({
        where: { usaha_id: req.user.usaha_id },
      });

      if (!pengaturan) {
        return res
          .status(404)
          .json({ message: "Pengaturan usaha tidak ditemukan." });
      }

      pengaturan.logo_url = logoUrl;
      await pengaturan.save();

      res.json({ message: "Logo berhasil di-upload.", data: pengaturan });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Gagal meng-upload logo.", error: error.message });
    }
  }
);

module.exports = router;
