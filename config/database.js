const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("pos_db", "root", "", {
  host: "localhost",
  dialect: "mysql",
});

module.exports = sequelize;
