const express = require("express");
const router = express.Router();
const payController = require("../controllers/pay-controller");
const { userAuthenticate } = require("../middleware/auth-middleware");

router.post("/confirm", payController.confirm);

module.exports = router;
