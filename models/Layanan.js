// file: models/Layanan.js

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Layanan = sequelize.define(
  "Layanan",
  {
    usaha_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "usaha",
        key: "id",
      },
    },
    nama_layanan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    id_kategori: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "kategori", // Merujuk ke tabel 'kategori'
        key: "id",
      },
    },
    // Kolom ini untuk catatan khusus, misal "hanya dry clean"
    catatan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "layanan",
    indexes: [
      {
        unique: true,
        fields: ["usaha_id", "id_kategori", "nama_layanan"],
      },
    ],
  }
);

module.exports = Layanan;
