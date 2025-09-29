// file: models/Paket.js

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Paket = sequelize.define(
  "Paket",
  {
    usaha_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "usaha",
        key: "id",
      },
    },
    nama_paket: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    harga: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    estimasi_waktu: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    satuan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    minimal_order: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    id_layanan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "layanan",
        key: "id",
      },
    },
  },
  {
    tableName: "paket",
    indexes: [
      {
        unique: true,
        fields: ["usaha_id", "id_layanan", "nama_paket"],
      },
    ],
  }
);

// ==========================================================
//           TAMBAHKAN BLOK ASOSIASI INI
// ==========================================================
Paket.associate = function (models) {
  // Paket dimiliki oleh (belongsTo)...
  Paket.belongsTo(models.Usaha, { foreignKey: "usaha_id" });
  Paket.belongsTo(models.Layanan, { foreignKey: "id_layanan" });

  // Paket bisa ada di banyak Transaksi (melalui DetailTransaksi)
  Paket.belongsToMany(models.Transaksi, {
    through: "DetailTransaksi", // Nama tabel perantara
    foreignKey: "id_paket",
    otherKey: "id_transaksi",
  });
};
// ==========================================================

module.exports = Paket;
