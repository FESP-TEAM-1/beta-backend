const express = require("express");
const router = express.Router();
const showController = require("../controllers/show-controller");
const { showAuthenticate, userAuthenticate } = require("../middleware/auth-middleware");

router.get("/concert", showController.getFilterConcerts);
router.get("/exhibition", showController.getFilterExhibitions);
router.get("/detail/:show_id", showController.getShow);
router.get("/detail/:show_id/review", showController.getShowReview);
router.get("/show/reservation/:show_id", userAuthenticate, showController.getShowReservation);
router.get("/show/user/like", userAuthenticate, showController.getUserLikeList);
router.get("/show/user/review", userAuthenticate, showController.getUserReview);
router.get("/show/user", userAuthenticate, showController.getAllShowUser);
// router.get("/show/:show_id/user/like", userAuthenticate, showController.getUserLike);
router.post("/show/upload", showAuthenticate, showController.uploadShow);
router.post("/show/like-add", userAuthenticate, showController.addLike);
router.post("/show/review-add", userAuthenticate, showController.addReview);
router.patch("/show/review-update", userAuthenticate, showController.updateReview);
router.put("/show/update", showAuthenticate, showController.updateShow);
router.delete("/show/like-delete/:show_id", userAuthenticate, showController.deleteLike);
router.delete("/show/review-delete/:review_id/:show_id", userAuthenticate, showController.deleteReview);
router.delete("/show/delete/:show_id", showAuthenticate, showController.deleteShow);

module.exports = router;
