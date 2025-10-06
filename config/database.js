const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("pos_db", "root", "", {
  host: "localhost",
  dialect: "mysql",
  dialectOptions: {
    charset: "utf8mb4",
    collate: "utf8mb4_general_ci",
  },
});

module.exports = sequelize;
