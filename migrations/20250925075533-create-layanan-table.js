"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("layanan", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nama_layanan: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      catatan: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      id_kategori: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "kategori", // Terhubung ke tabel 'kategori'
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      usaha_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "usaha",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("layanan");
  },
};
