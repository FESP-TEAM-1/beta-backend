const showDB = require("../models/show-db");
const userDB = require("../models/user-db");
const { uploadShowImg } = require("../middleware/imageUpload");
const { deleteFileFromS3 } = require("../middleware/imageDelete");

const util = require("util");
const db = require("../database/db"); // 데이터베이스 연결 설정
const jwt = require("../utils/jwt-util");

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
    console.error(err);
    res.status(500).json({ ok: false, messge: err });
    return;
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
    console.error(err);
    res.status(500).json({ ok: false, messge: err });
    return;
  }
};

// show_id에 따른 공연 조회
exports.getShow = async (req, res) => {
  try {
    const { show_id } = req.params;
    const accessToken = req.cookies.accessToken;
    let result;
    if (!accessToken) {
      result = await showDB.getShow({ show_id });
      if (result.length > 0 && result[0].content !== null) {
        const bufferToString = Buffer.from(result[0].content, "base64").toString("utf8");
        result[0].content = bufferToString;
      }
    } else {
      const decoded = jwt.verifyToken(accessToken);
      const user_login_id = decoded.login_id;

      const userInfo = await userDB.getMember(user_login_id);
      const user_id = userInfo[0].id;

      result = await showDB.getShowUser({ show_id, user_id });
      if (result.length > 0 && result[0].content !== null) {
        const bufferToString = Buffer.from(result[0].content, "base64").toString("utf8");
        result[0].content = bufferToString;
      }
    }

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, messge: err });
    return;
  }
};

// show_id에 따른 공연, 전시 리뷰 조회
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
    if (result.length > 0 && result[0].notice !== null) {
      const bufferToString = Buffer.from(result[0].notice, "base64").toString("utf8");
      result[0].notice = bufferToString;
    }

    const showTimes = await showDB.getShowTimes({ show_id });
    result[0].date_time = showTimes;

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, messge: err });
    return;
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
      const user_login_id = req.login_id;

      // 유저 정보 조회 user_id 가져오기
      const userInfo = await userDB.getMember(user_login_id);
      const user_id = userInfo[0].id;

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
      const insertId = await showDB.insertShow({
        ...req.body,
        user_id,
        main_image_url: `/show/${main_image_url}`,
        sub_images_url: sub_images_url_string,
      });

      // is_reservation이 1일 때, 공연, 전시 예약 정보 등록
      if (req.body.is_reservation === "1") {
        const { method, google_form_url, location, position, price, head_count, notice } = req.body;
        await showDB.insertShowReservation({ show_id: insertId, method, google_form_url, location, position, price, head_count, notice });

        // method가 agency일 때, 회차 등록
        if (method === "agency") {
          const { date_time } = req.body;
          const stringToJSON = JSON.parse(date_time);
          for (const value of Object.values(stringToJSON)) {
            await showDB.insertShowTimes({ show_id: insertId, date_time: value, head_count });
          }
        }
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
      return;
    }
  },
];

