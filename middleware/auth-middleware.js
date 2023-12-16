const jwt = require("../utils/jwt-util");

const showAuthenticate = (req, res, next) => {
  if (req.cookies.accessToken) {
    const decoded = jwt.verifyToken(req.cookies.accessToken);
    if (decoded.user_role === "admin") {
      next();
    } else {
      res.status(401).json({ ok: false, message: "관리자로 로그인 해주시기 바랍니다." });
    }
  } else {
    // 인증 실패
    res.status(401).json({ ok: false, message: "관리자로 로그인 해주시기 바랍니다." });
  }
};

module.exports = { showAuthenticate };
