const express = require("express");
const router = express.Router();
const payController = require("../controllers/pay-controller");
const { userAuthenticate } = require("../middleware/auth-middleware");

router.post("/payVerification", userAuthenticate, payController.payVerification);
router.post("/confirm", userAuthenticate, payController.confirm);
router.post("/tossConfirm", userAuthenticate, payController.tossConfirm, payController.confirm);

module.exports = router;
