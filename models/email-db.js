const util = require("util");
const db = require("../database/db"); // 데이터베이스 연결 설정

const query = util.promisify(db.query).bind(db);
const beginTransaction = util.promisify(db.beginTransaction).bind(db); // 트랜잭션 시작
const commit = util.promisify(db.commit).bind(db); // 트랜잭션 커밋
const rollback = util.promisify(db.rollback).bind(db); // 트랜잭션 롤백 (시작 지점으로)

// 유저 조회 (이메일 조회)
exports.getMemberEmail = async (user_email) => {
  try {
    const result = await query(`SELECT id, user_name, user_email FROM user WHERE user_email = ?`, [user_email]);
    return result;
  } catch (err) {
    throw err;
  }
};

exports.insertEmailCode = async (user_email, code, message) => {
  try {
    const result = await query(`INSERT INTO cert (user_email, code, message) VALUES (?, ?, ?)`, [user_email, code, message]);
    return result;
  } catch (err) {
    throw err;
  }
};

exports.getCertCode = async (user_email) => {
  try {
    const result = await query(`SELECT id, code, created_at FROM cert WHERE user_email = ? order by created_at desc limit 1`, [user_email]);
    return result;
  } catch (err) {
    throw err;
  }
};

exports.updateCertCode = async (id, certified_data) => {
  try {
    const result = await query(`UPDATE cert SET certified_data = ? WHERE id = ?`, [certified_data, id]);
    return result;
  } catch (err) {
    throw err;
  }
};
