const storyDB = require("../models/story-db");
const userDB = require("../models/user-db");
const { uploadStoryImg } = require("../middleware/imageUpload");

// 최신 스토리 8개 조회
exports.getStoryLimit = async (req, res) => {
  try {
    const result = await storyDB.getStoryLimit();
    res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      messge: err,
    });
    return;
  }
};

// 스토리 전체 조회
exports.getStoryAll = async (req, res) => {
  try {
    const result = await storyDB.getStoryAll();
    res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      messge: err,
    });
    return;
  }
};

// 스토리 업로드
exports.postStoryUpload = [
  uploadStoryImg.single("story_image_url"),
  async (req, res) => {
    try {
      const { login_id, tags, story_color } = req.body;

      const userInfo = await userDB.getMember(login_id);

      const user_id = userInfo[0].id;
      const story_image_url = `/${req.file.key}`;

      await storyDB.postStoryUpload({
        user_id,
        story_image_url,
        tags,
        story_color,
      });

      res.status(200).json({
        ok: true,
        data: "업로드 성공",
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        ok: false,
        message: err,
      });
      return;
    }
  },
];
