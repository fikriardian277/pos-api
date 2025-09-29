"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Usaha = sequelize.define(
  "Usaha",
  {
    nama_usaha: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status_langganan: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "free", // 'free', 'basic', 'pro'
    },
    // Kita bisa tambahkan kolom lain nanti, seperti tanggal_berakhir
  },
  {
    tableName: "usaha",
    freezeTableName: true,
  }
);

module.exports = Usaha;
