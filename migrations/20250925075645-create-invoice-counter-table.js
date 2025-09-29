"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("invoice_counter", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nomor_terakhir: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      usaha_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "usaha", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      // Timestamps tidak perlu untuk tabel ini
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("invoice_counter");
  },
};
