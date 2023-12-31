const nodemailer = require("nodemailer");
const { EMAIL_SERVICE, EMAIL_ADDRESS, EMAIL_PASSWORD } = process.env;

const htmlContent = (VERIFICATION_CODE) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
  <style>
  
  body {
      font-family: Arial, sans-serif;
      background-color: #f2f2f2;
      margin: 0;
      padding: 20px;
  }
  
  .email-container {
      max-width: 600px;
      margin: auto;
      background: white;
      padding: 20px;
      border: 1px solid #d9d9d9;
      box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.55);
  }
  
  .header {
      background: #da3017;
      color: white;
      padding: 10px;
      text-align: center;
      font-size: 24px;
  }
  
  .content {
      margin-top: 20px;
      padding: 10px;
  }
  
  .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 12px;
      color: #767676;
  }
  
  .button {
      background-color: #da3017;
      color: white;
      padding: 10px 20px;
      text-align: center;
      text-decoration: none;
      display: inline-block;
      font-size: 16px;
      margin: 4px 2px;
      cursor: pointer;
      border-radius: 4px;
  }
  
  </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header" style="padding: 10px; text-align: start; font-size: 24px;">
        BETA에 오신 것을 환영합니다.
      </div>

      <div class="content" style="margin-top: 20px; padding: 10px;">
        <p>안녕하세요,</p>
        <p>BETA에 회원가입 진행해 주셔서 감사합니다. 아래의 인증코드를 사용하여 이메일 인증을 완료해 주세요 :)</p>
        <p style="font-size: 20px; margin: 20px 0; color: #da3017;"><strong>${VERIFICATION_CODE}</strong></p>
        <p>이 코드는 3분 동안 유효하며, 한 번만 사용할 수 있습니다.</p>
      </div>

      <div class="footer" style="margin-top: 20px; text-align: start; font-size: 12px; color: #767676; padding: 0 10px;">
        감사합니다, team477
      </div>
    </div>
  </body>
  </html>
  `;
};

const send_main_func = async ({ to, VERIFICATION_CODE }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: EMAIL_SERVICE,
      auth: {
        user: EMAIL_ADDRESS,
        pass: EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: EMAIL_ADDRESS,
      to: to,
      subject: "BETA 이메일 인증코드 발급",
      html: htmlContent(VERIFICATION_CODE),
    };

    await transporter.sendMail(mailOptions);
    return "Email Sent";
  } catch (err) {
    throw err;
  }
};

module.exports = { htmlContent, send_main_func };
