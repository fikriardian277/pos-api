const express = require("express");
const { Op } = require("sequelize");
const {
  sequelize,
  Transaksi,
  DetailTransaksi,
  Paket,
  Layanan,
  Kategori,
  Pelanggan,
  Pengguna,
  Cabang,
  Usaha,
  InvoiceCounter,
  Pengaturan,
} = require("../models");
const authenticateToken = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize");

const router = express.Router();

// Rute untuk MEMBUAT transaksi baru
router.post("/", authenticateToken, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      id_pelanggan,
      catatan,
      status_pembayaran,
      metode_pembayaran,
      items,
      poin_ditukar,
      tipe_layanan,
      jarak_km,
      bonus_merchandise_dibawa,
      upgrade_member,
    } = req.body;
    const { id: id_pengguna, id_cabang, usaha_id } = req.user;

    const pengaturan = await Pengaturan.findByPk(usaha_id, { transaction: t });
    if (!pengaturan) throw new Error("Pengaturan usaha tidak ditemukan.");

    const pelanggan = await Pelanggan.findOne({
      where: { id: id_pelanggan, usaha_id },
      transaction: t,
    });
    if (!pelanggan) throw new Error("Pelanggan tidak ditemukan.");

    const realItems = items.filter((item) => item.id_paket !== "member-fee");
    if (realItems.length === 0 && !upgrade_member)
      throw new Error("Tidak ada item paket yang dipesan.");

    let subtotal_paket = 0;
    const cartWithDetails = [];
    for (const item of realItems) {
      const paket = await Paket.findOne({
        where: { id: item.id_paket, usaha_id },
        transaction: t,
      });
      if (!paket) throw new Error(`Paket ID ${item.id_paket} tidak valid.`);
      const subtotal = paket.harga * item.jumlah;
      subtotal_paket += subtotal;
      cartWithDetails.push({ ...item, satuan: paket.satuan, subtotal });
    }

    const biayaUpgradeMember = upgrade_member ? pengaturan.biaya_membership : 0;

    let biayaLayananTambahan = 0;
    if (pengaturan.layanan_antar_jemput_aktif && tipe_layanan !== "dine_in") {
      const jarak = parseFloat(jarak_km) || 0;
      let biayaJemput = 0,
        biayaAntar = 0;
      if (tipe_layanan === "jemput" || tipe_layanan === "antar_jemput") {
        if (jarak > pengaturan.batas_jarak_gratis_jemput)
          biayaJemput = pengaturan.biaya_jemput_jarak;
      }
      if (tipe_layanan === "antar" || tipe_layanan === "antar_jemput") {
        if (jarak > pengaturan.batas_jarak_gratis_antar)
          biayaAntar = pengaturan.biaya_antar_jarak;
      }
      biayaLayananTambahan = biayaJemput + biayaAntar;
    }

    let grand_total_awal =
      subtotal_paket + biayaUpgradeMember + biayaLayananTambahan;

    let final_grand_total = grand_total_awal;
    let poinDigunakanFinal = 0;
    let poinDidapatFinal = 0;
    let diskonFinal = 0;

    if (pengaturan.skema_poin_aktif !== "nonaktif") {
      let pelangganBolehDapatPoin = false;
      if (pengaturan.wajib_membership_berbayar) {
        if (pelanggan.status_member === "Aktif" || upgrade_member) {
          pelangganBolehDapatPoin = true;
        }
      } else {
        pelangganBolehDapatPoin = true;
      }

      if (upgrade_member && pelanggan.status_member === "Non-Member") {
        pelanggan.status_member = "Aktif";
      }

      if (pelangganBolehDapatPoin) {
        // --- A. LOGIKA PENUKARAN POIN (UNIVERSAL) ---
        if (poin_ditukar && poin_ditukar > 0) {
          if (pelanggan.poin < poin_ditukar) {
            throw new Error("Poin pelanggan tidak mencukupi.");
          }
          if (poin_ditukar < pengaturan.minimal_penukaran_poin) {
            throw new Error(
              `Penukaran minimal ${pengaturan.minimal_penukaran_poin} poin.`
            );
          }
          const diskon_poin = poin_ditukar * pengaturan.rupiah_per_poin_redeem;
          if (diskon_poin >= final_grand_total) {
            throw new Error(
              "Diskon dari poin tidak boleh melebihi total belanja."
            );
          }
          final_grand_total -= diskon_poin;
          poinDigunakanFinal = poin_ditukar;
        }

        // --- B. LOGIKA MENDAPATKAN POIN (SESUAI SKEMA) ---
        let poinDariSkema = 0;
        switch (pengaturan.skema_poin_aktif) {
          case "nominal":
            if (pengaturan.rupiah_per_poin > 0) {
              poinDariSkema = Math.floor(
                final_grand_total / pengaturan.rupiah_per_poin
              );
            }
            break;
          case "berat":
            // [FIX] Gunakan array 'cartWithDetails' yang sudah punya info 'satuan'
            const totalBerat = cartWithDetails.reduce((sum, item) => {
              return item.satuan?.toLowerCase() === "kg"
                ? sum + parseFloat(item.jumlah)
                : sum;
            }, 0);

            if (pengaturan.berat_per_poin > 0) {
              poinDariSkema =
                Math.floor(totalBerat / pengaturan.berat_per_poin) *
                pengaturan.poin_per_kg;
            }
            break;
          case "kunjungan":
            poinDariSkema = pengaturan.poin_per_kunjungan;
            break;
        }

        let poinBonus = 0;
        if (
          pengaturan.apakah_bonus_merchandise_aktif &&
          bonus_merchandise_dibawa
        ) {
          poinBonus = pengaturan.bonus_poin_merchandise;
        }

        poinDidapatFinal = poinDariSkema + poinBonus;
      }

      pelanggan.poin = pelanggan.poin - poinDigunakanFinal + poinDidapatFinal;
      pelanggan.poin_update_terakhir = new Date();
      await pelanggan.save({ transaction: t });
    }

    let statusAwal = "Diterima";
    if (tipe_layanan === "jemput" || tipe_layanan === "antar_jemput") {
      statusAwal = "Menunggu Penjemputan";
    }

    if (pengaturan.pajak_persen > 0)
      final_grand_total += final_grand_total * (pengaturan.pajak_persen / 100);

    const [counter] = await InvoiceCounter.findOrCreate({
      where: { usaha_id },
      defaults: { nomor_terakhir: 0 },
      transaction: t,
    });
    const nomorBaru = counter.nomor_terakhir + 1;
    await counter.update({ nomor_terakhir: nomorBaru }, { transaction: t });
    const kode_invoice = `${pengaturan.invoice_prefix}${String(
      nomorBaru
    ).padStart(6, "0")}`;

    const transaksiBaru = await Transaksi.create(
      {
        kode_invoice,
        id_pelanggan,
        id_pengguna,
        id_cabang,
        usaha_id,
        subtotal: subtotal_paket,
        diskon: diskonFinal,
        grand_total: Math.round(final_grand_total),
        catatan,
        status_pembayaran,
        metode_pembayaran:
          status_pembayaran === "Lunas" ? metode_pembayaran : null,
        poin_digunakan: poinDigunakanFinal,
        poin_didapat: poinDidapatFinal,
        tipe_layanan: tipe_layanan || "dine_in",
        jarak_km: parseFloat(jarak_km) || 0,
        biaya_layanan: biayaLayananTambahan,
        status_proses: statusAwal,
        upgrade_member: upgrade_member || false,
        biaya_membership_upgrade: biayaUpgradeMember,
      },
      { transaction: t }
    );

    for (const item of cartWithDetails) {
      await DetailTransaksi.create(
        {
          id_transaksi: transaksiBaru.id,
          id_paket: item.id_paket,
          jumlah: item.jumlah,
          subtotal: item.subtotal,
          usaha_id,
        },
        { transaction: t }
      );
    }

    await t.commit();
    const transaksiLengkap = await Transaksi.findOne({
      where: { id: transaksiBaru.id },
      include: [
        {
          model: Pelanggan,
          attributes: ["nama", "nomor_hp", "poin", "status_member"],
        },
        { model: Pengguna, attributes: ["nama_lengkap"] },
        {
          model: Cabang,
          attributes: ["nama_cabang", "alamat_cabang", "nomor_telepon"],
        },
        { model: Usaha, attributes: ["nama_usaha", "struk_footer_text"] },
        {
          model: Paket,
          attributes: ["nama_paket", "harga", "satuan"],
          through: { attributes: ["jumlah", "subtotal"] },
        },
      ],
    });

    // [UBAH RESPON JSON]
    // Kirim data yang sudah lengkap, bukan yang 'polos' lagi
    res
      .status(201)
      .json({ message: "Transaksi berhasil dibuat.", data: transaksiLengkap });
  } catch (error) {
    await t.rollback();
    console.error("TRANSACTION FAILED:", error);
    res
      .status(500)
      .json({ message: "Gagal membuat transaksi.", error: error.message });
  }
});

