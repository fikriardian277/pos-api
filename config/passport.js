// file: config/passport.js

const GoogleStrategy = require("passport-google-oauth20").Strategy;
// [FIX 1] Impor model Usaha dan instance sequelize
const { Pengguna, Usaha, sequelize } = require("../models");

module.exports = (passport) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/pengguna/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // 1. Cek apakah user sudah ada di database kita berdasarkan Google ID
          let user = await Pengguna.findOne({
            where: { google_id: profile.id },
          });

          if (user) {
            // Jika sudah ada, langsung loginkan
            return done(null, user);
          }

          // 2. Jika tidak ada, cek berdasarkan email
          // Ini untuk menghubungkan akun jika mereka pernah daftar manual
          user = await Pengguna.findOne({
            where: { email: profile.emails[0].value },
          });

          if (user) {
            // Jika ada user dengan email yang sama, update datanya dengan Google ID
            user.google_id = profile.id;
            user.avatar_url = profile.photos[0].value;
            await user.save();
            return done(null, user);
          }

          // 3. Jika benar-benar user baru, buat Usaha DAN Pengguna baru
          const t = await sequelize.transaction(); // Mulai transaksi

          try {
            // Buat Usaha baru terlebih dahulu
            const usahaBaru = await Usaha.create(
              {
                nama_usaha: `${profile.displayName}'s Laundry`, // Nama usaha default
              },
              { transaction: t }
            );

            // Kemudian buat Pengguna baru, hubungkan dengan usaha_id
            const newUser = await Pengguna.create(
              {
                google_id: profile.id,
                nama_lengkap: profile.displayName,
                email: profile.emails[0].value,
                username:
                  profile.emails[0].value.split("@")[0] +
                  `_${profile.id.slice(0, 5)}`,
                avatar_url: profile.photos[0].value,
                role: "owner",
                status: "aktif",
                usaha_id: usahaBaru.id, // <-- HUBUNGKAN DENGAN USAHA BARU
              },
              { transaction: t }
            );

            // Jika semua berhasil, commit transaksi
            await t.commit();

            return done(null, newUser);
          } catch (transactionError) {
            // Jika ada error di tengah jalan, batalkan semua (rollback)
            await t.rollback();
            throw transactionError; // Lemparkan error agar ditangkap oleh catch utama
          }
        } catch (error) {
          console.error("Error di strategi Passport:", error);
          return done(error, null);
        }
      }
    )
  );
};
