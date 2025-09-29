// models/Cabang.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Cabang = sequelize.define(
  "Cabang",
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
      // <-- Pindahkan ID ke atas agar lebih rapi
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nama_cabang: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    alamat: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nomor_telepon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "cabang",
    freezeTableName: true,
    indexes: [
      // <-- TAMBAHKAN INI
      {
        unique: true,
        fields: ["usaha_id", "nama_cabang"],
      },
    ],
  }
);

module.exports = Cabang;
