// models/Pengguna.js

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Pengguna = sequelize.define(
  "Pengguna",
  {
    usaha_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "usaha",
        key: "id",
      },
    },
    // Definisikan kolom-kolom tabel di sini
    nama_lengkap: {
      type: DataTypes.STRING,
      allowNull: false, // Wajib diisi
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true, // Boleh null untuk user lama

      validate: {
        isEmail: true, // Validasi sederhana
      },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true, // [UBAH INI] Jadi true karena user Google tidak punya password
    },
    role: {
      type: DataTypes.ENUM("admin", "kasir", "owner"), // <-- Tambahkan 'owner'
      allowNull: false,
    },
    id_cabang: {
      type: DataTypes.INTEGER,
      allowNull: true, // Kita set `true` dulu, nanti dijelaskan kenapa
      references: {
        model: "cabang", // Merujuk ke tabel 'cabang'
        key: "id",
      },
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "aktif", // Nilai default saat user baru dibuat
      allowNull: false,
    },
    refresh_token: {
      type: DataTypes.TEXT, // Pakai TEXT agar muat token yang panjang
      allowNull: true,
    },
    google_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    avatar_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    // Opsi tambahan
    tableName: "pengguna",
    freezeTableName: true,
    indexes: [
      // <-- TAMBAHKAN INI
      {
        unique: true,
        fields: ["usaha_id", "username"],
      },
      {
        unique: true,
        fields: ["usaha_id", "email"],
      },
    ],
  }
);

module.exports = Pengguna;
