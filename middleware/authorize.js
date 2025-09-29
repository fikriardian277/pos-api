// middleware/authorize.js

const authorize = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    // Cek apakah role user ada di dalam array role yang diizinkan
    if (allowedRoles.includes(userRole)) {
      next(); // Jika diizinkan, lanjutkan
    } else {
      res
        .status(403)
        .json({
          message: "Akses ditolak. Anda tidak memiliki izin yang cukup.",
        });
    }
  };
};

module.exports = authorize;
