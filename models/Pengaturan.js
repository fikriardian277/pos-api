// file: pos-api/models/pengaturan.js
"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Pengaturan = sequelize.define(
  "Pengaturan",
  {
    usaha_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: "usaha", key: "id" },
    },
    // 1. Identitas & Branding
    nama_usaha: {
      type: DataTypes.STRING,
      defaultValue: "Nama Laundry Anda",
    },
    logo_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    alamat_usaha: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    telepon_usaha: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // 2. Skema Poin Utama
    apakah_sistem_poin_aktif: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    wajib_membership_berbayar: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // [BARU] Kolom untuk menyimpan skema mana yang aktif
    skema_poin_aktif: {
      type: DataTypes.STRING, // Akan berisi 'nominal', 'berat', atau 'kunjungan'
      defaultValue: "nominal",
    },
    biaya_membership: {
      type: DataTypes.INTEGER,
      defaultValue: 25000,
    },
    // Pengaturan Skema Nominal
    rupiah_per_poin: {
      type: DataTypes.INTEGER,
      defaultValue: 10000,
    },
    rupiah_per_poin_redeem: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
    },
    minimal_penukaran_poin: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    masa_berlaku_poin_hari: {
      type: DataTypes.INTEGER,
      defaultValue: 90,
    },
    // [BARU] Pengaturan Skema Berat
    berat_per_poin: {
      type: DataTypes.FLOAT,
      defaultValue: 1, // e.g., setiap 1 kg...
    },
    poin_per_kg: {
      type: DataTypes.INTEGER,
      defaultValue: 1, // ...dapat 1 poin
    },
    // [BARU] Pengaturan Skema Kunjungan
    poin_per_kunjungan: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },

    layanan_antar_jemput_aktif: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    batas_jarak_gratis_jemput: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    biaya_jemput_jarak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    batas_jarak_gratis_antar: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    biaya_antar_jarak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    // [BARU] Skema Bonus Merchandise (pengganti totebag)
    apakah_bonus_merchandise_aktif: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    nama_merchandise: {
      type: DataTypes.STRING,
      defaultValue: "Totebag",
    },
    bonus_poin_merchandise: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    // 3. Aturan Operasional
    pajak_persen: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    invoice_prefix: {
      type: DataTypes.STRING,
      defaultValue: "INV-",
    },
    // 4. Kustomisasi Nota
    struk_footer_text: {
      type: DataTypes.TEXT,
      defaultValue: "Terima kasih telah menggunakan jasa kami!",
    },
    tampilkan_logo_di_struk: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    tampilkan_header_di_struk: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    wa_header: {
      type: DataTypes.STRING,
      defaultValue: "*Struk Digital*",
    },
    wa_struk_pembuka: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    wa_struk_penutup: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    wa_siap_diambil_pembuka: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    wa_siap_diambil_penutup: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "pengaturan",
    timestamps: false,
  }
);

module.exports = Pengaturan;
