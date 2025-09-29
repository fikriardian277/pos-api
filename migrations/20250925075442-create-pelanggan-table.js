"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("pelanggan", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nama: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      nomor_hp: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status_member: {
        type: Sequelize.ENUM("Aktif", "Non-Member"),
        defaultValue: "Non-Member",
      },
      poin: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      poin_update_terakhir: {
        type: Sequelize.DATE,
        allowNull: true,
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
    await queryInterface.dropTable("pelanggan");
  },
};
