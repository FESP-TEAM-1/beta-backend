const express = require("express");
const router = express.Router();
const storyController = require("../controllers/story-controller");
const { storyAuthenticate } = require("../middleware/auth-middleware");

router.get("/storyLimit", storyController.getStoryLimit);
router.get("/storyAll", storyController.getStoryAll);
router.post("/story/upload", storyAuthenticate, storyController.postStoryUpload);

module.exports = router;
