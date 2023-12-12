const express = require("express");
const router = express.Router();
const imageController = require("../controllers/image-controller");

router.get("/bannerImages", imageController.getBannerImgs);
router.get("/showImage/:show_id", imageController.getShowImg);
router.get("/storyImage/:story_id", imageController.getStoryImg);

module.exports = router;
