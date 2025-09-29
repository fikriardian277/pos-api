"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("pengaturan", "apakah_promo_totebag_aktif", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("pengaturan", "bonus_poin_totebag", {
      type: Sequelize.INTEGER,
      defaultValue: 1,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      "pengaturan",
      "apakah_promo_totebag_aktif"
    );
    await queryInterface.removeColumn("pengaturan", "bonus_poin_totebag");
  },
};
