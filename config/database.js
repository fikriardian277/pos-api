// file: config/database.js

const { Sequelize } = require("sequelize");
const config = require("./config.json"); // Membaca file config.json kita

// INI BAGIAN KUNCINYA: Cek NODE_ENV, jika tidak ada, pakai 'development'
const env = process.env.NODE_ENV || "development";
const dbConfig = config[env]; // Pilih konfigurasi yang sesuai (development atau production)

let sequelize;

// Jika di Render (ada DATABASE_URL), pakai itu. Jika tidak (di lokal), pakai username/password.
if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );
}

module.exports = sequelize;
