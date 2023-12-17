const express = require("express");
const router = express.Router();
const emailController = require("../controllers/email-controller");

router.post("/send-email", emailController.sendEmail);
router.post("/send-univ-email", emailController.sendUnivEmail);
router.post("/verify-code", emailController.verifyCode);
router.post("/verify-univ-code", emailController.verifyUnivCode);

module.exports = router;
