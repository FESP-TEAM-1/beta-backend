require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.ENDPOINT_URL,
    credentials: true,
  })
);

app.listen(5000, () => {
  console.log("서버 실행");
});
