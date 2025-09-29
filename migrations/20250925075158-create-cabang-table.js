"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("cabang", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nama_cabang: { type: Sequelize.STRING, allowNull: false, unique: true },
      alamat: { type: Sequelize.TEXT, allowNull: true },
      nomor_telepon: { type: Sequelize.STRING, allowNull: true },
      usaha_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "usaha", key: "id" },
        onDelete: "CASCADE",
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("cabang");
  },
};
