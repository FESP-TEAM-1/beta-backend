const storyDB = require("../models/story-db");

// 최신 스토리 8개 조회
exports.getStoryLimit = async (req, res) => {
  try {
    const result = await storyDB.getStoryLimit();
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

// 스토리 전체 조회
exports.getStoryAll = async (req, res) => {
  try {
    const result = await storyDB.getStoryAll();
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
