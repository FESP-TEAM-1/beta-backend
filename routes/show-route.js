const express = require("express");
const router = express.Router();
const showController = require("../controllers/show-controller");

router.get("/concert", showController.getFilterConcerts);
router.get("/exhibition", showController.getFilterExhibitions);
router.get("/concert/:show_id", showController.getConcert);
router.get("/exhibition/:show_id", showController.getExhibition);
router.get("/show/reservation/:show_id", showController.getShowReservation);

module.exports = router;
