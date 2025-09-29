// file: models/DetailTransaksi.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DetailTransaksi = sequelize.define(
  "DetailTransaksi",
  {
    usaha_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "usaha",
        key: "id",
      },
    },
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    id_paket: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "paket",
        key: "id",
      },
    },
    jumlah: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_transaksi: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "transaksi",
        key: "id",
      },
    },
  },
  {
    tableName: "detail_transaksi",
  }
);

// ==========================================================
//           TAMBAHKAN BLOK ASOSIASI INI
// ==========================================================
DetailTransaksi.associate = function (models) {
  DetailTransaksi.belongsTo(models.Usaha, { foreignKey: "usaha_id" });
  DetailTransaksi.belongsTo(models.Transaksi, { foreignKey: "id_transaksi" });
  DetailTransaksi.belongsTo(models.Paket, { foreignKey: "id_paket" });
};
// ==========================================================

module.exports = DetailTransaksi;
