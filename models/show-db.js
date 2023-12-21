const util = require("util");
const db = require("../database/db"); // 데이터베이스 연결 설정
const filterShow = require("../utils/filterShow"); // 공연 필터링 함수

const query = util.promisify(db.query).bind(db);
const beginTransaction = util.promisify(db.beginTransaction).bind(db); // 트랜잭션 시작
const commit = util.promisify(db.commit).bind(db); // 트랜잭션 커밋
const rollback = util.promisify(db.rollback).bind(db); // 트랜잭션 롤백 (시작 지점으로)

// 공연 필터링 조회
exports.getFilterConcerts = async ({ location, start_date, end_date, progress, category }) => {
  try {
    const { queryValue, queryParams } = filterShow("공연", { location, start_date, end_date, progress, category });

    const result = await query(queryValue, queryParams);
    return result;
  } catch (err) {
    throw err;
  }
};

// 전시 필터링 조회
exports.getFilterExhibitions = async ({ location, start_date, end_date, progress }) => {
  try {
    const { queryValue, queryParams } = filterShow("전시", { location, start_date, end_date, progress });

    const result = await query(queryValue, queryParams);
    return result;
  } catch (err) {
    throw err;
  }
};

// show_id에 따른 공연 조회
exports.getShow = async ({ show_id }) => {
  try {
    const result = await query(
      `SELECT s.*, COUNT(ul.show_id) AS likes_count FROM showing AS s LEFT JOIN user_likes AS ul ON s.id = ul.show_id WHERE s.id = ?`,
      [show_id]
    );
    return result;
  } catch (err) {
    throw err;
  }
};

