const payDB = require("../models/pay-db");
const showDB = require("../models/show-db");
const userDB = require("../models/user-db");
const { send_main_func } = require("../utils/reservationEmailSendUtil");
const compareWithCurrentTime = require("../utils/compareWithCurrentTime");
const getToday = require("../utils/getToday");
const axios = require("axios");

const db = require("../database/db"); // 데이터베이스 연결 설정
const util = require("util");
const beginTransaction = util.promisify(db.beginTransaction).bind(db); // 트랜잭션 시작
const commit = util.promisify(db.commit).bind(db); // 트랜잭션 커밋
const rollback = util.promisify(db.rollback).bind(db); // 트랜잭션 롤백 (시작 지점으로)

// 검증 단계
exports.payVerification = async (req, res) => {
  const { show_id, show_times_id } = req.body;

  try {
    const user_login_id = req.login_id;

    const userInfo = await userDB.getMember(user_login_id);
    const user_id = userInfo[0].id;

    const getEnableTime = await showDB.getEnableTime({ show_times_id });
    const enableTime = getEnableTime[0].result;
    if (enableTime === 0) {
      res.status(400).json({
        ok: false,
        message: "예약 가능한 시간이 아닙니다.",
      });
      return;
    }

    if (compareWithCurrentTime(getEnableTime[0].date_time) === "over") {
      res.status(400).json({
        ok: false,
        message: "해당 회차는 이미 종료 되었습니다.",
      });
      return;
    }

    const getPayUserReservation = await payDB.getPayUserReservation({ show_id, user_id, show_times_id });
    if (getPayUserReservation.length > 0) {
      res.status(400).json({
        ok: false,
        message: "이미 예약 되었습니다.",
      });
      return;
    }

    const getShowDate = await showDB.getShowDate({ show_id });
    const nowTime = getToday();

    if (nowTime > getShowDate[0].end_date) {
      res.status(400).json({
        ok: false,
        message: `이미 종료된 ${getShowDate[0].show_type}입니다.`,
      });
      return;
    }

    res.status(200).json({
      ok: true,
      message: "확인 완료",
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: "서버 오류 발생",
    });
    return;
  }
};

// 무료 결제
exports.confirm = async (req, res) => {
  const { show_id, show_times_id, is_receive_email, orderId = null } = req.body;
  try {
    const user_login_id = req.login_id;

    // 트랜잭션 시작
    await beginTransaction();

    const userInfo = await userDB.getMember(user_login_id);
    const user_id = userInfo[0].id;

    const getEnableTime = await showDB.getEnableTime({ show_times_id });
    const showInfo = await showDB.getShowReservation({ show_id });
    if (is_receive_email === 1) {
      // 이메일 전송
      if (showInfo.length > 0 && showInfo[0].notice !== null) {
        const bufferToString = Buffer.from(showInfo[0].notice, "base64").toString("utf8");
        const utf8String = Buffer.from(bufferToString, "base64").toString("utf8");
        showInfo[0].notice = utf8String;
      }

      const item = {
        title: showInfo[0].title,
        location: showInfo[0].location + " " + showInfo[0].location_detail,
        price: showInfo[0].price,
        notice: showInfo[0].notice,
        date_time: getEnableTime[0].date_time,
        name: userInfo[0].user_name,
        phone_number: userInfo[0].phone_number,
        email: userInfo[0].user_email,
      };
      await send_main_func({ to: userInfo[0].user_email, item });
    }

    // user_reservation 테이블에 예약 정보 저장
    const result = await payDB.insertUserReservation({
      show_id,
      show_times_id,
      user_id,
      is_receive_email,
      orderId,
      price: showInfo[0].price,
      paymentKey: req.paymentKey,
    });

    if (result) {
      // show_times 테이블에 예약 인원 수 차감
      await payDB.updateShowTimes({ show_times_id });
    }

    // 트랜잭션 커밋
    await commit();
    res.status(200).json({
      ok: true,
      message: `예약 완료`,
    });
  } catch (err) {
    console.log(err);
    await rollback(); // 오류 발생 시 트랜잭션 롤백

    // 토스페이먼츠 결제 후 db에러 발생했을 경우 결제 취소
    if (orderId) {
      payCancelFunc(req.paymentKey);
    }

    res.status(500).json({
      ok: false,
      message: "서버 오류 발생",
    });
    return;
  }
};

// 유료 결제
exports.tossConfirm = async (req, res, next) => {
  // orderId : 주문번호 (무작위 6~64 글자 수)   string
  // amount : 결제 금액                        number
  const { orderId, paymentKey, show_id } = req.body;

  const getReservationInfo = await showDB.getShowReservationInfo({ show_id });
  const amount = getReservationInfo[0].price;

  const requestData = {
    orderId,
    paymentKey,
    amount,
  };
  const secretKey = process.env.TOSSPAYMENTS_API_SECRET_KEY;
  const encryptedSecretKey = `Basic ${btoa(secretKey + ":")}`;

  try {
    await axios.post("https://api.tosspayments.com/v1/payments/confirm", requestData, {
      headers: {
        Authorization: encryptedSecretKey,
        "Content-Type": "application/json",
      },
    });
    req.paymentKey = paymentKey;
    next();
  } catch (err) {
    const response = err.response;
    const errorCode = response.status;
    const { message } = response.data;

    res.status(errorCode).json({
      ok: false,
      message: message,
    });
  }
};

// 결제 취소 함수
exports.payCancelFunc = async (paymentKey, cancelReason = "서버오류") => {
  const secretKey = process.env.TOSSPAYMENTS_API_SECRET_KEY;
  const encryptedSecretKey = `Basic ${btoa(secretKey + ":")}`;

  const requestData = {
    cancelReason,
  };
  try {
    await axios.post(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, requestData, {
      headers: {
        Authorization: encryptedSecretKey,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.log(err);
    const response = err.response;
    const errorCode = response.status;
    const { message } = response.data;

    res.status(errorCode).json({
      ok: false,
      message: message,
    });
    return;
  }
};
