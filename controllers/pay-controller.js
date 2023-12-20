const payDB = require("../models/pay-db");
const showDB = require("../models/show-db");
const emailController = require("../controllers/email-controller");
const { send_main_func } = require("../utils/emailSendUtil");
const axios = require("axios");

const db = require("../database/db"); // 데이터베이스 연결 설정
const util = require("util");
const beginTransaction = util.promisify(db.beginTransaction).bind(db); // 트랜잭션 시작
const commit = util.promisify(db.commit).bind(db); // 트랜잭션 커밋
const rollback = util.promisify(db.rollback).bind(db); // 트랜잭션 롤백 (시작 지점으로)

exports.confirm = async (req, res) => {
  // orderId : 주문번호 (무작위 6~64 글자 수)   string
  // amount : 결제 금액                        number
  const { orderId, amount, show_id, show_times_id, is_receive_email } = req.body;

  try {
    const user_login_id = req.login_id;

    const userInfo = await userDB.getMember(user_login_id);
    const user_id = userInfo[0].id;

    // 트랜잭션 시작
    await beginTransaction();

    const getEnableTime = await showDB.getEnableTime({ show_times_id });
    const enableTime = getEnableTime[0].result;

    if (enableTime === 0) {
      res.status(200).json({
        ok: false,
        message: "예약 가능한 시간이 아닙니다.",
      });
      return;
    }

    if (is_receive_email === 1) {
      // 이메일 전송
      console.log("이메일 전송");
    }

    console.log(show_id, show_times_id, user_id, is_receive_email, orderId, amount);
    // user_reservation 테이블에 예약 정보 저장
    const result = await payDB.insertUserReservation({ show_id, show_times_id, user_id, is_receive_email, orderId, amount });

    if (result) {
      // show_times 테이블에 예약 인원 수 차감
      await payDB.updateShowTimes({ show_times_id });
    }

    // 트랜잭션 커밋
    await commit();

    res.status(200).json({
      ok: true,
      message: "예약 완료",
    });
  } catch (err) {
    await rollback(); // 오류 발생 시 트랜잭션 롤백
    res.status(500).json({
      ok: false,
      message: err,
    });
    return;
  }
};
