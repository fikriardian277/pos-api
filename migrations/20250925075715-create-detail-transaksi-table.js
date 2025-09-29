"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("detail_transaksi", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      jumlah: { type: Sequelize.INTEGER, allowNull: false },
      subtotal: { type: Sequelize.INTEGER, allowNull: false },
      id_transaksi: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "transaksi", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      id_paket: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "paket", key: "id" },
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
    await queryInterface.dropTable("detail_transaksi");
  },
};
