"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("transaksi", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      kode_invoice: { type: Sequelize.STRING, allowNull: false, unique: true },
      grand_total: { type: Sequelize.INTEGER, allowNull: false },
      catatan: { type: Sequelize.TEXT, allowNull: true },
      status_pembayaran: {
        type: Sequelize.ENUM("Lunas", "Belum Lunas"),
        defaultValue: "Belum Lunas",
      },
      metode_pembayaran: { type: Sequelize.STRING, allowNull: true },
      status_proses: {
        type: Sequelize.ENUM(
          "Diterima",
          "Proses Cuci",
          "Siap Diambil",
          "Selesai"
        ),
        defaultValue: "Diterima",
      },
      poin_digunakan: { type: Sequelize.INTEGER, defaultValue: 0 },
      poin_didapat: { type: Sequelize.INTEGER, defaultValue: 0 },
      id_pelanggan: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "pelanggan", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      id_pengguna: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "pengguna", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      id_cabang: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "cabang", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      usaha_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "usaha", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("transaksi");
  },
};
