const express = require("express");
const router = express.Router();
const showController = require("../controllers/show-controller");
const { showAuthenticate } = require("../middleware/auth-middleware");

router.get("/concert", showController.getFilterConcerts);
router.get("/exhibition", showController.getFilterExhibitions);
router.get("/detail/:show_id", showController.getShow);
router.get("/show/reservation/:show_id", showController.getShowReservation);
router.get("/show/upload", showAuthenticate, showController.uploadShow);

module.exports = router;
