const { send_main_func } = require("../utils/emailSendUtil");
const emailDB = require("../models/email-db");

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
    await emailDB.insertEmailCode(user_email, VERIFICATION_CODE);
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

exports.verifyCode = async (req, res) => {
  const { user_email, code } = req.body;

  try {
    const nowTime = new Date();
    const result = await emailDB.getCertCode(user_email);
    const getCode = result[0].code;
    const getTime = result[0].created_at;

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
