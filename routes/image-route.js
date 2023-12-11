const express = require("express");
const router = express.Router();
const imageController = require("../controllers/image-controller");

router.get("/banner", imageController.getBannerImgs);
router.get("/show/:show_id", imageController.getShowImgs);

module.exports = router;
