require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.ENDPOINT_URL,
    credentials: true,
  })
);

const routesPath = path.join(__dirname, "/routes"); // routes 파일들이 있는 디렉토리 경로

// routes 파일들을 모두 읽어서 각각을 Express 앱에 등록
fs.readdirSync(routesPath).forEach((file) => {
  const route = require(path.join(routesPath, file));
  app.use("/api", route);
});

app.listen(process.env.PORT, () => {
  console.log("서버 실행");
  console.log(process.env.PORT);
  console.log(process.env.ENDPOINT_URL);
  console.log("version 1.0.9");
});