// Rute GET /aktif
router.get("/aktif", authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    const options = {
      where: {
        status_proses: { [Op.ne]: "Selesai" },
        usaha_id: req.user.usaha_id,
      },
      include: [
        {
          model: Pelanggan,
          attributes: ["nama", "nomor_hp", "poin", "status_member"],
        },
        { model: Pengguna, attributes: ["nama_lengkap"] },
        {
          model: Paket,
          attributes: ["nama_paket", "harga", "satuan"],
          through: { attributes: ["jumlah", "subtotal"] },
          include: [
            {
              model: Layanan,
              attributes: ["nama_layanan"],
              include: [{ model: Kategori, attributes: ["nama_kategori"] }],
            },
          ],
        },
      ],
      order: [["createdAt", "ASC"]],
    };

    if (req.user.role !== "owner") {
      options.where.id_cabang = req.user.id_cabang;
    }

    if (search) {
      options.where[Op.or] = [
        { kode_invoice: { [Op.like]: `%${search}%` } },
        { "$Pelanggan.nama$": { [Op.like]: `%${search}%` } },
        { "$Pelanggan.nomor_hp$": { [Op.like]: `%${search}%` } },
      ];
    }

    const transaksiAktif = await Transaksi.findAll(options);
    res.json(transaksiAktif);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data transaksi aktif.",
      error: error.message,
    });
  }
});

