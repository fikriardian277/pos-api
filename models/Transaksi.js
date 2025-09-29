// models/Transaksi.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Transaksi = sequelize.define(
  "Transaksi",
  {
    // Kolom yang sudah ada
    usaha_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "usaha", key: "id" },
    },
    kode_invoice: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    grand_total: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status_pembayaran: {
      type: DataTypes.ENUM("Belum Lunas", "Lunas"),
      defaultValue: "Belum Lunas",
    },
    metode_pembayaran: {
      type: DataTypes.ENUM("Cash", "QRIS"),
      allowNull: true,
    },
    status_proses: {
      type: DataTypes.ENUM(
        "Diterima",
        "Proses Cuci",
        "Siap Diambil",
        "Selesai"
      ),
      defaultValue: "Diterima",
    },
    catatan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    poin_digunakan: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    poin_didapat: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    id_cabang: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "cabang", key: "id" },
    },

    // [TAMBAHKAN KOLOM KUNCI YANG HILANG INI]
    id_pelanggan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "pelanggan", key: "id" },
    },
    id_pengguna: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "pengguna", key: "id" },
    },
  },
  {
    tableName: "transaksi",
    indexes: [
      {
        unique: true,
        fields: ["usaha_id", "kode_invoice"],
      },
    ],
  }
);

// ==========================================================
//           TAMBAHKAN BLOK ASOSIASI INI
// ==========================================================
Transaksi.associate = function (models) {
  // Transaksi dimiliki oleh (belongsTo)...
  Transaksi.belongsTo(models.Usaha, { foreignKey: "usaha_id" });
  Transaksi.belongsTo(models.Cabang, { foreignKey: "id_cabang" });
  Transaksi.belongsTo(models.Pengguna, { foreignKey: "id_pengguna" });
  Transaksi.belongsTo(models.Pelanggan, { foreignKey: "id_pelanggan" });

  // Transaksi memiliki banyak Paket (melalui DetailTransaksi)
  Transaksi.belongsToMany(models.Paket, {
    through: "DetailTransaksi", // Nama tabel perantara
    foreignKey: "id_transaksi",
    otherKey: "id_paket",
  });
};
// ==========================================================

module.exports = Transaksi;
