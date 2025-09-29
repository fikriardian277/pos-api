"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("pengaturan", "tampilkan_logo_di_struk", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });
    await queryInterface.addColumn("pengaturan", "tampilkan_header_di_struk", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("pengaturan", "tampilkan_logo_di_struk");
    await queryInterface.removeColumn(
      "pengaturan",
      "tampilkan_header_di_struk"
    );
  },
};
