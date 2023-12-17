const { send_main_func } = require("../utils/emailSendUtil");
const emailDB = require("../models/email-db");
const axios = require("axios");
const getKoreaTime = require("../utils/getKoreaTime"); // 오늘 날짜를 가져오는 함수

exports.sendEmail = async (req, res) => {
  const { user_email } = req.body;
  try {
    const isEmail = await emailDB.getMemberEmail(user_email);
    if (isEmail.length > 0) {
      res.status(400).json({
        ok: false,
        message: "이미 가입된 이메일입니다.",
      });
      return;
    }

    // 인증 코드 생성
    const VERIFICATION_CODE = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");

    await send_main_func({ to: user_email, VERIFICATION_CODE });
    await emailDB.insertEmailCode(user_email, VERIFICATION_CODE, "true");
    res.status(200).json({
      ok: true,
      data: "이메일 전송 완료",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: err.message,
    });
    return;
  }
};

exports.sendUnivEmail = async (req, res) => {
  const { user_email, univName } = req.body;
  const key = process.env.UNIVCERT_API_KEY;
  const univ_check = true;

  try {
    const response = await axios.post("https://univcert.com/api/v1/certify", {
      key: key,
      email: user_email,
      univName: univName,
      univ_check: univ_check,
    });

    if (response.data.success === false) {
      await emailDB.insertEmailCode(user_email, null, response.data.message);
      res.status(400).json({
        ok: false,
        message: response.data.message,
      });
      return;
    }

    await emailDB.insertEmailCode(user_email, null, "true");
    res.status(200).json({
      ok: true,
      data: "전송 완료",
    });
  } catch (error) {
    const response = error.response.data;
    const code = response.code;
    const message = response.message;
    await emailDB.insertEmailCode(user_email, null, message);
    res.status(code).json({
      ok: false,
      message: message,
    });
    return;
  }
};

exports.verifyCode = async (req, res) => {
  const { user_email, code } = req.body;

  try {
    const nowTime = new Date();
    const result = await emailDB.getCertCode(user_email);
    const getCode = result[0].code;
    const getTime = result[0].created_at;
    const getId = result[0].id;

    const diffTime = new Date(nowTime.getTime() - getTime.getTime()).getMinutes();
    if (diffTime >= 3) {
      res.status(400).json({
        ok: false,
        message: "인증 시간이 초과되었습니다.",
      });
      return;
    }

    const codeBufferData = new Uint8Array(getCode);
    const codeDecodedString = new TextDecoder("utf-8").decode(codeBufferData);

    if (code === codeDecodedString) {
      await emailDB.updateCertCode(getId, getKoreaTime());
      res.status(200).json({
        ok: true,
        data: "인증 성공",
      });
    } else {
      res.status(400).json({
        ok: false,
        message: "인증 실패",
      });
      return;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: err.message,
    });
    return;
  }
};

exports.verifyUnivCode = async (req, res) => {
  const { user_email, code, univName } = req.body;

  try {
    const nowTime = new Date();
    const result = await emailDB.getCertCode(user_email);
    const getTime = result[0].created_at;
    const getId = result[0].id;

    const diffTime = new Date(nowTime.getTime() - getTime.getTime()).getMinutes();
    if (diffTime >= 3) {
      res.status(400).json({
        ok: false,
        message: "인증 시간이 초과되었습니다.",
      });
      return;
    }

    const response = await axios.post("https://univcert.com/api/v1/certifycode", {
      key: key,
      email: user_email,
      univName: univName,
      code: code,
    });

    if (response.data.success === false) {
      res.status(400).json({
        ok: false,
        message: response.data.message,
      });
      return;
    }

    await emailDB.updateCertCode(getId, getKoreaTime());
    res.status(200).json({
      ok: true,
      data: "인증 완료",
    });
  } catch (err) {
    const response = err.response.data;
    const code = response.code;
    const message = response.message;
    res.status(code).json({
      ok: false,
      message: message,
    });
    return;
  }
};