exports.getShowUser = async ({ user_id, show_id }) => {
  try {
    const result = await query(
      `SELECT
        s.*,
        COUNT(ul_all.show_id) AS likes_count,
        CASE
          WHEN ul_user.user_id IS NOT NULL THEN TRUE
          ELSE FALSE
        END AS user_liked,
        CASE
          WHEN ur.user_id IS NOT NULL THEN TRUE
          ELSE FALSE
        END AS user_reserved
      FROM
        showing AS s
      LEFT JOIN
        user_likes AS ul_all ON s.id = ul_all.show_id
      LEFT JOIN
        user_likes AS ul_user ON s.id = ul_user.show_id AND ul_user.user_id = ?
      LEFT JOIN
        user_reservation AS ur ON s.id = ur.show_id AND ur.user_id = ?
      WHERE
        s.id = ?
      GROUP BY
        s.id;
      ;`,
      [user_id, user_id, show_id]
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// show_id, user_id에 따른 공연 조회
exports.getShowWithUser = async ({ show_id, user_id }) => {
  try {
    const result = await query(`SELECT * FROM showing WHERE id = ? AND user_id = ?`, [show_id, user_id]);
    return result;
  } catch (err) {
    throw err;
  }
};

// user_id에 따른 show 조회
exports.getAllShowUser = async ({ user_id }) => {
  try {
    const result = await query(
      `SELECT 
          s.*, 
          COALESCE(ul.likes_count, 0) AS likes_count,
          COALESCE(ur.reviews_count, 0) AS reviews_count
        FROM 
          showing AS s
        LEFT JOIN 
          (SELECT show_id, COUNT(*) AS likes_count FROM user_likes GROUP BY show_id) AS ul 
          ON s.id = ul.show_id
        LEFT JOIN 
          (SELECT show_id, COUNT(*) AS reviews_count FROM user_reviews GROUP BY show_id) AS ur 
          ON s.id = ur.show_id
        WHERE 
          s.user_id = ?`,
      [user_id]
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// show_id에 따른 공연 리뷰 조회
exports.getShowReview = async ({ show_id }) => {
  try {
    const result = await query(
      `SELECT a.*, b.login_id FROM BETA_DATABASE.user_reviews as a left join BETA_DATABASE.user as b on a.user_id = b.id where a.show_id = ? ORDER BY created_at DESC`,
      [show_id]
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// show_id에 따른 공연, 전시 예약 정보 조회
exports.getShowReservation = async ({ show_id }) => {
  try {
    const result = await query(
      `SELECT a.*, b.title AS title FROM show_reservation_info AS a LEFT JOIN showing AS b ON a.show_id = b.id WHERE show_id = ?;`,
      [show_id]
    );
    return result;
  } catch (err) {
    throw err;
  }
};

exports.insertShow = async ({ ...args }) => {
  const {
    user_id,
    show_type,
    show_sub_type,
    title,
    start_date,
    end_date,
    location,
    location_detail,
    position,
    main_image_url,
    main_image_color,
    sub_images_url,
    univ,
    department,
    tags,
    content,
    is_reservation,
  } = args;

  try {
    const res = await query(
      `INSERT INTO showing (user_id, show_type, show_sub_type, title, start_date, end_date, location, location_detail, position, main_image_url, main_image_color, sub_images_url, univ, department, tags, content, is_reservation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        show_type,
        show_sub_type,
        title,
        start_date,
        end_date,
        location,
        location_detail,
        position,
        main_image_url,
        main_image_color,
        sub_images_url,
        univ,
        department,
        tags,
        content,
        is_reservation,
      ]
    );

    return res.insertId;
  } catch (err) {
    throw err;
  }
};

exports.insertShowReservation = async ({ ...args }) => {
  const { show_id, method, google_form_url, location, position, price, head_count, notice } = args;

  try {
    const res = await query(
      `INSERT INTO show_reservation_info (show_id, method, google_form_url, location, position, price, head_count, notice) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [show_id, method, google_form_url, location, position, price, head_count, notice]
    );

    return true;
  } catch (err) {
    throw err;
  }
};

exports.insertShowTimes = async ({ ...args }) => {
  const { show_id, date_time, head_count } = args;

  try {
    const res = await query(`INSERT INTO show_times (show_id, date_time, head_count) VALUES (?, ?, ?)`, [show_id, date_time, head_count]);

    return true;
  } catch (err) {
    throw err;
  }
};

exports.insertMainImage = async ({ ...args }) => {
  const { show_id, main_image_url, image_color } = args;

  try {
    const res = await query(`INSERT INTO banner_image (show_id, image_url, image_color) VALUES (?, ?, ?)`, [show_id, main_image_url, image_color]);

    return true;
  } catch (err) {
    throw err;
  }
};

// 좋아요 추가
exports.addLike = async ({ ...args }) => {
  const { show_id, user_id } = args;

  try {
    const res = await query(`INSERT INTO user_likes (show_id, user_id) VALUES (?, ?)`, [show_id, user_id]);

    return true;
  } catch (err) {
    throw err;
  }
};

// 좋아요 삭제
exports.deleteLike = async ({ ...args }) => {
  const { show_id, user_id } = args;

  try {
    const res = await query(`DELETE FROM user_likes WHERE show_id = ? AND user_id = ?`, [show_id, user_id]);

    return true;
  } catch (err) {
    throw err;
  }
};

// 리뷰 등록
exports.addReview = async ({ ...args }) => {
  const { show_id, user_id, comment } = args;

  try {
    const res = await query(`INSERT INTO user_reviews (show_id, user_id, comment) VALUES (?, ?, ?)`, [show_id, user_id, comment]);

    return true;
  } catch (err) {
    throw err;
  }
};

// 리뷰 수정
exports.updateReview = async ({ ...args }) => {
  const { review_id, show_id, user_id, comment } = args;

  try {
    const res = await query(`UPDATE user_reviews SET comment = ? WHERE id = ? AND show_id = ? AND user_id = ?`, [
      comment,
      review_id,
      show_id,
      user_id,
    ]);

    return true;
  } catch (err) {
    throw err;
  }
};

// 리뷰 삭제
exports.deleteReview = async ({ ...args }) => {
  const { review_id, show_id, user_id } = args;

  try {
    const res = await query(`DELETE FROM user_reviews WHERE id = ? AND show_id = ? AND user_id = ?`, [review_id, show_id, user_id]);

    return true;
  } catch (err) {
    throw err;
  }
};

// 마이페이지 - 유저 공연, 전시 좋아요 조회
exports.getUserLikeList = async ({ ...args }) => {
  const { user_id } = args;

  try {
    const res = await query(
      `SELECT b.* FROM user_likes AS a LEFT JOIN showing AS b ON a.show_id = b.id WHERE a.user_id = ? ORDER BY a.created_at DESC`,
      [user_id]
    );

    return res;
  } catch (err) {
    throw err;
  }
};

// 마이페이지 - 유저 공연, 전시 리뷰 조회
exports.getUserReview = async ({ ...args }) => {
  const { user_id } = args;

  try {
    const res = await query(
      `SELECT 
          r.*, 
          s.title, 
          u.login_id 
        FROM 
          BETA_DATABASE.user_reviews as r
        left join  
          BETA_DATABASE.showing as s on r.show_id = s.id
        left join
          BETA_DATABASE.user as u on r.user_id = u.id
        WHERE r.user_id = ? ORDER BY created_at DESC`,
      [user_id]
    );

    return res;
  } catch (err) {
    throw err;
  }
};

exports.updateShow = async ({ ...args }) => {
  const {
    show_id,
    show_type,
    show_sub_type,
    title,
    start_date,
    end_date,
    location,
    location_detail,
    position,
    main_image_url,
    main_image_color,
    sub_images_url,
    univ,
    department,
    tags,
    content,
    is_reservation,
  } = args;

  try {
    const res = await query(
      `UPDATE showing SET show_type = ?, show_sub_type = ?, title = ?, start_date = ?, end_date = ?, location = ?, location_detail = ?, position = ?, main_image_url = ?, main_image_color = ?, sub_images_url = ?, univ = ?, department = ?, tags = ?, content = ?, is_reservation = ? WHERE id = ?`,
      [
        show_type,
        show_sub_type,
        title,
        start_date,
        end_date,
        location,
        location_detail,
        position,
        main_image_url,
        main_image_color,
        sub_images_url,
        univ,
        department,
        tags,
        content,
        is_reservation,
        show_id,
      ]
    );

    return true;
  } catch (err) {
    throw err;
  }
};

exports.updateShowReservation = async ({ ...args }) => {
  const { show_id, method, google_form_url, location, position, price, head_count, notice } = args;

  try {
    const res = await query(
      `UPDATE show_reservation_info SET method = ?, google_form_url = ?, location = ?, position = ?, price = ?, head_count = ?, notice = ? WHERE show_id = ?`,
      [method, google_form_url, location, position, price, head_count, notice, show_id]
    );

    return true;
  } catch (err) {
    throw err;
  }
};

exports.updateShowTimes = async ({ ...args }) => {
  const { show_id, date_time, head_count } = args;

  try {
    const res = await query(`UPDATE show_times SET head_count = ?, date_time = ? WHERE show_id = ?`, [head_count, date_time, show_id]);

    return true;
  } catch (err) {
    throw err;
  }
};

exports.deleteShow = async ({ ...args }) => {
  const { show_id, user_id } = args;

  try {
    const res = await query(`DELETE FROM showing WHERE id = ? AND user_id = ?`, [show_id, user_id]);

    return true;
  } catch (err) {
    throw err;
  }
};

// 마이페이지 - 유저 공연, 전시 좋아요 조회
exports.getUserLike = async ({ ...args }) => {
  const { show_id, user_id } = args;

  try {
    const res = await query(`SELECT * FROM user_likes WHERE show_id = ? AND user_id = ?`, [show_id, user_id]);

    return res;
  } catch (err) {
    throw err;
  }
};

// 회차 정보 조회
exports.getShowTimes = async ({ show_id }) => {
  try {
    const result = await query(`SELECT * FROM show_times WHERE show_id = ?`, [show_id]);
    return result;
  } catch (err) {
    throw err;
  }
};

// 회차에 따른 좌석 정보 조회 (예약 가능한 좌석)
exports.getEnableTime = async ({ show_times_id }) => {
  try {
    const result = await query(`SELECT id, CASE WHEN head_count > 0 THEN true ELSE false END as result FROM show_times WHERE id = ?;`, [
      show_times_id,
    ]);
    return result;
  } catch (err) {
    throw err;
  }
};

exports.getShowReservationInfo = async ({ show_id }) => {
  try {
    const result = await query(`select * from show_reservation_info where show_id = ?`, [show_id]);
    return result;
  } catch (err) {
    throw err;
  }
};

// user_id에 따른 show 조회
exports.getAdminReservationManage = async ({ user_id }) => {
  try {
    const result = await query(`SELECT * FROM showing WHERE user_id = ?`, [user_id]);
    return result;
  } catch (err) {
    throw err;
  }
};

// show_id에 따른 show_times, user_reservation 조회
exports.getAdminReservationManageDetail = async ({ show_id }) => {
  try {
    // show_reservation_info에서 head_count 가져오기
    const result = await query(`select head_count from show_reservation_info where show_id = ?`, [show_id]);

    // user_reservation 가져오기
    const result2 = await query(`select * from user_reservation where show_id = ?`, [show_id]);

    // show_times 가져오기
    const result3 = await query(`select * from show_times where show_id = ?`, [show_id]);

    return { result, result2, result3 };
  } catch (err) {
    throw err;
  }
};
