const payDB = require("../models/pay-db");

exports.confirm = async (req, res) => {
  // paymentKey : 결제 승인 요청에 필요한 키    string
  // orderId : 주문번호 (무작위 6~64 글자 수)   string
  // amount : 결제 금액                        number
  const { paymentKey, orderId, amount } = req.body;

  const secretKey = process.env.TOSSPAYMENT_API_SECRET_KEY;
  const encryptedSecretKey = "Basic " + Buffer.from(secretKey + ":").toString("base64");

  got
    .post("https://api.tosspayments.com/v1/payments/confirm", {
      headers: {
        Authorization: encryptedSecretKey,
        "Content-Type": "application/json",
      },
      json: {
        orderId: orderId,
        amount: amount,
        paymentKey: paymentKey,
      },
      responseType: "json",
    })
    .then(function (response) {
      // 결제 성공 비즈니스 로직을 구현하세요.
      console.log(response.body);
      res.status(response.statusCode).json(response.body);
    })
    .catch(function (error) {
      // 결제 실패 비즈니스 로직을 구현하세요.
      console.log(error.response.body);
      res.status(error.response.statusCode).json(error.response.body);
    });
};
