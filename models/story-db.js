const util = require("util");
const db = require("../database/db"); // 데이터베이스 연결 설정

const query = util.promisify(db.query).bind(db);
const beginTransaction = util.promisify(db.beginTransaction).bind(db); // 트랜잭션 시작
const commit = util.promisify(db.commit).bind(db); // 트랜잭션 커밋
const rollback = util.promisify(db.rollback).bind(db); // 트랜잭션 롤백 (시작 지점으로)

// 최신 스토리 8개 조회
exports.getStoryLimit = async () => {
  try {
    const result = await query(`SELECT a.*, b.login_id FROM story as a inner join user as b on a.user_id = b.id order by updated_at desc limit 8`);
    return result;
  } catch (err) {
    throw err;
  }
};

// 전체 스토리 조회
exports.getStoryAll = async () => {
  try {
    const result = await query(`SELECT a.*, b.login_id FROM story as a inner join user as b on a.user_id = b.id order by updated_at desc`);
    return result;
  } catch (err) {
    throw err;
  }
};

// story_id로 스토리 조회
exports.getStory = async ({ story_id, user_id }) => {
  try {
    const result = await query(`SELECT * FROM story WHERE id = ? AND user_id = ?`, [story_id, user_id]);
    return result;
  } catch (err) {
    throw err;
  }
};

// user_id로 스토리 조회
exports.getStoryUser = async ({ user_id }) => {
  try {
    const result = await query(
      `SELECT a.id, a.story_image_url, a.story_color, a.tags, a.created_at, a.updated_at, b.login_id FROM story as a 
      inner join user as b on a.user_id = b.id where a.user_id = ? order by created_at desc`,
      [user_id]
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// 스토리 업로드
exports.postStoryUpload = async ({ user_id, story_image_url, tags, story_color }) => {
  try {
    await query(`INSERT INTO story (user_id, story_image_url, tags, story_color) VALUES (?, ?, ?, ?)`, [user_id, story_image_url, tags, story_color]);
    return true;
  } catch (err) {
    throw err;
  }
};

// 스토리 수정
exports.putStoryUpdate = async ({ story_id, user_id, story_image_url, tags, story_color }) => {
  try {
    await query(`UPDATE story SET tags = ?, story_image_url = ?, story_color = ? WHERE id = ? AND user_id = ?`, [
      tags,
      story_image_url,
      story_color,
      story_id,
      user_id,
    ]);
    return true;
  } catch (err) {
    throw err;
  }
};

// 스토리 삭제
exports.deleteStoryDelete = async ({ story_id, user_id }) => {
  try {
    await query(`DELETE FROM story WHERE id = ? AND user_id = ?`, [story_id, user_id]);
    return true;
  } catch (err) {
    throw err;
  }
};
