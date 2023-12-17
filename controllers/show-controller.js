const showDB = require("../models/show-db");
const userDB = require("../models/user-db");
const { uploadShowImg } = require("../middleware/imageUpload");
const util = require("util");
const db = require("../database/db"); // 데이터베이스 연결 설정

const beginTransaction = util.promisify(db.beginTransaction).bind(db); // 트랜잭션 시작
const commit = util.promisify(db.commit).bind(db); // 트랜잭션 커밋
const rollback = util.promisify(db.rollback).bind(db); // 트랜잭션 롤백 (시작 지점으로)

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
exports.getShow = async (req, res) => {
  try {
    const { show_id } = req.params;
    const result = await showDB.getShow({ show_id });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, messge: err });
  }
};

exports.getShowReview = async (req, res) => {
  try {
    const { show_id } = req.params;
    const result = await showDB.getShowReview({ show_id });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, messge: err });
  }
};

// show_id에 따른 공연, 전시 예약 정보 조회
exports.getShowReservation = async (req, res) => {
  try {
    const { show_id } = req.params;
    const result = await showDB.getShowReservation({ show_id });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, messge: err });
  }
};

// 공연, 전시 등록
exports.uploadShow = [
  uploadShowImg([
    { name: "mainImage", maxCount: 1 },
    { name: "subImages", maxCount: 9 },
  ]),
  async (req, res) => {
    try {
      const mainImage = req.files.mainImage;
      const mainImageColor = req.body.main_image_color;
      const main_image_url = mainImage[0].key.replace("show/", "");

      // 트랜잭션 시작
      await beginTransaction();

      // 파일명을 기반으로 서버에서 업로드된 파일 경로 매핑
      let sub_images_url_string = null;
      if (req.files.subImages) {
        const subImages = req.files.subImages;
        const clientSubImages = JSON.parse(req.body.sub_images_url);
        const sub_images_list = Object.keys(clientSubImages)
          .map((key) => {
            const originalName = clientSubImages[key];
            const uploadedFile = subImages.find((file) => file.originalname === originalName);
            return uploadedFile ? uploadedFile.key.replace("show/", "") : null;
          })
          .filter((url) => url !== null);

        // 서버에 저장된 이미지 경로를 DB에 저장하기 위해 객체로 변환
        const sub_images_url = sub_images_list.reduce((acc, current, index) => {
          acc[index + 1] = `/show/${current}`;
          return acc;
        }, {});

        sub_images_url_string = JSON.stringify(sub_images_url);
      }

      // 공연, 전시 등록
      const insertId = await showDB.insertShow({ ...req.body, main_image_url: `/show/${main_image_url}`, sub_images_url: sub_images_url_string });

      // is_reservation이 1일 때, 공연, 전시 예약 정보 등록
      if (req.body.is_reservation === "1") {
        const { method, google_form_url, location, position, price, head_count, notice } = req.body;
        await showDB.insertShowReservation({ show_id: insertId, method, google_form_url, location, position, price, head_count, notice });
      }

      // 공연, 전시 메인 이미지 등록
      await showDB.insertMainImage({ show_id: insertId, main_image_url: `/show/${main_image_url}`, image_color: mainImageColor });

      // 트랜잭션 커밋
      await commit();

      res.status(200).json({ ok: true, data: "업로드 성공" });
    } catch (err) {
      await rollback(); // 오류 발생 시 트랜잭션 롤백
      console.log(err.message);
      res.status(500).json({ ok: false, message: err.message });
    }
  },
];

// 공연, 전시 좋아요 추가
exports.addLike = async (req, res) => {
  try {
    const { show_id, login_id } = req.body;

    const userInfo = await userDB.getMember(login_id);
    const user_id = userInfo[0].id;

    const result = await showDB.addLike({ show_id, user_id });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// 공연, 전시 좋아요 삭제
exports.deleteLike = async (req, res) => {
  try {
    const { show_id, login_id } = req.body;

    const userInfo = await userDB.getMember(login_id);
    const user_id = userInfo[0].id;

    const result = await showDB.deleteLike({ show_id, user_id });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// 공연, 전시 리뷰 등록
exports.addReview = async (req, res) => {
  try {
    const { show_id, login_id, comment } = req.body;

    const userInfo = await userDB.getMember(login_id);
    const user_id = userInfo[0].id;

    const result = await showDB.addReview({ show_id, user_id, comment });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// 공연, 전시 리뷰 수정
exports.modifyReview = async (req, res) => {
  try {
    const { review_id, show_id, login_id, comment } = req.body;

    const userInfo = await userDB.getMember(login_id);
    const user_id = userInfo[0].id;

    const result = await showDB.modifyReview({ review_id, show_id, user_id, comment });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// 공연, 전시 리뷰 삭제
exports.deleteReview = async (req, res) => {
  try {
    const { review_id, show_id, login_id } = req.body;

    const userInfo = await userDB.getMember(login_id);
    const user_id = userInfo[0].id;

    const result = await showDB.deleteReview({ review_id, show_id, user_id });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};
