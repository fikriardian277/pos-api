const express = require("express");
const { Op } = require("sequelize");
const { Pelanggan, Cabang } = require("../models");
const authenticateToken = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize");

const router = express.Router();

// Rute untuk MENAMBAH pelanggan baru (Create)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      nama,
      nomor_hp,
      alamat,
      status_member,
      id_cabang: id_cabang_from_body,
    } = req.body;
    const { id_cabang: id_cabang_from_token, usaha_id, role } = req.user;

    if (!nama || !nomor_hp) {
      return res
        .status(400)
        .json({ message: "Nama dan Nomor HP wajib diisi." });
    }

    const existingPelanggan = await Pelanggan.findOne({
      where: { nomor_hp, usaha_id },
    });

    if (existingPelanggan) {
      return res
        .status(409)
        .json({ message: "Nomor HP ini sudah terdaftar sebagai pelanggan." });
    }

    let cabangIdUntukPelanggan;
    if (role === "owner") {
      cabangIdUntukPelanggan = id_cabang_from_body;
      if (!cabangIdUntukPelanggan) {
        return res.status(400).json({
          message:
            "Sebagai Owner, Anda harus memilih cabang untuk pelanggan baru.",
        });
      }
    } else {
      cabangIdUntukPelanggan = id_cabang_from_token;
      if (!cabangIdUntukPelanggan) {
        return res.status(403).json({
          message:
            "Akses ditolak. Akun Anda tidak terikat pada cabang manapun.",
        });
      }
    }

    const pelangganBaru = await Pelanggan.create({
      nama,
      nomor_hp,
      alamat,
      status_member: status_member || "Non-Member",
      id_cabang: cabangIdUntukPelanggan,
      usaha_id: usaha_id,
    });

    res.status(201).json(pelangganBaru);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ message: "Nomor HP sudah terdaftar di usaha Anda." });
    }
    res
      .status(500)
      .json({ message: "Gagal menambah pelanggan.", error: error.message });
  }
});

// Rute untuk MELIHAT SEMUA atau MENCARI pelanggan (Read)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    const whereClause = {
      usaha_id: req.user.usaha_id,
    };

    if (req.user.role !== "owner") {
      whereClause.id_cabang = req.user.id_cabang;
    }

    if (search) {
      whereClause[Op.or] = [
        { nama: { [Op.iLike]: `%${search}%` } }, // <-- PERUBAHAN DI SINI
        { nomor_hp: { [Op.like]: `%${search}%` } },
      ];
    }

    const semuaPelanggan = await Pelanggan.findAll({
      where: whereClause,
      include: [
        {
          model: Cabang,
          attributes: ["nama_cabang"],
        },
      ],
      order: [["nama", "ASC"]],
    });

    res.status(200).json(semuaPelanggan);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data pelanggan.",
      error: error.message,
    });
  }
});

// Rute untuk MELIHAT SATU pelanggan berdasarkan ID (Read Single)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const pelanggan = await Pelanggan.findOne({
      where: { id: req.params.id, usaha_id: req.user.usaha_id },
    });

    if (!pelanggan)
      return res.status(404).json({ message: "Pelanggan tidak ditemukan." });

    if (
      req.user.role !== "owner" &&
      pelanggan.id_cabang !== req.user.id_cabang
    ) {
      return res.status(403).json({ message: "Akses ditolak." });
    }

    res.status(200).json(pelanggan);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data pelanggan.",
      error: error.message,
    });
  }
});

// Rute untuk MENGUBAH pelanggan (Update)
router.put(
  "/:id",
  authenticateToken,
  authorize(["owner", "admin", "kasir"]),
  async (req, res) => {
    try {
      const { nama, nomor_hp, alamat } = req.body;
      const { usaha_id, role, id_cabang: user_cabang_id } = req.user;

      const pelanggan = await Pelanggan.findOne({
        where: { id: req.params.id, usaha_id: usaha_id },
      });

      if (!pelanggan) {
        return res.status(404).json({ message: "Pelanggan tidak ditemukan." });
      }

      if (role !== "owner" && pelanggan.id_cabang !== user_cabang_id) {
        return res.status(403).json({ message: "Akses ditolak." });
      }

      if (nomor_hp && nomor_hp !== pelanggan.nomor_hp) {
        const existing = await Pelanggan.findOne({
          where: { nomor_hp, usaha_id },
        });
        if (existing) {
          return res.status(409).json({
            message: "Nomor HP tersebut sudah digunakan oleh pelanggan lain.",
          });
        }
      }

      pelanggan.nama = nama || pelanggan.nama;
      pelanggan.nomor_hp = nomor_hp || pelanggan.nomor_hp;
      pelanggan.alamat = alamat;

      await pelanggan.save();

      res.status(200).json({
        message: "Data pelanggan berhasil diupdate.",
        data: pelanggan,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Gagal mengupdate pelanggan.", error: error.message });
    }
  }
);

// Rute untuk MENGHAPUS pelanggan (Delete)
router.delete(
  "/:id",
  authenticateToken,
  authorize(["owner", "admin"]),
  async (req, res) => {
    try {
      const pelanggan = await Pelanggan.findOne({
        where: { id: req.params.id, usaha_id: req.user.usaha_id },
      });

      if (!pelanggan)
        return res.status(404).json({ message: "Pelanggan tidak ditemukan." });

      if (
        req.user.role === "admin" &&
        pelanggan.id_cabang !== req.user.id_cabang
      ) {
        return res.status(403).json({ message: "Akses ditolak." });
      }

      await pelanggan.destroy();
      res.status(200).json({ message: "Pelanggan berhasil dihapus." });
    } catch (error) {
      if (error.name === "SequelizeForeignKeyConstraintError") {
        return res.status(400).json({
          message:
            "Gagal menghapus: Pelanggan ini masih memiliki riwayat transaksi.",
        });
      }
      res
        .status(500)
        .json({ message: "Gagal menghapus pelanggan.", error: error.message });
    }
  }
);

module.exports = router;
