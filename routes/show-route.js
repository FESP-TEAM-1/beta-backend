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
router.get("/show/user/like", userAuthenticate, showController.getUserLikeList);
router.get("/show/user/review", userAuthenticate, showController.getUserReview);
router.get("/show/user", userAuthenticate, showController.getAllShowUser);
// router.get("/show/:show_id/user/like", userAuthenticate, showController.getUserLike);
router.post("/show/upload", showController.uploadShow);
router.post("/show/like-add", userAuthenticate, showController.addLike);
router.post("/show/review-add", userAuthenticate, showController.addReview);
router.patch("/show/review-update", userAuthenticate, showController.updateReview);
router.put("/show/update", userAuthenticate, showController.updateShow); // showAuthenticate 이걸 추가하면 userAuthenticate를 빼야 함 관리자이기 때문에
router.delete("/show/like-delete/:show_id", userAuthenticate, showController.deleteLike);
router.delete("/show/review-delete/:review_id/:show_id", userAuthenticate, showController.deleteReview);
router.delete("/show/delete/:show_id", userAuthenticate, showController.deleteShow); // showAuthenticate 이걸 추가하면 userAuthenticate를 빼야 함 관리자이기 때문에

module.exports = router;
