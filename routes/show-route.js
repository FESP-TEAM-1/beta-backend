const express = require("express");
const router = express.Router();
const showController = require("../controllers/show-controller");
const { showAuthenticate, userAuthenticate } = require("../middleware/auth-middleware");

router.get("/concert", showController.getFilterConcerts);
router.get("/exhibition", showController.getFilterExhibitions);
router.get("/detail/:show_id", showController.getShow);
router.get("/detail/:show_id/review", showController.getShowReview);
router.get("/show/reservation/:show_id", showController.getShowReservation);
// router.get("/show/upload", showAuthenticate, showController.uploadShow);
router.get("/show/user/like", userAuthenticate, showController.getUserLike);
router.get("/show/user/review", userAuthenticate, showController.getUserReview);
router.post("/show/upload", showController.uploadShow);
router.post("/show/like-add", showController.addLike);
router.post("/show/review-add", showController.addReview);
router.patch("/show/review-update", showController.updateReview);
router.delete("/show/like-delete", showController.deleteLike);
router.delete("/show/review-delete", showController.deleteReview);

module.exports = router;
