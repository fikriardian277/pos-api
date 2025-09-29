"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("pengaturan", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nama_usaha: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "Nama Laundry Anda",
      },
      logo_url: { type: Sequelize.STRING, allowNull: true },
      alamat_usaha: { type: Sequelize.TEXT, allowNull: true },
      telepon_usaha: { type: Sequelize.STRING, allowNull: true },
      struk_footer_text: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: "Terima kasih!",
      },
      usaha_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "usaha", key: "id" },
        onDelete: "CASCADE",
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("pengaturan");
  },
};
