const payDB = require("../models/pay-db");
const showDB = require("../models/show-db");
const emailController = require("../controllers/email-controller");
const { send_main_func } = require("../utils/emailSendUtil");
const axios = require("axios");

exports.confirm = async (req, res) => {
  // paymentKey : 결제 승인 요청에 필요한 키    string
  // orderId : 주문번호 (무작위 6~64 글자 수)   string
  // amount : 결제 금액                        number
  const { paymentKey, orderId, amount, show_id, show_times_id, is_receive_email } = req.body;

  try {
    // const user_login_id = req.login_id;

    // const userInfo = await userDB.getMember(user_login_id);
    // const user_id = userInfo[0].id;

    if (!amount) {
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

      // user_reservation 테이블에 예약 정보 저장
      await payDB.insertUserReservation({ show_id, show_times_id, user_id, is_emailSend });
      // show_times 테이블에 예약 인원 수 차감
      await payDB.updateShowTimes({ show_times_id });
      res.status(200).json({
        ok: true,
        message: "예약 완료",
      });
      return;
    }

    const secretKey = process.env.TOSSPAYMENTS_API_SECRET_KEY;
    const encryptedSecretKey = "Basic " + Buffer.from(secretKey + ":").toString("base64");

    const body = {
      orderId: orderId,
      amount: amount,
      paymentKey: paymentKey,
    };

    await axios
      .post("https://api.tosspayments.com/v1/payments/confirm", body, {
        headers: {
          Authorization: encryptedSecretKey,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        // 결제 성공 비즈니스 로직을 구현하세요.
        console.log(response);
        res.status(200).json({
          ok: true,
          message: "예약 완료",
        });
      })
      .catch(function (error) {
        // 결제 실패 비즈니스 로직을 구현하세요.
        console.log(error.response.body);
        res.status(500).json({
          ok: false,
          message: err,
        });
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
