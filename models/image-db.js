const util = require("util");
const db = require("../database/db"); // 데이터베이스 연결 설정

const query = util.promisify(db.query).bind(db);
const beginTransaction = util.promisify(db.beginTransaction).bind(db); // 트랜잭션 시작
const commit = util.promisify(db.commit).bind(db); // 트랜잭션 커밋
const rollback = util.promisify(db.rollback).bind(db); // 트랜잭션 롤백 (시작 지점으로)

// 전체 배너 이미지 조회
exports.getBannerImgs = async () => {
  try {
    const result = await query(
      `SELECT 
        bi.* 
      FROM banner_image AS bi 
      JOIN showing AS s ON bi.show_id = s.id 
      WHERE s.end_date >= DATE_FORMAT(CURRENT_DATE(), '%Y-%m-%d') 
      ORDER BY bi.updated_at DESC LIMIT 5`
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// show_id에 따른 이미지 조회
exports.getShowImg = async (show_id) => {
  try {
    const result = await query(`SELECT id, main_image_url, sub_images_url FROM showing WHERE id = ?`, [show_id]);
    return result;
  } catch (err) {
    throw err;
  }
};

// story_id에 따른 이미지 조회
exports.getStoryImg = async (story_id) => {
  try {
    const result = await query(`SELECT id, story_image_url FROM story WHERE id = ?`, [story_id]);
    return result;
  } catch (err) {
    throw err;
  }
};

exports.updateBannerImage = async ({ show_id, banner_image_url, banner_image_color }) => {
  try {
    const result = await query(`UPDATE banner_image SET image_url = ?, image_color = ? WHERE show_id = ?`, [
      banner_image_url,
      banner_image_color,
      show_id,
    ]);
    return result;
  } catch (err) {
    throw err;
  }
};

exports.deleteBannerImage = async ({ show_id }) => {
  try {
    const result = await query(`DELETE FROM banner_image WHERE show_id = ?`, [show_id]);
    return result;
  } catch (err) {
    throw err;
  }
};
