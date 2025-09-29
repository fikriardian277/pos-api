const express = require("express");
const { Op } = require("sequelize");
const { Transaksi, Cabang, sequelize } = require("../models");
const authenticateToken = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize");

const router = express.Router();

// Endpoint untuk ringkasan Admin/Kasir
router.get(
  "/summary",
  authenticateToken,
  authorize(["admin", "kasir"]),
  async (req, res) => {
    try {
      const { id_cabang, usaha_id } = req.user;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // [AMAN] Pastikan usaha_id ada di semua klausa 'where'
      const whereToday = {
        id_cabang,
        usaha_id: usaha_id,
        createdAt: { [Op.between]: [todayStart, todayEnd] },
      };
      const whereActive = { id_cabang, usaha_id: usaha_id };

      const [
        revenueToday,
        ordersToday,
        activeOrders,
        readyToPickup,
        countDiterima,
        countProsesCuci,
      ] = await Promise.all([
        Transaksi.sum("grand_total", {
          where: { ...whereToday, status_pembayaran: "Lunas" },
        }),
        Transaksi.count({ where: whereToday }),
        Transaksi.count({
          where: { ...whereActive, status_proses: { [Op.ne]: "Selesai" } },
        }),
        Transaksi.count({
          where: { ...whereActive, status_proses: "Siap Diambil" },
        }),
        Transaksi.count({
          where: { ...whereActive, status_proses: "Diterima" },
        }),
        Transaksi.count({
          where: { ...whereActive, status_proses: "Proses Cuci" },
        }),
      ]);

      res.json({
        revenue_today: revenueToday || 0,
        orders_today: ordersToday || 0,
        active_orders: activeOrders || 0,
        ready_to_pickup: readyToPickup || 0,
        status_counts: {
          diterima: countDiterima || 0,
          proses_cuci: countProsesCuci || 0,
          siap_diambil: readyToPickup || 0,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Gagal mengambil data summary.",
        error: error.message,
      });
    }
  }
);

// Endpoint khusus untuk ringkasan Owner (seluruh bisnis)
router.get(
  "/owner-summary",
  authenticateToken,
  authorize(["owner"]),
  async (req, res) => {
    console.log("\n--- [PELACAKAN] Memulai /owner-summary ---");
    try {
      const { usaha_id } = req.user;
      console.log("Step 1: Masuk try block, usaha_id =", usaha_id);

      const whereClause = { usaha_id: usaha_id };

      const totalOrders = await Transaksi.count({ where: whereClause });
      console.log("Step 2: Hasil Transaksi.count, totalOrders =", totalOrders);

      let totalRevenue = 0;
      let performanceByCabang = [];

      if (totalOrders > 0) {
        console.log("Step 3: Masuk ke dalam if (totalOrders > 0).");

        console.log(
          "Step 4: Akan menjalankan Promise.all untuk SUM dan findAll."
        );
        const [revenueResult, performanceResult] = await Promise.all([
          Transaksi.sum("grand_total", {
            where: { ...whereClause, status_pembayaran: "Lunas" },
          }),
          Transaksi.findAll({
            attributes: [
              "id_cabang",
              [
                sequelize.fn("SUM", sequelize.col("grand_total")),
                "total_revenue",
              ],
              [
                sequelize.fn("COUNT", sequelize.col("Transaksi.id")),
                "total_orders",
              ],
            ],
            include: [{ model: Cabang, attributes: ["nama_cabang"] }],
            where: whereClause,
            group: ["id_cabang", "Cabang.id", "Cabang.nama_cabang"],
            raw: true,
          }),
        ]);
        console.log("Step 5: Promise.all selesai dieksekusi.");

        totalRevenue = revenueResult;
        performanceByCabang = performanceResult;
      } else {
        console.log(
          "Step 3b: Melewatkan if block karena totalOrders adalah 0."
        );
      }

      console.log("Step 6: Akan mengirimkan respons JSON.");
      res.json({
        total_revenue: totalRevenue || 0,
        total_orders: totalOrders || 0,
        performance_by_cabang: performanceByCabang || [],
      });
      console.log("Step 7: Respons JSON berhasil dikirim.");
    } catch (error) {
      console.error("🔥 Error di /owner-summary:", error);
      res.status(500).json({
        message: "Gagal mengambil data owner summary.",
        error: error.message,
      });
    }
  }
);

module.exports = router;