// file: routes/transaksi.routes.js

router.get(
  "/",
  authenticateToken,
  authorize(["owner", "admin", "kasir"]),
  async (req, res) => {
    try {
      const {
        search,
        startDate,
        endDate,
        status_pembayaran,
        status_proses,
        id_cabang_filter,
      } = req.query;

      const whereClause = { usaha_id: req.user.usaha_id };

      // --- Filter berdasarkan Cabang ---
      if (req.user.role !== "owner") {
        whereClause.id_cabang = req.user.id_cabang;
      } else if (id_cabang_filter) {
        whereClause.id_cabang = id_cabang_filter;
      }

      // --- Filter berdasarkan Tanggal ---
      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [
            new Date(startDate),
            new Date(new Date(endDate).setHours(23, 59, 59, 999)),
          ],
        };
      }

      // --- Filter berdasarkan Status ---
      if (status_pembayaran) whereClause.status_pembayaran = status_pembayaran;
      if (status_proses) whereClause.status_proses = status_proses;

      // --- [FIX] Logika Pencarian yang Benar untuk Lintas Tabel ---
      if (search) {
        whereClause[Op.or] = [
          { kode_invoice: { [Op.like]: `%${search}%` } },
          // Gunakan '$' untuk merujuk ke model yang di-include
          { "$Pelanggan.nama$": { [Op.like]: `%${search}%` } },
          { "$Pelanggan.nomor_hp$": { [Op.like]: `%${search}%` } },
        ];
      }

      const transactions = await Transaksi.findAll({
        where: whereClause,
        include: [
          {
            model: Pelanggan,
            attributes: ["nama", "nomor_hp"],
            // 'required: false' penting agar tetap LEFT JOIN
            // sehingga transaksi tanpa pelanggan (jika ada) tidak hilang
            required: false,
          },
          {
            model: Pengguna,
            attributes: ["username"],
          },
          {
            model: Cabang,
            attributes: ["nama_cabang"],
          },
          // Kita tidak perlu include Paket di sini agar query lebih cepat
        ],
        order: [["createdAt", "DESC"]],
        // subQuery: false penting saat menggunakan where pada include dengan limit/offset
        // Dalam kasus ini, ini membantu stabilitas query
        subQuery: false,
      });

      res.json(transactions);
    } catch (error) {
      console.error("ERROR FETCHING TRANSACTIONS:", error);
      res.status(500).json({
        message: "Gagal mengambil riwayat transaksi.",
        error: error.message,
      });
    }
  }
);

