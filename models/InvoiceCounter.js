// models/InvoiceCounter.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const InvoiceCounter = sequelize.define(
  "InvoiceCounter",
  {
    usaha_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "usaha",
        key: "id",
      },
    },
   
    nomor_terakhir: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "invoice_counter",
    timestamps: false, // Tidak perlu created_at/updated_at
  }
);

module.exports = InvoiceCounter;
