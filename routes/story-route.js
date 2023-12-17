const express = require("express");
const router = express.Router();
const storyController = require("../controllers/story-controller");
const { userAuthenticate } = require("../middleware/auth-middleware");

router.get("/storyLimit", storyController.getStoryLimit);
router.get("/storyAll", storyController.getStoryAll);
router.get("/story/user", userAuthenticate, storyController.getStoryUser);
router.post("/story/upload", userAuthenticate, storyController.postStoryUpload);
router.put("/story/update", userAuthenticate, storyController.putStoryUpdate);
router.delete("/story/delete", userAuthenticate, storyController.deleteStoryDelete);

module.exports = router;
