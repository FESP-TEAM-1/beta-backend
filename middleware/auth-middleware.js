const jwt = require("../utils/jwt-util");

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

module.exports = { userAuthenticate };
