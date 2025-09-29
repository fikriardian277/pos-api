// file: pos-api/routes/laporan.routes.js

const express = require("express");
const { Op, fn, col, literal, sequelize } = require("sequelize"); // Pastikan sequelize diimpor
const { Transaksi, DetailTransaksi, Paket, Pelanggan } = require("../models");
const authenticateToken = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.get(
  "/penjualan",
  authenticateToken,
  authorize(["owner", "admin"]), // Admin juga bisa akses
  async (req, res) => {
    try {
      // [BARU] Ambil id_cabang dari query
      const { startDate, endDate, id_cabang } = req.query;
      const { role, id_cabang: user_cabang_id, usaha_id } = req.user;

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ message: "Rentang tanggal wajib diisi." });
      }

      // [FIX] Filter dasar yang berlaku untuk semua query
      const whereClause = {
        usaha_id,
        status_pembayaran: "Lunas",
        createdAt: {
          [Op.between]: [
            new Date(startDate),
            new Date(new Date(endDate).setHours(23, 59, 59, 999)),
          ],
        },
      };

      // [BARU] Logika filter cabang
      if (role === "admin") {
        // Jika admin, paksa filter berdasarkan cabang miliknya
        whereClause.id_cabang = user_cabang_id;
      } else if (role === "owner" && id_cabang && id_cabang !== "semua") {
        // Jika owner dan memilih cabang spesifik
        whereClause.id_cabang = id_cabang;
      }

      // [FIX] Ambil semua transaksi yang cocok DULUAN untuk mendapatkan IDs
      const transactions = await Transaksi.findAll({
        where: whereClause,
        attributes: ["id"], // Cukup ambil ID-nya saja
      });

      // Jika tidak ada transaksi sama sekali, kembalikan data kosong
      if (transactions.length === 0) {
        return res.json({
          summary: {
            totalRevenue: 0,
            totalTransactions: 0,
            highestDay: null,
            lowestDay: null,
            topProduk: [],
            topCustomers: [],
            paymentMethods: [],
          },
          dailyData: [],
        });
      }

      // [FIX] Sekarang `transactionIds` sudah terdefinisi dengan benar
      const transactionIds = transactions.map((t) => t.id);

      // 1. Ringkasan Total
      const summary = await Transaksi.findOne({
        attributes: [
          [fn("SUM", col("grand_total")), "totalRevenue"],
          [fn("COUNT", col("id")), "totalTransactions"],
        ],
        where: whereClause,
      });

      const totalRevenue = parseFloat(summary.get("totalRevenue")) || 0;
      const totalTransactions = parseInt(summary.get("totalTransactions")) || 0;

      // 2. Data Harian
      const dailyData = await Transaksi.findAll({
        attributes: [
          [fn("DATE", col("createdAt")), "tanggal"],
          [fn("SUM", col("grand_total")), "pendapatan"],
        ],
        where: whereClause,
        group: [fn("DATE", col("createdAt"))],
        order: [[fn("DATE", col("createdAt")), "ASC"]],
        raw: true,
      });

      const highestDay = dailyData.length
        ? dailyData.reduce((max, d) =>
            parseFloat(d.pendapatan) > parseFloat(max.pendapatan) ? d : max
          )
        : null;
      const lowestDay = dailyData.length
        ? dailyData.reduce((min, d) =>
            parseFloat(d.pendapatan) < parseFloat(min.pendapatan) ? d : min
          )
        : null;

      // 3. Produk terlaris (Top 5)
      const topProduk = await DetailTransaksi.findAll({
        where: { id_transaksi: { [Op.in]: transactionIds } },
        include: [{ model: Paket, attributes: ["nama_paket", "satuan"] }],
        attributes: [
          [col("Paket.nama_paket"), "namaPaket"],
          [fn("SUM", col("jumlah")), "jumlah"],
          [col("Paket.satuan"), "satuan"],
        ],
        group: ["id_paket", "Paket.nama_paket", "Paket.satuan"],
        order: [[fn("SUM", col("jumlah")), "DESC"]],
        limit: 5,
        raw: true,
      });

      // 4. Pelanggan teraktif (Top 5)
      const topCustomers = await Transaksi.findAll({
        attributes: [
          [col("Pelanggan.nama"), "namaPelanggan"],
          [fn("COUNT", col("Transaksi.id")), "jumlahTransaksi"],
        ],
        include: [{ model: Pelanggan, attributes: [] }],
        where: whereClause,
        group: ["id_pelanggan", "Pelanggan.nama"],
        order: [[literal("jumlahTransaksi"), "DESC"]],
        limit: 5,
        raw: true,
      });

      // 5. Metode Pembayaran
      const paymentMethods = await Transaksi.findAll({
        attributes: ["metode_pembayaran", [fn("COUNT", col("id")), "jumlah"]],
        where: whereClause,
        group: ["metode_pembayaran"],
        raw: true,
      });

      res.json({
        summary: {
          totalRevenue,
          totalTransactions,
          highestDay,
          lowestDay,
          topProduk,
          topCustomers,
          paymentMethods,
        },
        dailyData,
      });
    } catch (error) {
      console.error("🔥 Error di /laporan/penjualan:", error);
      res
        .status(500)
        .json({
          message: "Gagal mengambil laporan penjualan.",
          error: error.message,
        });
    }
  }
);

module.exports = router;
