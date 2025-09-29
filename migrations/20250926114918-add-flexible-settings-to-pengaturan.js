"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("pengaturan", "apakah_sistem_poin_aktif", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });
    await queryInterface.addColumn("pengaturan", "biaya_membership", {
      type: Sequelize.INTEGER,
      defaultValue: 25000,
    });
    await queryInterface.addColumn("pengaturan", "rupiah_per_poin", {
      type: Sequelize.INTEGER,
      defaultValue: 10000,
    });
    await queryInterface.addColumn("pengaturan", "rupiah_per_poin_redeem", {
      type: Sequelize.INTEGER,
      defaultValue: 100,
    });
    await queryInterface.addColumn("pengaturan", "minimal_penukaran_poin", {
      type: Sequelize.INTEGER,
      defaultValue: 10,
    });
    await queryInterface.addColumn("pengaturan", "masa_berlaku_poin_hari", {
      type: Sequelize.INTEGER,
      defaultValue: 90,
    });
    await queryInterface.addColumn("pengaturan", "pajak_persen", {
      type: Sequelize.FLOAT,
      defaultValue: 0,
    });
    await queryInterface.addColumn("pengaturan", "invoice_prefix", {
      type: Sequelize.STRING,
      defaultValue: "INV-",
    });
    await queryInterface.addColumn("pengaturan", "struk_header_text", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "Selamat Datang!",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("pengaturan", "apakah_sistem_poin_aktif");
    await queryInterface.removeColumn("pengaturan", "biaya_membership");
    await queryInterface.removeColumn("pengaturan", "rupiah_per_poin");
    await queryInterface.removeColumn("pengaturan", "rupiah_per_poin_redeem");
    await queryInterface.removeColumn("pengaturan", "minimal_penukaran_poin");
    await queryInterface.removeColumn("pengaturan", "masa_berlaku_poin_hari");
    await queryInterface.removeColumn("pengaturan", "pajak_persen");
    await queryInterface.removeColumn("pengaturan", "invoice_prefix");
    await queryInterface.removeColumn("pengaturan", "struk_header_text");
  },
};
