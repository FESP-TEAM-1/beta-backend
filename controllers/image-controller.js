const imageDB = require("../models/image-db");

// 배너 이미지 조회
exports.getBannerImgs = async (req, res) => {
  try {
    const result = await imageDB.getBannerImgs();
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

// show_id에 따른 이미지 조회
exports.getShowImgs = async (req, res) => {
  try {
    const { show_id } = req.params;
    const result = await imageDB.getShowImgs(show_id);
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

// story_id에 따른 이미지 조회
exports.getStoryImgs = async (req, res) => {
  try {
    const { story_id } = req.params;
    const result = await imageDB.getStoryImgs(story_id);
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
