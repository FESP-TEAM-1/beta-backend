const util = require("util");
const db = require("../database/db"); // 데이터베이스 연결 설정

const query = util.promisify(db.query).bind(db);
const beginTransaction = util.promisify(db.beginTransaction).bind(db); // 트랜잭션 시작
const commit = util.promisify(db.commit).bind(db); // 트랜잭션 커밋
const rollback = util.promisify(db.rollback).bind(db); // 트랜잭션 롤백 (시작 지점으로)

// 최신 스토리 8개 조회
exports.getStoryLimit = async () => {
  try {
    const result = await query(
      `SELECT a.*, b.login_id FROM story as a inner join user as b on a.user_id = b.id order by updated_at desc limit 8`
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// 전체 스토리 조회
exports.getStoryAll = async () => {
  try {
    const result = await query(
      `SELECT a.*, b.login_id FROM story as a inner join user as b on a.user_id = b.id order by updated_at desc`
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// 스토리 업로드
exports.postStoryUpload = async ({ user_id, story_image_url, tags, story_color }) => {
  try {
    await query(`INSERT INTO story (user_id, story_image_url, tags, story_color) VALUES (?, ?, ?, ?)`, [
      user_id,
      story_image_url,
      tags,
      story_color,
    ]);
    return true;
  } catch (err) {
    throw err;
  }
};
