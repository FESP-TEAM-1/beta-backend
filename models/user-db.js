const util = require("util");
const db = require("../database/db"); // 데이터베이스 연결 설정

const query = util.promisify(db.query).bind(db);
const beginTransaction = util.promisify(db.beginTransaction).bind(db); // 트랜잭션 시작
const commit = util.promisify(db.commit).bind(db); // 트랜잭션 커밋
const rollback = util.promisify(db.rollback).bind(db); // 트랜잭션 롤백 (시작 지점으로)

// 전체 유저 조회
exports.getAllMember = async () => {
  try {
    const result = await query(`SELECT idx, unique_id, name, user_email, user_id, birth_date, gender, phone_number, user_type, created_at FROM user`);
    return result;
  } catch (err) {
    throw err;
  }
};

// 유저 조회 (아이디, 타입으로 조회)
exports.getMember = async (user_id, user_role) => {
  try {
    const result = await query(
      `SELECT idx, unique_id, name, user_email, user_id, user_pw, birth_date, gender, phone_number, user_role, created_at FROM user WHERE user_id = ? and user_role = ?`,
      [user_id, user_role]
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// 일반 유저 전체 조회
exports.getUser = async () => {
  try {
    const result = await query(
      `SELECT idx, unique_id, name, user_email, user_id, birth_date, gender, phone_number, user_type, created_at FROM user WHERE user_type="User"`
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// 관리자 전체 조회
exports.getAdmin = async () => {
  try {
    const result = await query(
      `SELECT idx, unique_id, name, user_email, user_id, birth_date, gender, phone_number, user_type, created_at FROM user WHERE user_type="Admin"`
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// 회원가입
exports.signUp = async (data) => {
  const [unique_id, name, user_email, user_id, hash, birth_date, gender, phone_number, user_role] = data;
  const user_pw = hash;
  try {
    const result = await query(
      `INSERT INTO user (unique_id, name, user_email, user_id, user_pw, birth_date, gender, phone_number, user_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [unique_id, name, user_email, user_id, user_pw, birth_date, gender, phone_number, user_role]
    );
    return result;
  } catch (err) {
    throw err;
  }
};
