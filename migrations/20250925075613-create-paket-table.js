"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("paket", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nama_paket: { type: Sequelize.STRING, allowNull: false },
      harga: { type: Sequelize.INTEGER, allowNull: false },
      estimasi_waktu: { type: Sequelize.STRING, allowNull: false },
      satuan: { type: Sequelize.STRING, allowNull: false },
      id_layanan: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "layanan", key: "id" },
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
    await queryInterface.dropTable("paket");
  },
};
