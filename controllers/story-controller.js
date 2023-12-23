const storyDB = require("../models/story-db");
const userDB = require("../models/user-db");
const { uploadStoryImg } = require("../middleware/imageUpload");
const { deleteFileFromS3 } = require("../middleware/imageDelete");

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

exports.getStoryUser = async (req, res) => {
  try {
    const user_login_id = req.login_id;
    const userInfo = await userDB.getMember(user_login_id);
    const user_id = userInfo[0].id;

    const result = await storyDB.getStoryUser({ user_id });
    res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      messge: err,
    });
  }
};

// 스토리 업로드
exports.postStoryUpload = [
  uploadStoryImg.single("story_image_url"),
  async (req, res) => {
    try {
      const { login_id, tags, story_color } = req.body;
      const user_login_id = req.login_id;

      const userInfo = await userDB.getMember(user_login_id);

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

// 스토리 수정
exports.putStoryUpdate = [
  uploadStoryImg.single("story_image_url"),
  async (req, res) => {
    try {
      const { story_id, tags, story_color } = req.body;
      const user_login_id = req.login_id;

      // 유저 정보 조회 user_id 가져오기
      const userInfo = await userDB.getMember(user_login_id);
      const user_id = userInfo[0].id;

      // 기존 스토리 정보 조회
      const storyInfo = await storyDB.getStory({ story_id, user_id });
      if (storyInfo.length === 0) {
        res.status(404).json({
          ok: false,
          message: "수정할 스토리를 찾을 수 없습니다.",
        });
        return;
      }

      // 기본 값은 기본 이미지
      let new_story_image_url = storyInfo[0].story_image_url;

      // 새로운 이미지가 있으면 기존 이미지 삭제 후 새로운 이미지로 변경
      if (req.file) {
        new_story_image_url = `/${req.file.key}`;
        if (storyInfo[0].story_image_url) {
          await deleteFileFromS3(storyInfo[0].story_image_url.slice(1));
        }
      }

      // 스토리 업데이트
      await storyDB.putStoryUpdate({
        story_id,
        user_id,
        story_image_url: new_story_image_url,
        tags,
        story_color,
      });

      res.status(200).json({
        ok: true,
        data: "업데이트 성공",
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        ok: false,
        message: err,
      });
    }
  },
];

// 스토리 삭제
exports.deleteStoryDelete = async (req, res) => {
  try {
    const { story_id, login_id } = req.params;
    const user_login_id = req.login_id;

    const userInfo = await userDB.getMember(user_login_id);
    const user_id = userInfo[0].id;

    if (user_login_id !== login_id) {
      res.status(401).json({
        ok: false,
        message: "삭제 권한이 없습니다.",
      });
      return;
    }

    const storyInfo = await storyDB.getStory({ story_id, user_id });
    if (storyInfo.length === 0) {
      res.status(404).json({
        ok: false,
        message: "삭제할 스토리를 찾을 수 없습니다.",
      });
      return;
    }

    const story_image_url = storyInfo[0].story_image_url;

    await storyDB.deleteStoryDelete({ story_id, user_id });
    await deleteFileFromS3(story_image_url.slice(1));

    res.status(200).json({
      ok: true,
      data: "삭제 성공",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      ok: false,
      message: err,
    });
  }
};
