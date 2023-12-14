const express = require("express");
const router = express.Router();
const storyController = require("../controllers/story-controller");

router.get("/storyLimit", storyController.getStoryLimit);
router.get("/storyAll", storyController.getStoryAll);
router.post("/story-upload", storyController.postStoryUpload);

module.exports = router;
