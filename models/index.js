// file: models/index.js

const sequelize = require("../config/database");

// Impor semua model
const Usaha = require("./Usaha");
const Cabang = require("./Cabang");
const Pengguna = require("./Pengguna");
const Pelanggan = require("./Pelanggan");
const Kategori = require("./Kategori");
const Layanan = require("./Layanan");
const Paket = require("./Paket");
const Transaksi = require("./Transaksi");
const DetailTransaksi = require("./DetailTransaksi");
const InvoiceCounter = require("./InvoiceCounter");
const Pengaturan = require("./Pengaturan");

Usaha.hasMany(Pengguna, { foreignKey: "usaha_id" });
Usaha.hasMany(Cabang, { foreignKey: "usaha_id" });
Usaha.hasMany(Pelanggan, { foreignKey: "usaha_id" });
Usaha.hasMany(Kategori, { foreignKey: "usaha_id" });
Usaha.hasMany(Layanan, { foreignKey: "usaha_id" });
Usaha.hasMany(Paket, { foreignKey: "usaha_id" });
Usaha.hasMany(Transaksi, { foreignKey: "usaha_id" });
Usaha.hasMany(DetailTransaksi, { foreignKey: "usaha_id" });
Usaha.hasMany(InvoiceCounter, { foreignKey: "usaha_id" });

// Setiap data milik satu Usaha
Pengguna.belongsTo(Usaha, { foreignKey: "usaha_id" });
Cabang.belongsTo(Usaha, { foreignKey: "usaha_id" });
Pelanggan.belongsTo(Usaha, { foreignKey: "usaha_id" });
Kategori.belongsTo(Usaha, { foreignKey: "usaha_id" });
Layanan.belongsTo(Usaha, { foreignKey: "usaha_id" });
Paket.belongsTo(Usaha, { foreignKey: "usaha_id" });
Transaksi.belongsTo(Usaha, { foreignKey: "usaha_id" });
DetailTransaksi.belongsTo(Usaha, { foreignKey: "usaha_id" });
InvoiceCounter.belongsTo(Usaha, { foreignKey: "usaha_id" });

// Definisikan semua hubungan antar tabel

// Hubungan Struktur Layanan Baru
Kategori.hasMany(Layanan, {
  as: "layanans",
  foreignKey: "id_kategori",
  onDelete: "CASCADE",
});
Layanan.belongsTo(Kategori, { foreignKey: "id_kategori" });

Layanan.hasMany(Paket, {
  as: "pakets",
  foreignKey: "id_layanan",
  onDelete: "CASCADE",
});
Paket.belongsTo(Layanan, { foreignKey: "id_layanan" });

// Hubungan Cabang
Cabang.hasMany(Pengguna, { foreignKey: "id_cabang" });
Pengguna.belongsTo(Cabang, { foreignKey: "id_cabang" });

Cabang.hasMany(Pelanggan, { foreignKey: "id_cabang" });
Pelanggan.belongsTo(Cabang, { foreignKey: "id_cabang" });

Cabang.hasMany(Transaksi, { foreignKey: "id_cabang" });
Transaksi.belongsTo(Cabang, { foreignKey: "id_cabang" });

// Hubungan Transaksi
Pengguna.hasMany(Transaksi, {
  foreignKey: "id_pengguna",
  onDelete: "SET NULL",
});
Transaksi.belongsTo(Pengguna, { foreignKey: "id_pengguna" });

Pelanggan.hasMany(Transaksi, {
  foreignKey: "id_pelanggan",
  onDelete: "SET NULL",
});
Transaksi.belongsTo(Pelanggan, { foreignKey: "id_pelanggan" });

// Hubungan Many-to-Many Transaksi <-> Paket (BUKAN LAGI LAYANAN)
Transaksi.belongsToMany(Paket, {
  through: DetailTransaksi,
  foreignKey: "id_transaksi",
  otherKey: "id_paket",
});
Paket.belongsToMany(Transaksi, {
  through: DetailTransaksi,
  foreignKey: "id_paket",
  otherKey: "id_transaksi",
});

// Relasi DetailTransaksi ke Paket & Transaksi
DetailTransaksi.belongsTo(Paket, { foreignKey: "id_paket" });
DetailTransaksi.belongsTo(Transaksi, { foreignKey: "id_transaksi" });

Paket.hasMany(DetailTransaksi, { foreignKey: "id_paket" });
Transaksi.hasMany(DetailTransaksi, { foreignKey: "id_transaksi" });

// Fungsi untuk sinkronisasi database
const initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Koneksi database berhasil.");

    // TAMBAHKAN BARIS INI
    await sequelize.sync({ alter: true });
    console.log("Semua model berhasil disinkronkan.");
  } catch (error) {
    // Perbarui pesan error agar lebih jelas
    console.error("Gagal terhubung atau sinkronisasi database:", error);
    throw error;
  }
};

module.exports = {
  sequelize,
  initDB,
  Usaha,
  Cabang,
  Pengguna,
  Pelanggan,
  Kategori,
  Layanan,
  Paket,
  Transaksi,
  DetailTransaksi,
  InvoiceCounter,
  Pengaturan,
};
