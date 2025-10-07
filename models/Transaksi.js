// file: models/Transaksi.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Transaksi = sequelize.define(
  "Transaksi",
  {
    // [FIX] Tambahkan ID sebagai Primary Key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
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
      type: DataTypes.STRING, // Ganti ENUM jadi STRING agar lebih fleksibel
      defaultValue: "Belum Lunas",
    },
    metode_pembayaran: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // [FIX] Hapus defaultValue agar logika di API yang jadi penentu utama
    status_proses: {
      type: DataTypes.STRING,
    },
    upgrade_member: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    biaya_membership_upgrade: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    tipe_layanan: {
      type: DataTypes.STRING,
      defaultValue: "dine_in",
    },
    jarak_km: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    biaya_layanan: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
    timestamps: true, // Biasanya tabel transaksi punya timestamps (createdAt, updatedAt)
    indexes: [
      {
        unique: true,
        fields: ["usaha_id", "kode_invoice"],
      },
    ],
    hooks: {
      beforeCreate: (transaksi, options) => {
        console.log("===================================");
        console.log("CCTV MODEL: Data final sebelum INSERT ke DB:");
        console.log(transaksi.dataValues);
        console.log("===================================");
      },
    },
  }
);

Transaksi.associate = function (models) {
  // Transaksi dimiliki oleh (belongsTo)...
  Transaksi.belongsTo(models.Usaha, { foreignKey: "usaha_id" });
  Transaksi.belongsTo(models.Cabang, { foreignKey: "id_cabang" });
  Transaksi.belongsTo(models.Pengguna, { foreignKey: "id_pengguna" });
  Transaksi.belongsTo(models.Pelanggan, { foreignKey: "id_pelanggan" });

  // Transaksi memiliki banyak Paket (melalui DetailTransaksi)
  Transaksi.belongsToMany(models.Paket, {
    through: models.DetailTransaksi, // Gunakan referensi model langsung
    foreignKey: "id_transaksi",
    otherKey: "id_paket",
  });
};

module.exports = Transaksi;
