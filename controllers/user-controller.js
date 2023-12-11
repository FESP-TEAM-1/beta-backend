const bcrypt = require("bcrypt");
const userDB = require("../models/user-db");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");

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
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ messge: err });
  }
};

// 유저 조회 (아이디로 조회)
exports.getMember = async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await userDB.getMember(user_id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ messge: err });
  }
};

// 일반 유저 조회
exports.getUser = async (req, res) => {
  try {
    const result = await userDB.getUser();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ messge: err });
  }
};

// 관리자 조회
exports.getAdmin = async (req, res) => {
  try {
    const result = await userDB.getAdmin();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ messge: err });
  }
};

// 로그인 (JWT 생성)
exports.login = async (req, res) => {
  const { user_id, user_pw, user_role } = req.body;
  try {
    const user = await userDB.getMember(user_id, user_role);

    // 아이디가 존재하지 않을 때
    if (user.length === 0) {
      res.status(401).json({ message: "존재하지 않는 아이디입니다." });
    }

    const blobToStr = Buffer.from(user[0].user_pw).toString("utf-8");
    const isMatch = await hashCompare(user_pw, blobToStr);

    // 비밀번호가 일치하지 않을 때
    if (!isMatch) {
      res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
      return;
    }

    // JWT 생성
    const token = jwt.sign(
      {
        user_id: user[0].user_id,
        name: user[0].name,
        user_type: user[0].user_type,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" } // 1시간 유효
    );

    // JWT 쿠키에 저장
    res.cookie("token", token, {
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

// 로그아웃
exports.logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout successful" });
};

// 회원가입
exports.signup = async (req, res) => {
  const { name, user_email, user_id, user_pw, birth_date, gender, phone_number, user_role } = req.body;

  try {
    // 아이디 중복 체크
    const getUser = await userDB.getMember(user_id);
    if (getUser.length !== 0) {
      res.status(401).json({ message: "이미 존재하는 아이디입니다." });
      return;
    }

    // 비밀번호 암호화
    const hash = await pwToHash(user_pw);

    // 회원가입
    const unique_id = uuid();
    await userDB.signUp([unique_id, name, user_email, user_id, hash, birth_date, gender, phone_number, user_role]);

    res.status(200).json({ message: "회원가입 성공!!!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "회원가입 실패..." });
  }
};