// Rute untuk UPDATE STATUS
router.put("/:id/status", authenticateToken, async (req, res) => {
  try {
    // Ambil data baru dari body: status & metode pembayaran
    const { status, metode_pembayaran } = req.body;
    const transaksi = await Transaksi.findOne({
      where: {
        id: req.params.id,
        usaha_id: req.user.usaha_id, // <-- Filter wajib
      },
    });
    if (!transaksi)
      return res
        .status(404)
        .json({ message: "Transaksi tidak ditemukan di usaha Anda." });

    if (
      req.user.role !== "owner" &&
      transaksi.id_cabang !== req.user.id_cabang
    ) {
      return res.status(403).json({ message: "Akses ditolak." });
    }

    const validStatuses = [
      "Menunggu Penjemputan", // <-- BARU
      "Diterima",
      "Proses Cuci",
      "Siap Diambil",
      "Proses Pengantaran", // <-- BARU
      "Selesai",
    ];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: "Status tidak valid." });

    transaksi.status_proses = status;

    // --- LOGIKA BARU: Jika order diselesaikan, otomatis lunasi ---
    if (status === "Selesai") {
      if (transaksi.status_pembayaran === "Belum Lunas") {
        if (!metode_pembayaran) {
          return res
            .status(400)
            .json({ message: "Metode pembayaran wajib diisi untuk melunasi." });
        }
        transaksi.status_pembayaran = "Lunas";
        transaksi.metode_pembayaran = metode_pembayaran;
      }
    }
    // -----------------------------------------------------------

    await transaksi.save();
    res.status(200).json({
      message: `Status transaksi berhasil diubah menjadi ${status}`,
      data: transaksi,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengubah status transaksi.",
      error: error.message,
    });
  }
});

// Rute untuk GET DETAIL TRANSAKSI
router.get("/:kode_invoice", authenticateToken, async (req, res) => {
  try {
    const transaksi = await Transaksi.findOne({
      where: {
        kode_invoice: req.params.kode_invoice,
        usaha_id: req.user.usaha_id, // <-- Filter wajib
      },
      include: [
        {
          model: Pelanggan,
          attributes: ["nama", "nomor_hp", "poin", "status_member"],
        },

        { model: Pengguna, attributes: ["nama_lengkap"] },
        {
          model: Cabang,
          attributes: ["nama_cabang"],
        },
        {
          model: Paket,
          attributes: ["nama_paket", "harga", "satuan"],
          through: { attributes: ["jumlah", "subtotal"] },
          include: [
            {
              model: Layanan,
              attributes: ["nama_layanan"],
              include: [{ model: Kategori, attributes: ["nama_kategori"] }],
            },
          ],
        },
      ],
    });

    if (!transaksi)
      return res.status(404).json({ message: "Transaksi tidak ditemukan." });

    if (
      req.user.role !== "owner" &&
      transaksi.id_cabang !== req.user.id_cabang
    ) {
      return res.status(403).json({ message: "Akses ditolak." });
    }

    res.status(200).json(transaksi);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil detail transaksi.",
      error: error.message,
    });
  }
});

