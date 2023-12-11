const util = require("util");
const db = require("../database/db"); // 데이터베이스 연결 설정

const query = util.promisify(db.query).bind(db);
const beginTransaction = util.promisify(db.beginTransaction).bind(db); // 트랜잭션 시작
const commit = util.promisify(db.commit).bind(db); // 트랜잭션 커밋
const rollback = util.promisify(db.rollback).bind(db); // 트랜잭션 롤백 (시작 지점으로)

// 전체 배너 이미지 조회
exports.getBannerImgs = async () => {
  try {
    const result = await query(`SELECT id, show_id, image_url FROM main_image`);
    return result;
  } catch (err) {
    throw err;
  }
};

// show_id에 따른 이미지 조회
exports.getShowImgs = async (show_id) => {
  try {
    const result = await query(`SELECT id, show_id, main_image_url, sub_images_url FROM showing WHERE id = ?`, [show_id]);
    return result;
  } catch (err) {
    throw err;
  }
};
