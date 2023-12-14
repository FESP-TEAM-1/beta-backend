const express = require("express");
const router = express.Router();
const emailController = require("../controllers/email-controller");

router.post("/send-email", emailController.sendEmail);
router.post("/verify-code", emailController.verifyCode);

module.exports = router;
