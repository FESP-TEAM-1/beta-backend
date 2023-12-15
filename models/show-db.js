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
    const result = await query(`SELECT * FROM showing WHERE id = ?`, [show_id]);
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
      `INSERT INTO showing (show_type, show_sub_type, title, start_date, end_date, location, location_detail, position, main_image_url, main_image_color, sub_images_url, univ, department, tags, content, is_reservation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

exports.insertMainImage = async ({ ...args }) => {
  const { show_id, main_image_url, image_color } = args;

  try {
    const res = await query(`INSERT INTO banner_image (show_id, image_url, image_color) VALUES (?, ?, ?)`, [show_id, main_image_url, image_color]);

    return true;
  } catch (err) {
    throw err;
  }
};
