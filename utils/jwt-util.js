const jwt = require("jsonwebtoken");
const secret_key = process.env.JWT_SECRET_KEY;

// access Token 생성
exports.generateAccessToken = (user) => {
  return jwt.sign(user, secret_key, {
    expiresIn: "1h",
  });
};

// refresh Token 생성
exports.generateRefreshToken = () => {
  return jwt.sign({}, secret_key, {
    expiresIn: "7d",
  });
};

// access Token 검증
exports.verifyAccessToken = (accessToken) => {
  try {
    jwt.verify(accessToken, secret_key);
    return true;
  } catch (err) {
    return false;
  }
};

// refresh Token 검증
exports.verifyRefreshToken = (refreshToken) => {
  try {
    jwt.verify(refreshToken, secret_key);
    return true;
  } catch (err) {
    return false;
  }
};

const getAccessTokenPayload = (accessToken) => {
  try {
    const payload = jwt.verify(accessToken, secret_key);
    return payload;
  } catch (err) {
    console.log(err);
    return null;
  }
};
