// file: middleware/auth.middleware.js

const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  // --- CCTV START ---
  console.log(
    "\n--- [CCTV di Backend] Middleware authenticateToken Dijalankan ---"
  );
  console.log("Metode Request:", req.method, " | URL:", req.originalUrl);

  const authHeader = req.headers["authorization"];
  console.log("Header Authorization yang diterima:", authHeader);

  const token = authHeader && authHeader.split(" ")[1];
  console.log("Token yang diekstrak:", token);

  // Ini pengecekan paling penting!
  console.log(
    "JWT_SECRET yang digunakan untuk verifikasi:",
    process.env.JWT_SECRET
  );
  // --- CCTV END ---

  if (token == null) {
    console.log("Keputusan: Gagal, tidak ada token. Mengirim status 401.");
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // --- CCTV ERROR ---
      console.error("Kesalahan Verifikasi JWT:", err.message);
      console.log("Keputusan: Gagal, token tidak valid. Mengirim status 403.");
      // --- CCTV END ---
      return res.sendStatus(403);
    }

    // --- CCTV SUKSES ---
    console.log("Verifikasi JWT Berhasil. Payload User:", user);
    console.log("Keputusan: Sukses. Melanjutkan ke proses selanjutnya.");
    // --- CCTV END ---
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
