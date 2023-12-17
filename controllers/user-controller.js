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
    console.error(err);
    res.status(500).json({
      ok: false,
      message: err,
    });
    return;
  }
};

// 유저 조회 (아이디로 조회)
exports.getMember = async (req, res) => {
  const { login_id } = req.params;

  try {
    const result = await userDB.getMember(login_id);
    res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: err,
    });
    return;
  }
};

// 일반 유저 조회
exports.getUsers = async (req, res) => {
  try {
    const result = await userDB.getUsers();
    res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: err,
    });
    return;
  }
};

// 관리자 조회
exports.getAdmins = async (req, res) => {
  try {
    const result = await userDB.getAdmins();
    res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: err,
    });
    return;
  }
};

// 로그인 (JWT 생성)
exports.login = async (req, res) => {
  const { login_id, login_pw, user_role } = req.body;
  try {
    const user = await userDB.getMemberAllInfo(login_id, user_role);

    // 아이디가 존재하지 않을 때
    if (user.length === 0) {
      res.status(401).json({
        ok: false,
        message: "존재하지 않는 아이디입니다.",
      });
      return;
    }

    const blobToStr = Buffer.from(user[0].login_pw).toString("utf-8");
    const isMatch = await hashCompare(login_pw, blobToStr);

    // 비밀번호가 일치하지 않을 때
    if (!isMatch) {
      res.status(401).json({
        ok: false,
        message: "비밀번호가 일치하지 않습니다.",
      });
      return;
    }

    const userInfo = {
      login_id: user[0].login_id,
      user_name: user[0].user_name,
      user_role: user[0].user_role,
    };

    // JWT access Token 생성
    const accessToken = jwt.generateAccessToken(userInfo);

    // JWT refresh Token 생성
    const refreshToken = jwt.generateRefreshToken(userInfo);

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

    await userDB.insertUserLog(user[0].user_role, user[0].login_id);

    res.status(200).json({
      ok: true,
      data: {
        login_id: user[0].login_id,
        user_name: user[0].user_name,
        user_role: user[0].user_role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: err,
    });
    return;
  }
};

// access Token 검증
exports.verifyToken = async (req, res) => {
  const accessToken = req.cookies.accessToken;
  const decoded = jwt.verifyToken(accessToken);

  if (decoded) {
    res.status(200).json({
      ok: true,
      data: decoded,
    });
  } else {
    res.status(401).json({
      ok: false,
      message: "Invalid Token",
    });
    return;
  }
};

// refresh Token 검증
exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const decoded = jwt.verifyToken(refreshToken);

  if (decoded) {
    const user = await userDB.getMember(decoded.login_id);
    const userInfo = {
      login_id: user[0].login_id,
      user_name: user[0].user_name,
      user_role: user[0].user_role,
    };
    const newAccessToken = jwt.generateAccessToken(userInfo);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });

    res.status(200).json({
      ok: true,
      data: {
        login_id: user[0].login_id,
        user_name: user[0].user_name,
        user_role: user[0].user_role,
      },
    });
  } else {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(401).json({
      ok: false,
      message: "Invalid refreshToken",
    });
    return;
  }
};

// 로그아웃
exports.logout = async (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(200).json({
    ok: true,
    data: "Logout successful",
  });
};

// 회원가입
exports.signup = async (req, res) => {
  const { user_name, user_email, login_id, login_pw, birth_date, gender, phone_number, user_role } = req.body;

  try {
    // 아이디 중복 체크
    const getUser = await userDB.getMember(login_id);
    if (getUser.length !== 0) {
      res.status(401).json({
        ok: false,
        message: "이미 존재하는 아이디입니다.",
      });
      return;
    }

    // 비밀번호 암호화
    const hash = await pwToHash(login_pw);

    // 회원가입
    await userDB.signUp([user_name, user_email, login_id, hash, birth_date, gender, phone_number, user_role]);

    res.status(200).json({
      ok: true,
      data: "회원가입 성공!!!",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: "회원가입 실패...",
    });
    return;
  }
};

// 회원정보 수정
exports.updateUser = async (req, res) => {
  try {
    const { user_name, user_email, login_pw, birth_date, gender, phone_number } = req.body;
    const user_login_id = req.login_id;

    // 유저 정보 조회 user_id 가져오기
    const userInfo = await userDB.getMember(user_login_id);
    const user_id = userInfo[0].id;

    const hash = await pwToHash(login_pw);

    await userDB.updateUser({ user_id, user_name, user_email, hash, birth_date, gender, phone_number });

    res.status(200).json({
      ok: true,
      data: "회원정보 수정 성공!!!",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: "회원정보 수정 실패...",
    });
    return;
  }
};
