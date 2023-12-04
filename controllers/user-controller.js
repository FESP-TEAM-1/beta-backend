const bcrypt = require("bcrypt");
const userDB = require("../models/user-db");
const { v4: uuid } = require("uuid");
const jwt = require("../utils/jwt-util");

// PW to Hash
const pwToHash = async (pw) => {
  const saltRounds = 10;

  try {
    const hash = await bcrypt.hash(pw, saltRounds);
    return hash;
  } catch (err) {
    console.error(err);
    return err;
  }
};

// 비밀번호 비교
const hashCompare = async (inputValue, hash) => {
  try {
    const isMatch = await bcrypt.compare(inputValue, hash);
    if (isMatch) return true;
    else return false;
  } catch (err) {
    console.error(err);
    return err;
  }
};

// 전체 유저 조회
exports.getAllMember = async (req, res) => {
  try {
    const result = await userDB.getAllMember();
    res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      messge: err,
    });
  }
};

// 유저 조회 (아이디로 조회)
exports.getMember = async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await userDB.getMember(user_id);
    res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      messge: err,
    });
  }
};

// 일반 유저 조회
exports.getUser = async (req, res) => {
  try {
    const result = await userDB.getUser();
    res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      messge: err,
    });
  }
};

// 관리자 조회
exports.getAdmin = async (req, res) => {
  try {
    const result = await userDB.getAdmin();
    res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      messge: err,
    });
  }
};

// 로그인 (JWT 생성)
exports.login = async (req, res) => {
  const { user_id, user_pw } = req.body;
  try {
    const user = await userDB.getMember(user_id);

    // 아이디가 존재하지 않을 때
    if (user.length === 0) {
      res.status(401).json({
        ok: false,
        message: "존재하지 않는 아이디입니다.",
      });
    }

    const blobToStr = Buffer.from(user[0].user_pw).toString("utf-8");
    const isMatch = await hashCompare(user_pw, blobToStr);

    // 비밀번호가 일치하지 않을 때
    if (!isMatch) {
      res.status(401).json({
        ok: false,
        message: "비밀번호가 일치하지 않습니다.",
      });
      return;
    }

    const userInfo = {
      user_id: user[0].user_id,
      name: user[0].name,
      user_type: user[0].user_type,
    };

    // JWT access Token 생성
    const accessToken = jwt.generateAccessToken(userInfo);

    // JWT refresh Token 생성
    const refreshToken = jwt.generateRefreshToken();

    // JWT 쿠키에 저장
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });

    res.status(200).json({
      user_id: user[0].user_id,
      name: user[0].name,
      user_type: user[0].user_type,
      user_token: token,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// access Token 검증
exports.verifyToken = async (req, res) => {
  const accessToken = req.cookies.accessToken; // 쿠키에서 엑세스토큰 획득
  const refreshToken = req.cookies.refreshToken; // 쿠키에서 리프레시토큰 획득

  // 엑세스토큰이 없을 때
  if (!accessToken) {
    res.status(401).json({
      ok: false,
      message: "로그인 해주시기 바랍니다.",
    });
    return;
  }
  if (!refreshToken) {
    res.status(401).json({
      ok: false,
      message: "로그인 해주시기 바랍니다.",
    });
    return;
  }

  // // 엑세스토큰 검증
  // const isAccessTokenValid = jwt.verifyAccessToken(accessToken);
  // if (!isAccessTokenValid) {
  //   // 리프레시토큰 검증
  //   const isRefreshTokenValid = jwt.verifyRefreshToken(refreshToken);
  //   if (!isRefreshTokenValid) {
  //     res.status(401).json({
  //       ok: false,
  //       message: "로그인 해주시기 바랍니다.",
  //     });
  //     return;
  //   }

  //   // 리프레시토큰 검증 성공
  //   const payload = jwt.getAccessTokenPayload(accessToken);
  //   const userInfo = {
  //     user_id: payload.user_id,
  //     name: payload.name,
  //     user_type: payload.user_type,
  //   };
  //   const newAccessToken = jwt.generateAccessToken(userInfo);
  //   res.cookie("accessToken", newAccessToken, {
  //     httpOnly: true,
  //     sameSite: "None",
  //     secure: true,
  //   });
  // }
};

// 로그아웃
exports.logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    ok: true,
    message: "Logout successful",
  });
};

// 회원가입
exports.signup = async (req, res) => {
  const {
    name,
    user_email,
    user_id,
    user_pw,
    birth_date,
    gender,
    phone_number,
    user_type,
  } = req.body;

  try {
    // 아이디 중복 체크
    const getUser = await userDB.getMember(user_id);
    if (getUser.length !== 0) {
      res.status(401).json({
        ok: false,
        message: "이미 존재하는 아이디입니다.",
      });
      return;
    }

    // 비밀번호 암호화
    const hash = await pwToHash(user_pw);

    // 회원가입
    const unique_id = uuid();
    await userDB.signUp([
      unique_id,
      name,
      user_email,
      user_id,
      hash,
      birth_date,
      gender,
      phone_number,
      user_type,
    ]);

    res.status(200).json({
      ok: true,
      message: "회원가입 성공!!!",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: "회원가입 실패...",
    });
  }
};
