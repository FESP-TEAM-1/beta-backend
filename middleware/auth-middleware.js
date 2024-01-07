const jwt = require("../utils/jwt-util");
const userDB = require("../models/user-db");

// 공통된 토큰 처리 로직
const authenticateToken = async (req, res, expectedRole) => {
  const accessToken = req.cookies.accessToken;
  let payload = accessToken ? jwt.verifyToken(accessToken) : null;
  if (!payload) {
    const refreshToken = req.cookies.refreshToken;
    payload = refreshToken ? jwt.verifyToken(refreshToken) : null;
    if (payload && (!expectedRole || payload.user_role === expectedRole)) {
      const user = await userDB.getMember(payload.login_id);
      const userInfo = {
        login_id: user[0].login_id,
        user_name: user[0].user_name,
        user_role: user[0].user_role,
      };
      const newAccessToken = jwt.generateAccessToken(userInfo);
      res.cookie("accessToken", newAccessToken, {
        // domain: ".beta-beta.net", // 배포 시 주석 해제
        path: "/",
        httpOnly: true,
        sameSite: "None",
        secure: true,
      });
      console.log("accessToken 재발급");
    }
  }

  if (payload && (!expectedRole || payload.user_role === expectedRole)) {
    req.login_id = payload.login_id;
    req.user_role = payload.user_role;
    return true;
  }
  return false;
};

// 관리자 권한 토큰 검증
const adminAuthenticate = async (req, res, next) => {
  if (await authenticateToken(req, res, "admin")) {
    next();
  } else {
    res.status(401).json({ ok: false, message: "관리자로 로그인 해주시기 바랍니다." });
  }
};

// 일반 유저 권한 토큰 검증
const userAuthenticate = async (req, res, next) => {
  if (await authenticateToken(req, res)) {
    next();
  } else {
    res.status(401).json({ ok: false, message: "로그인 후 이용해주세요." });
  }
};

// 슈퍼바이저 권한 토큰 검증
const supervisorAuthenticate = async (req, res, next) => {
  if (await authenticateToken(req, res, "supervisor")) {
    next();
  } else {
    res.status(401).json({ ok: false, message: "접근할 수 없습니다." });
  }
};

module.exports = { adminAuthenticate, userAuthenticate, supervisorAuthenticate };
