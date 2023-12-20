const express = require("express");
const router = express.Router();
const payController = require("../controllers/pay-controller");

router.post("/confirm", payController.confirm);

module.exports = router;