router.post("/generate-wa-message", authenticateToken, async (req, res) => {
  try {
    const { kode_invoice, tipe_pesan } = req.body; // tipe_pesan: 'struk' atau 'siap_diambil'
    const { usaha_id } = req.user;

    // 1. Ambil data lengkap transaksi, termasuk detail item
    const transaksi = await Transaksi.findOne({
      where: { kode_invoice, usaha_id },
      include: [
        {
          model: Pelanggan,
          attributes: ["nama", "nomor_hp", "poin", "status_member"],
        },
        {
          model: Paket,
          include: [{ model: Layanan, include: [{ model: Kategori }] }],
        },
      ],
    });
    if (!transaksi)
      return res.status(404).json({ message: "Transaksi tidak ditemukan." });

    // 2. Ambil data pengaturan
    const pengaturan = await Pengaturan.findByPk(usaha_id);
    if (!pengaturan)
      return res
        .status(404)
        .json({ message: "Pengaturan usaha tidak ditemukan." });

    // 3. Ambil bagian-bagian template dari pengaturan
    const header = pengaturan.wa_header || "";
    let pesanPembuka = "";
    let pesanPenutup = "";

    if (tipe_pesan === "struk") {
      pesanPembuka = pengaturan.wa_struk_pembuka || "";
      pesanPenutup = pengaturan.wa_struk_penutup || "";
    } else if (tipe_pesan === "siap_diambil") {
      pesanPembuka = pengaturan.wa_siap_diambil_pembuka || "";
      pesanPenutup = pengaturan.wa_siap_diambil_penutup || "";
    }

    // 4. Ganti variabel di bagian yang bisa diedit
    const totalBelanjaFormatted = transaksi.grand_total.toLocaleString("id-ID");
    pesanPembuka = pesanPembuka
      .replace(/{nama_pelanggan}/g, transaksi.Pelanggan.nama)
      .replace(/{kode_invoice}/g, transaksi.kode_invoice);

    pesanPenutup = pesanPenutup
      .replace(/{nama_pelanggan}/g, transaksi.Pelanggan.nama)
      .replace(/{kode_invoice}/g, transaksi.kode_invoice)
      .replace(/{total_belanja}/g, totalBelanjaFormatted);

    // 5. Buat "Bagian Paten" yang tidak bisa diedit
    let bagianPaten = "";
    if (tipe_pesan === "struk") {
      const subtotal = transaksi.Pakets.reduce(
        (sum, p) => sum + p.DetailTransaksi.subtotal,
        0
      );

      let detailItems = "";
      transaksi.Pakets.forEach((p) => {
        detailItems += `${p.Layanan.nama_layanan} - ${p.nama_paket}\n`;
        detailItems += `${p.DetailTransaksi.jumlah} ${
          p.satuan
        } x Rp ${p.harga.toLocaleString(
          "id-ID"
        )} = *Rp ${p.DetailTransaksi.subtotal.toLocaleString("id-ID")}*\n\n`;
      });

      bagianPaten = `
Invoice: *${transaksi.kode_invoice}*
Pelanggan: ${transaksi.Pelanggan.nama}
Tanggal: ${new Date(transaksi.createdAt).toLocaleString("id-ID")}
`;

      // [BARU] Tambahkan info layanan jika bukan dine-in
      if (transaksi.tipe_layanan !== "dine_in") {
        const tipeLayananText = {
          jemput: "Jemput Saja",
          antar: "Antar Saja",
          antar_jemput: "Jemput & Antar",
        };
        bagianPaten += `Layanan: ${tipeLayananText[transaksi.tipe_layanan]}\n`;
        if (transaksi.jarak_km > 0) {
          bagianPaten += `Jarak: ${transaksi.jarak_km} km\n`;
        }
      }

      bagianPaten += `-----------------------
${detailItems}
-----------------------
Subtotal Item: Rp ${subtotal.toLocaleString("id-ID")}
`;

      // [BARU] Tambahkan info biaya layanan jika ada
      if (transaksi.biaya_layanan > 0) {
        bagianPaten += `Biaya Layanan: Rp ${transaksi.biaya_layanan.toLocaleString(
          "id-ID"
        )}\n`;
      }

      bagianPaten += `*GRAND TOTAL: Rp ${totalBelanjaFormatted}*
Status: *${transaksi.status_pembayaran}*`;
      const isPoinSystemActive = pengaturan.skema_poin_aktif !== "nonaktif";
      if (isPoinSystemActive && transaksi.Pelanggan.status_member === "Aktif") {
        bagianPaten += `

-- Info Poin --
Poin Ditukar: -${transaksi.poin_digunakan}
Poin Didapat: +${transaksi.poin_didapat}
Poin Sekarang: *${transaksi.Pelanggan.poin}*`;
      }
    }

    // 6. Jahit semua bagian menjadi satu pesan utuh
    let pesanFinal = "";
    if (tipe_pesan === "struk" && header) {
      pesanFinal += `${header}\n-----------------------\n`;
    }
    if (pesanPembuka) {
      pesanFinal += `${pesanPembuka}\n\n`;
    }
    if (bagianPaten) {
      pesanFinal += `${bagianPaten.trim()}\n\n`;
    }
    if (pesanPenutup) {
      pesanFinal += `${pesanPenutup}`;
    }

    // 7. Kirim kembali pesan yang sudah jadi
    res.json({
      pesan: pesanFinal.trim(),
      nomor_hp: transaksi.Pelanggan.nomor_hp,
    });
  } catch (error) {
    console.error("Gagal generate pesan WA:", error);
    res.status(500).json({ message: "Terjadi kesalahan internal." });
  }
});

module.exports = router;
