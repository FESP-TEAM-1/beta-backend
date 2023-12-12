const showDB = require("../models/show-db");
const { v4: uuid } = require("uuid");

// 공연 필터링 조회
exports.getConcerts = async (req, res) => {
  try {
    const category = req.query.category;
    const location = req.query.location;
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;
    const progress = req.query.progress;

    const result = await showDB.getConcerts({
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
exports.getExhibitions = async (req, res) => {
  try {
    const location = req.query.location;
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;
    const progress = req.query.progress;

    const result = await showDB.getExhibitions({
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