// 공연, 전시 좋아요 추가
exports.addLike = async (req, res) => {
  try {
    const { show_id } = req.body;
    const user_login_id = req.login_id;

    // 유저 정보 조회 user_id 가져오기
    const userInfo = await userDB.getMember(user_login_id);
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
    const { show_id } = req.params;
    const user_login_id = req.login_id;

    // 유저 정보 조회 user_id 가져오기
    const userInfo = await userDB.getMember(user_login_id);
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
    const { show_id, comment } = req.body;
    const user_login_id = req.login_id;

    // 유저 정보 조회 user_id 가져오기
    const userInfo = await userDB.getMember(user_login_id);
    const user_id = userInfo[0].id;

    const result = await showDB.addReview({ show_id, user_id, comment });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// 공연, 전시 리뷰 수정
exports.updateReview = async (req, res) => {
  try {
    const { review_id, show_id, comment } = req.body;

    const user_login_id = req.login_id;

    // 유저 정보 조회 user_id 가져오기
    const userInfo = await userDB.getMember(user_login_id);
    const user_id = userInfo[0].id;

    const result = await showDB.updateReview({ review_id, show_id, user_id, comment });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// 공연, 전시 리뷰 삭제
exports.deleteReview = async (req, res) => {
  try {
    const { review_id, show_id } = req.params;
    const user_login_id = req.login_id;

    // 유저 정보 조회 user_id 가져오기
    const userInfo = await userDB.getMember(user_login_id);
    const user_id = userInfo[0].id;

    const result = await showDB.deleteReview({ review_id, show_id, user_id });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// 마이페이지 - 유저 공연, 전시 좋아요 조회
exports.getUserLikeList = async (req, res) => {
  try {
    const user_login_id = req.login_id;

    // 유저 정보 조회 user_id 가져오기
    const userInfo = await userDB.getMember(user_login_id);
    const user_id = userInfo[0].id;
    const result = await showDB.getUserLikeList({ user_id });
    if (result.length > 0 && result[0].content !== null) {
      const bufferToString = Buffer.from(result[0].content, "base64").toString("utf8");
      result[0].content = bufferToString;
    }

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// 마이페이지 - 유저 공연, 전시 리뷰 조회
exports.getUserReview = async (req, res) => {
  try {
    const user_login_id = req.login_id;

    // 유저 정보 조회 user_id 가져오기
    const userInfo = await userDB.getMember(user_login_id);
    const user_id = userInfo[0].id;

    const result = await showDB.getUserReview({ user_id });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

exports.updateShow = [
  uploadShowImg([
    { name: "mainImage", maxCount: 1 },
    { name: "subImages", maxCount: 9 },
  ]),
  async (req, res) => {
    try {
      const user_login_id = req.login_id;

      // 유저 정보 조회 user_id 가져오기
      const userInfo = await userDB.getMember(user_login_id);
      const user_id = userInfo[0].id;

      // 기존 공연, 전시 정보 조회
      const showInfo = await showDB.getShowWithUser({ show_id: req.body.show_id, user_id });
      if (showInfo.length === 0) {
        res.status(404).json({ ok: false, message: "공연, 전시 정보가 존재하지 않습니다." });
        return;
      }

      // 트랜잭션 시작
      await beginTransaction();

      // 메인 이미지 업데이트
      let main_image_url = showInfo[0].main_image_url;
      if (req.files.mainImage) {
        main_image_url = `/${req.files.mainImage[0].key}`;
        if (showInfo[0].main_image_url) {
          await deleteFileFromS3(showInfo[0].main_image_url.slice(1));
        }
      }

      // // 서브 이미지 업데이트
      // let sub_images_url_string = showInfo[0].sub_images_url;
      // if (req.files.subImages) {
      //   const subImages = req.files.subImages;
      //   const clientSubImages = JSON.parse(req.body.sub_images_url);

      //   // 기존 서브 이미지 목록
      //   const existingSubImages = JSON.parse(showInfo[0].sub_images_url);
      //   const sub_images_list = Object.keys(clientSubImages).map((key) => {
      //     const originalName = clientSubImages[key];
      //     const uploadedFile = subImages.find((file) => file.originalname === originalName);
      //     return uploadedFile ? uploadedFile.key.replace("show/", "") : existingSubImages[key];
      //   });

      //   // 서버에 저장된 이미지 경로를 DB에 저장하기 위해 객체로 변환
      //   const sub_images_url = sub_images_list.reduce((acc, current, index) => {
      //     acc[index + 1] = `/show/${current}`;
      //     return acc;
      //   }, {});

      //   sub_images_url_string = JSON.stringify(sub_images_url);

      //   // 기존 서브 이미지 중 변경된 이미지 삭제
      //   Object.values(existingSubImages).forEach(async (url, index) => {
      //     if (!sub_images_list.includes(url.replace("/show/", ""))) {
      //       await deleteFileFromS3(url.slice(1));
      //     }
      //   });
      // }

      let sub_images_url_string = req.body.sub_images_url;
      if (req.files.subImages) {
        const subImages = req.files.subImages;
        const formSubImages = JSON.parse(req.body.sub_images_url);

        const sub_images_list = Object.keys(formSubImages).map((key) => {
          const formImageName = formSubImages[key];
          const newFile = subImages.find((file) => file.originalname === formImageName);

          return newFile ? `/${newFile.key}` : formImageName;
        });

        const sub_images_url = sub_images_list.reduce((acc, current, index) => {
          acc[index + 1] = current;
          return acc;
        }, {});

        sub_images_url_string = JSON.stringify(sub_images_url);
      }

      // 공연, 전시 업데이트
      await showDB.updateShow({
        ...req.body,
        main_image_url,
        sub_images_url: sub_images_url_string,
      });

      // is_reservation이 1일 때, 공연, 전시 예약 정보 업데이트
      if (req.body.is_reservation === "1") {
        const { method, google_form_url, location, position, price, head_count, notice } = req.body;
        const s_info = await showDB.getShowReservationInfo({ show_id: req.body.show_id });
        if (s_info.length > 0) {
          await showDB.updateShowReservation({
            show_id: req.body.show_id,
            method,
            google_form_url,
            location,
            position,
            price,
            head_count,
            notice,
          });
        } else {
          await showDB.insertShowReservation({ show_id: req.body.show_id, method, google_form_url, location, position, price, head_count, notice });
        }

        // method가 agency일 때, 회차 업데이트
        if (method === "agency") {
          const { date_time } = req.body;
          const stringToJSON = JSON.parse(date_time);
          const s_times = await showDB.getShowTimes({ show_id: req.body.show_id });
          if (s_times.length === 0) {
            for (const value of Object.values(stringToJSON)) {
              await showDB.insertShowTimes({ show_id: req.body.show_id, date_time: value, head_count });
            }
          } else {
            for (const value of Object.values(stringToJSON)) {
              await showDB.updateShowTimes({ show_id: req.body.show_id, date_time: value, head_count });
            }
          }
        }
      }

      await commit();

      res.status(200).json({ ok: true, data: "업데이트 성공" });
    } catch (err) {
      await rollback(); // 오류 발생 시 트랜잭션 롤백
      console.log(err.message);
      res.status(500).json({ ok: false, message: err.message });
      return;
    }
  },
];

exports.deleteShow = async (req, res) => {
  try {
    const { show_id } = req.params;
    const user_login_id = req.login_id;

    const userInfo = await userDB.getMember(user_login_id);
    const user_id = userInfo[0].id;

    // 기존 공연, 전시 정보 조회
    const showInfo = await showDB.getShowWithUser({ show_id: show_id, user_id });
    if (showInfo.length === 0) {
      res.status(404).json({ ok: false, message: "공연, 전시 정보가 존재하지 않습니다." });
      return;
    }

    const main_image_url = showInfo[0].main_image_url;
    const sub_images_url = showInfo[0].sub_images_url;

    // 메인 이미지 삭제
    await deleteFileFromS3(main_image_url.slice(1));

    // 서브 이미지 삭제
    const subImages = JSON.parse(sub_images_url);
    Object.values(subImages).forEach(async (url) => {
      await deleteFileFromS3(url.slice(1));
    });

    // 공연, 전시 삭제
    await showDB.deleteShow({ show_id, user_id });

    res.status(200).json({ ok: true, data: "삭제 성공" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ ok: false, message: err.message });
  }
};

exports.getUserLike = async (req, res) => {
  try {
    const { show_id } = req.params;
    const user_login_id = req.login_id;

    const userInfo = await userDB.getMember(user_login_id);
    const user_id = userInfo[0].id;

    const result = await showDB.getUserLike({ show_id, user_id });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    console.log(err);
    res.status(500).json({ ok: false, message: err.message });
  }
};

exports.getAllShowUser = async (req, res) => {
  try {
    const user_login_id = req.login_id;

    const userInfo = await userDB.getMember(user_login_id);
    const user_id = userInfo[0].id;

    const result = await showDB.getAllShowUser({ user_id });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    console.log(err);
    res.status(500).json({ ok: false, message: err.message });
  }
};

exports.getAdminReservationManage = async (req, res) => {
  try {
    const user_login_id = req.login_id;

    const userInfo = await userDB.getMember(user_login_id);
    const user_id = userInfo[0].id;

    const result = await showDB.getAdminReservationManage({ user_id });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    console.log(err);
    res.status(500).json({ ok: false, message: err.message });
  }
};

exports.getAdminReservationManageDetail = async (req, res) => {
  try {
    const { show_id } = req.params;
    const { result, result2, result3 } = await showDB.getAdminReservationManageDetail({ show_id });

    res.status(200).json({ ok: true, data: { show_reservation_info: result, user_reservation: result2, show_times: result3 } });
  } catch (err) {
    console.log(err);
    res.status(500).json({ ok: false, message: err.message });
  }
};

exports.deleteAdminReview = async (req, res) => {
  try {
    const { review_id, show_id } = req.params;
    const result = await showDB.deleteAdminReview({ review_id, show_id });
    res.status(200).json({ ok: true, data: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ ok: false, message: err.message });
  }
};
