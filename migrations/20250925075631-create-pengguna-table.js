"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("pengguna", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nama_lengkap: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: true, unique: true },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: true },
      role: {
        type: Sequelize.ENUM("admin", "kasir", "owner"),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "aktif",
        allowNull: false,
      },
      refresh_token: { type: Sequelize.TEXT, allowNull: true },
      google_id: { type: Sequelize.STRING, allowNull: true, unique: true },
      avatar_url: { type: Sequelize.STRING, allowNull: true },
      id_cabang: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "cabang", key: "id" },
        onDelete: "SET NULL",
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
    await queryInterface.dropTable("pengguna");
  },
};
