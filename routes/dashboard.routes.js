// file: pos-api/routes/dashboard.routes.js

const express = require("express");
const { Op, fn, col, literal, sequelize } = require("sequelize");
const {
  Transaksi,
  Pelanggan,
  Cabang,
  DetailTransaksi,
  Paket,
} = require("../models");
const authenticateToken = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize");

const router = express.Router();

// [DI-UPGRADE] Endpoint tunggal untuk semua data dashboard
router.get(
  "/",
  authenticateToken,
  authorize(["owner", "admin", "kasir"]),
  async (req, res) => {
    try {
      const { role, id_cabang, usaha_id } = req.user;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      let responseData = {};

      // ===============================================
      // LOGIKA UNTUK OWNER
      // ===============================================
      if (role === "owner") {
        const whereClause = { usaha_id };
        const whereToday = {
          ...whereClause,
          createdAt: { [Op.between]: [todayStart, todayEnd] },
        };
        const whereLast7Days = {
          ...whereClause,
          createdAt: { [Op.gte]: sevenDaysAgo },
        };

        const [
          revenueToday,
          transactionsToday,
          activeOrders,
          newCustomersThisMonth,
          dailyRevenue7Days,
          recentTransactions,
        ] = await Promise.all([
          Transaksi.sum("grand_total", {
            where: { ...whereToday, status_pembayaran: "Lunas" },
          }),
          Transaksi.count({ where: whereToday }),
          Transaksi.count({
            where: { ...whereClause, status_proses: { [Op.ne]: "Selesai" } },
          }),
          Pelanggan.count({
            where: {
              ...whereClause,
              createdAt: { [Op.gte]: new Date(new Date().setDate(1)) },
            },
          }),
          Transaksi.findAll({
            attributes: [
              [fn("DATE", col("createdAt")), "tanggal"],
              [fn("SUM", col("grand_total")), "pendapatan"],
            ],
            where: whereLast7Days,
            group: [fn("DATE", col("createdAt"))],
            order: [[fn("DATE", col("createdAt")), "ASC"]],
            raw: true,
          }),
          Transaksi.findAll({
            where: whereClause,
            limit: 5,
            order: [["createdAt", "DESC"]],
            include: [Pelanggan, Cabang],
          }),
        ]);

        responseData = {
          role: "owner",
          stats: {
            revenueToday: revenueToday || 0,
            transactionsToday: transactionsToday || 0,
            activeOrders: activeOrders || 0,
            newCustomersThisMonth: newCustomersThisMonth || 0,
          },
          dailyRevenue7Days,
          recentTransactions,
        };

        // ===============================================
        // LOGIKA UNTUK ADMIN / KASIR
        // ===============================================
      } else {
        const whereClause = { usaha_id, id_cabang };
        const whereToday = {
          ...whereClause,
          createdAt: { [Op.between]: [todayStart, todayEnd] },
        };

        const [
          revenueToday,
          transactionsToday,
          activeOrders,
          recentTransactions,
        ] = await Promise.all([
          Transaksi.sum("grand_total", {
            where: { ...whereToday, status_pembayaran: "Lunas" },
          }),
          Transaksi.count({ where: whereToday }),
          Transaksi.count({
            where: { ...whereClause, status_proses: { [Op.ne]: "Selesai" } },
          }),
          Transaksi.findAll({
            where: whereClause,
            limit: 5,
            order: [["createdAt", "DESC"]],
            include: [Pelanggan],
          }),
        ]);

        responseData = {
          role: role,
          stats: {
            revenueToday: revenueToday || 0,
            transactionsToday: transactionsToday || 0,
            activeOrders: activeOrders || 0,
          },
          recentTransactions,
        };
      }

      res.json(responseData);
    } catch (error) {
      console.error("🔥 Error di /api/dashboard:", error);
      res
        .status(500)
        .json({
          message: "Gagal mengambil data dashboard.",
          error: error.message,
        });
    }
  }
);

module.exports = router;
