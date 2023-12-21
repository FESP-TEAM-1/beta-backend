const jwt = require("../utils/jwt-util");

const adminAuthenticate = (req, res, next) => {
  if (req.cookies.accessToken) {
    const decoded = jwt.verifyToken(req.cookies.accessToken);
    if (decoded.user_role === "admin") {
      req.login_id = decoded.login_id;
      req.user_role = decoded.user_role;
      next();
    } else {
      res.status(401).json({ ok: false, message: "관리자로 로그인 해주시기 바랍니다." });
    }
  } else {
    // 인증 실패
    res.status(401).json({ ok: false, message: "관리자로 로그인 해주시기 바랍니다." });
  }
};

const userAuthenticate = (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (accessToken) {
    const verifyToken = jwt.verifyToken(accessToken);
    if (verifyToken) {
      req.login_id = verifyToken.login_id;
      req.user_role = verifyToken.user_role;
      next();
    } else {
      res.status(401).json({ ok: false, message: "로그인 해주시기 바랍니다." });
    }
  } else {
    res.status(401).json({ ok: false, message: "로그인 해주시기 바랍니다." });
  }
};

const supervisorAuthenticate = (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (accessToken) {
    const verifyToken = jwt.verifyToken(accessToken);
    if (verifyToken) {
      if (verifyToken.user_role === "supervisor") {
        req.login_id = verifyToken.login_id;
        req.user_role = verifyToken.user_role;
        next();
      } else {
        res.status(401).json({ ok: false, message: "접근할 수 없습니다." });
      }
    } else {
      res.status(401).json({ ok: false, message: "접근할 수 없습니다." });
    }
  } else {
    res.status(401).json({ ok: false, message: "접근할 수 없습니다." });
  }
};

module.exports = { adminAuthenticate, userAuthenticate, supervisorAuthenticate };
