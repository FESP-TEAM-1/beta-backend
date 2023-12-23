const nodemailer = require("nodemailer");
const { EMAIL_SERVICE, EMAIL_ADDRESS, EMAIL_PASSWORD } = process.env;

function convertHtmlToText(html) {
  // 첫 번째 단계: <br> 태그를 \n으로 변환
  let text = html.replace(/<br\s*\/?>/gi, "\n");

  // 두 번째 단계: 모든 HTML 태그 제거
  text = text.replace(/<[^>]+>/g, "");

  return text;
}

const htmlContent = (item) => {
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

        pre {
          font-family: Arial, sans-serif;
          margin-bottom: 50px;
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
        <div class="header" style="padding: 10px; text-align: start; font-size: 24px">BETA 예매 내역입니다.</div>
  
        <div class="content" style="margin-top: 20px; padding: 10px">
          <p>안녕하세요, BETA입니다.</p>
          <p>저희 플랫폼을 통해 예매해주셔서 감사합니다. <br />아래의 예매 내역 참고해주시기 바랍니다.</p>
          <br />
          <div>
            <h2>예매 내역</h2>
            <h3>제목 : ${item.title}</h3>
  
            <div>
              <h4>공연 정보</h4>
              <ul>
                <li>장소 : ${item.location}</li>
                <li>가격 : ${item.price}</li>
              </ul>
            </div>
  
            <div>
              <h4>유의 사항</h4>
              <pre>${convertHtmlToText(item.notice)}</pre>
            </div>
  
            <div>
              <h4>회차</h4>
              <ul>
                <li>${item.date_time}</li>
              </ul>
            </div>
  
            <div>
              <h4>예약자 정보</h4>
              <ul>
                <li>이름 : ${item.name}</li>
                <li>연락처 : ${item.phone_number}</li>
                <li>이메일 : ${item.email}</li>
              </ul>
            </div>
          </div>
        </div>
  
        <div class="footer" style="margin-top: 20px; text-align: start; font-size: 12px; color: #767676; padding: 0 10px">감사합니다, team477</div>
      </div>
    </body>
  </html>
  `;
};

const send_main_func = async ({ to, item }) => {
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
      subject: "BETA 예매 내역 확인 이메일입니다.",
      html: htmlContent(item),
    };

    await transporter.sendMail(mailOptions);
    return "Email Sent";
  } catch (err) {
    throw err;
  }
};

module.exports = { htmlContent, send_main_func };
