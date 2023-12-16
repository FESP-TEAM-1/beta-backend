const jwt = require("../utils/jwt-util");

const storyAuthenticate = (req, res, next) => {
  if (req.cookies.accessToken && jwt.verifyToken(req.cookies.accessToken)) {
    next();
  } else {
    res.status(401).json({ ok: false, message: "로그인 해주시기 바랍니다." });
  }
};

module.exports = { storyAuthenticate };
