// models/Pelanggan.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Pelanggan = sequelize.define(
  "Pelanggan",
  {
    usaha_id: {
      type: DataTypes.INTEGER,
      allowNull: false, //
      references: {
        model: "usaha",
        key: "id",
      },
    },
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nama: { type: DataTypes.STRING, allowNull: false },

    nomor_hp: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    status_member: {
      type: DataTypes.ENUM("Aktif", "Non-Member"),
      defaultValue: "Aktif",
    },
    poin: { type: DataTypes.INTEGER, defaultValue: 0 },
    poin_update_terakhir: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    id_cabang: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "cabang", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "pelanggan",
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ["usaha_id", "nomor_hp"],
      },
    ],
  }
);

module.exports = Pelanggan;
