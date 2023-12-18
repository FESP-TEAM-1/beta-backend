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

// show_id, user_id에 따른 공연 조회
exports.getShowWithUser = async ({ show_id, user_id }) => {
  try {
    const result = await query(`SELECT * FROM showing WHERE id = ? AND user_id = ?`, [show_id, user_id]);
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
    const result = await query(`SELECT * FROM show_reservation_info WHERE show_id = ?`, [show_id]);
    return result;
  } catch (err) {
    throw err;
  }
};

exports.insertShow = async ({ ...args }) => {
  const {
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
      `INSERT INTO showing (show_type, show_sub_type, title, start_date, end_date, location, location_detail, position, main_image_url, main_image_color, sub_images_url, univ, department, tags, content, is_reservation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    const res = await query(`SELECT * FROM user_likes WHERE user_id = ? ORDER BY created_at DESC`, [user_id]);

    return res;
  } catch (err) {
    throw err;
  }
};

// 마이페이지 - 유저 공연, 전시 리뷰 조회
exports.getUserReview = async ({ ...args }) => {
  const { user_id } = args;

  try {
    const res = await query(`SELECT * FROM user_reviews WHERE user_id = ? ORDER BY updated_at DESC`, [user_id]);

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
