const express = require("express");
const router = express.Router();
const showController = require("../controllers/show-controller");

router.get("/concert", showController.getConcerts);
router.get("/exhibition", showController.getExhibitions);

module.exports = router;
