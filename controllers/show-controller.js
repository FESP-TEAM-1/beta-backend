const showDB = require("../models/show-db");
const userDB = require("../models/user-db");
const imageDB = require("../models/image-db");
const { uploadShowImg } = require("../middleware/imageUpload");
const { deleteFileFromS3 } = require("../middleware/imageDelete");
const { authenticateToken } = require("../middleware/auth-middleware");
const { payCancelFunc } = require("./pay-controller");

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
    let result;

    // 로그인을 했을 경우
    if (await authenticateToken(req, res)) {
      const user_login_id = req.login_id;

      const userInfo = await userDB.getMember(user_login_id);
      const user_id = userInfo[0].id;

      result = await showDB.getShowUser({ show_id, user_id });
      if (result.length > 0 && result[0].content !== null) {
        const bufferToString = Buffer.from(result[0].content, "base64").toString("utf8");
        result[0].content = bufferToString;
      }
    }
    // 로그인을 하지 않았거나 refreshToken이 만료 됐을 경우
    else {
      result = await showDB.getShow({ show_id });
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
        res.status(400).json({ ok: false, message: "공연, 전시 정보가 존재하지 않습니다." });
        return;
      }

      // 트랜잭션 시작
      await beginTransaction();

      // 메인 이미지 업데이트
      let main_image_url = showInfo[0].main_image_url;
      if (req.files.mainImage) {
        main_image_url = `/${req.files.mainImage[0].key}`;
        if (showInfo[0].main_image_url) {
          await imageDB.updateBannerImage({
            show_id: req.body.show_id,
            banner_image_url: main_image_url,
            banner_image_color: req.body.main_image_color,
          });
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

          return newFile ? `/${newFile.key}` : `/show/${formImageName}`;
        });

        const sub_images_url = sub_images_list.reduce((acc, current, index) => {
          acc[index + 1] = current;
          return acc;
        }, {});

        sub_images_url_string = JSON.stringify(sub_images_url);
      } else {
        const formSubImages = JSON.parse(req.body.sub_images_url);
        const sub_images_list = Object.keys(formSubImages).map((key) => {
          const formImageName = formSubImages[key];
          return `/show/${formImageName}`;
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
          const reqTimes = JSON.parse(date_time);
          const dbTimes = await showDB.getShowTimes({ show_id: req.body.show_id });

          // 기존 회차 중 변경된 회차 삭제
          const transformDbTimes = dbTimes.map((item) => {
            return { [item.id]: item.date_time };
          });
          const s_times_json = Object.assign({}, ...transformDbTimes);
          const deleteTimes = Object.keys(s_times_json).filter((item) => !Object.values(reqTimes).includes(s_times_json[item]));
          if (deleteTimes.length > 0) {
            for (const show_times_id of deleteTimes) {
              await showDB.deleteShowTimes({ show_id: req.body.show_id, show_times_id });
            }
          }

          // 기존 회차 중 변경된 회차 업데이트
          if (dbTimes.length === 0) {
            // 기존 회차가 없을 때, 새로운 회차 추가
            for (const value of Object.values(reqTimes)) {
              await showDB.insertShowTimes({ show_id: req.body.show_id, date_time: value, head_count });
            }
          } else {
            // 기존 회차가 있을 때, 새로운 회차 추가 및 기존 회차 업데이트
            for (const [key, value] of Object.entries(reqTimes)) {
              if (key.includes("new")) {
                await showDB.insertShowTimes({ show_id: req.body.show_id, date_time: value, head_count });
              } else {
                await showDB.updateShowTimes({ show_id: req.body.show_id, date_time: value, show_times_id: key, head_count });
              }
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
      res.status(400).json({ ok: false, message: "공연, 전시 정보가 존재하지 않습니다." });
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
    await imageDB.deleteBannerImage({ show_id });

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

exports.getAllShowAdmin = async (req, res) => {
  try {
    const user_login_id = req.login_id;

    const userInfo = await userDB.getMember(user_login_id);
    const user_id = userInfo[0].id;

    const result = await showDB.getAllShowAdmin({ user_id });

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

exports.getUserReservation = async (req, res) => {
  try {
    const user_login_id = req.login_id;

    const userInfo = await userDB.getMember(user_login_id);
    const user_id = userInfo[0].id;

    const result = await showDB.getUserReservation({ user_id });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    console.log(err);
    res.status(500).json({ ok: false, message: err.message });
  }
};

exports.deleteCancelShow = async (req, res) => {
  try {
    const { user_reservation_id, show_times_id, orderId } = req.params;
    const user_login_id = req.login_id;

    // 트랜잭션 시작
    await beginTransaction();

    const userInfo = await userDB.getMember(user_login_id);
    const user_id = userInfo[0].id;

    const getUserReservationDetail = await showDB.getUserReservationDetail({ user_id, user_reservation_id, orderId });
    if (getUserReservationDetail.length === 0) {
      res.status(400).json({ ok: false, message: "예약 정보가 존재하지 않습니다." });
      return;
    }
    const paymentKey = getUserReservationDetail[0].paymentKey;

    // 토스페이먼츠 결제 취소 로직
    if (paymentKey) await payCancelFunc(paymentKey, "예매 취소");
    // db 삭제
    await showDB.deleteCancelShow({ user_id, user_reservation_id, show_times_id });

    // 트랜잭션 커밋
    await commit();

    res.status(200).json({ ok: true, data: true });
  } catch (err) {
    console.log(err);
    await rollback(); // 오류 발생 시 트랜잭션 롤백
    res.status(500).json({ ok: false, message: err.message });
  }
};
