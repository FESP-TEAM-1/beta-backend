const showDB = require("../models/show-db");
const { v4: uuid } = require("uuid");

// 공연 필터링 조회
exports.getFilterConcerts = async (req, res) => {
  try {
    const category = req.query.category;
    const location = req.query.location;
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;
    const progress = req.query.progress;

    const result = await showDB.getFilterConcerts({
      category,
      location,
      start_date,
      end_date,
      progress,
    });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, messge: err });
  }
};

// 전시 필터링 조회
exports.getFilterExhibitions = async (req, res) => {
  try {
    const location = req.query.location;
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;
    const progress = req.query.progress;

    const result = await showDB.getFilterExhibitions({
      location,
      start_date,
      end_date,
      progress,
    });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, messge: err });
  }
};

// show_id에 따른 공연 조회
exports.getConcert = async (req, res) => {
  try {
    const { show_id } = req.params;
    const result = await showDB.getConcert({ show_id });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, messge: err });
  }
};

// show_id에 따른 전시 조회
exports.getExhibition = async (req, res) => {
  try {
    const { show_id } = req.params;
    const result = await showDB.getExhibition({ show_id });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, messge: err });
  }
};
