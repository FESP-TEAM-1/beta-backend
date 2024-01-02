require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MemoryStore = require("memorystore")(session);
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [process.env.ENDPOINT_URL, process.env.ENDPOINT_URL2];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Origin not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

const maxAge = 604800000; // 7일
const sessionObj = {
  secret: process.env.SESSION_SECRET_KEY,
  httpOnly: true,
  resave: false,
  saveUninitialized: true,
  store: new MemoryStore({ checkPeriod: maxAge }),
  cookie: {
    maxAge,
  },
};
app.use(session(sessionObj));

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
  console.log(process.env.ENDPOINT_URL2);
  console.log("version 1.0.4");
});
