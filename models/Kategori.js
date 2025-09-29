// file: models/Kategori.js

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Kategori = sequelize.define(
  "Kategori",
  {
    nama_kategori: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    usaha_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "usaha",
        key: "id",
      },
    },
  },
  {
    tableName: "kategori",
    timestamps: false,
    indexes: [
      // <-- TAMBAHKAN
      {
        unique: true,
        fields: ["usaha_id", "nama_kategori"],
      },
    ],
  }
);

module.exports = Kategori;
