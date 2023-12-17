const express = require("express");
const router = express.Router();
const showController = require("../controllers/show-controller");
const { showAuthenticate } = require("../middleware/auth-middleware");

router.get("/concert", showController.getFilterConcerts);
router.get("/exhibition", showController.getFilterExhibitions);
router.get("/detail/:show_id", showController.getShow);
router.get("/detail/:show_id/review", showController.getShowReview);
router.get("/show/reservation/:show_id", showController.getShowReservation);
// router.get("/show/upload", showAuthenticate, showController.uploadShow);
router.post("/show/upload", showController.uploadShow);
router.post("/show/like-add", showController.addLike);
router.delete("/show/like-delete", showController.deleteLike);
router.post("/show/review-add", showController.addReview);
router.patch("/show/review-modify", showController.modifyReview);
router.delete("/show/review-delete", showController.deleteReview);

module.exports = router;
