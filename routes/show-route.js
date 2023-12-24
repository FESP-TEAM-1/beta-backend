const express = require("express");
const router = express.Router();
const showController = require("../controllers/show-controller");
const { adminAuthenticate, userAuthenticate } = require("../middleware/auth-middleware");

router.get("/concert", showController.getFilterConcerts);
router.get("/exhibition", showController.getFilterExhibitions);
router.get("/detail/:show_id", showController.getShow);
router.get("/detail/:show_id/review", showController.getShowReview);
router.get("/show/reservation/:show_id", userAuthenticate, showController.getShowReservation);
router.get("/show/user/like", userAuthenticate, showController.getUserLikeList);
router.get("/show/user/review", userAuthenticate, showController.getUserReview);
router.get("/show/user", userAuthenticate, showController.getAllShowUser);
router.get("/show/user/reservation", userAuthenticate, showController.getUserReservation);
router.get("/show/admin/reservation/manage", adminAuthenticate, showController.getAdminReservationManage);
router.get("/show/admin/reservation/manage/:show_id", adminAuthenticate, showController.getAdminReservationManageDetail);
// router.get("/show/:show_id/user/like", userAuthenticate, showController.getUserLike);
router.post("/show/upload", adminAuthenticate, showController.uploadShow);
router.post("/show/like-add", userAuthenticate, showController.addLike);
router.post("/show/review-add", userAuthenticate, showController.addReview);
router.patch("/show/review-update", userAuthenticate, showController.updateReview);
router.put("/show/update", adminAuthenticate, showController.updateShow);
router.delete("/show/like-delete/:show_id", userAuthenticate, showController.deleteLike);
router.delete("/show/review-delete/:review_id/:show_id", userAuthenticate, showController.deleteReview);
router.delete("/show/delete/user/reservation/:user_reservation_id/:show_times_id/:orderId", userAuthenticate, showController.deleteCancelShow);
router.delete("/show/review/admin/delete/:review_id/:show_id", adminAuthenticate, showController.deleteAdminReview);
router.delete("/show/delete/:show_id", adminAuthenticate, showController.deleteShow);

module.exports = router;
