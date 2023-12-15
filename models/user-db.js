const util = require("util");
const db = require("../database/db"); // 데이터베이스 연결 설정

const query = util.promisify(db.query).bind(db);
const beginTransaction = util.promisify(db.beginTransaction).bind(db); // 트랜잭션 시작
const commit = util.promisify(db.commit).bind(db); // 트랜잭션 커밋
const rollback = util.promisify(db.rollback).bind(db); // 트랜잭션 롤백 (시작 지점으로)

// 전체 유저 조회
exports.getAllMember = async () => {
  try {
    const result = await query(`SELECT id, user_name, user_email, login_id, birth_date, gender, phone_number, user_role, created_at FROM user`);
    return result;
  } catch (err) {
    throw err;
  }
};

// 유저 조회 (아이디 조회)
exports.getMember = async (login_id) => {
  try {
    const result = await query(
      `SELECT id, user_name, user_email, login_id, birth_date, gender, phone_number, user_role, created_at FROM user WHERE login_id = ?`,
      [login_id]
    );
    return result;
  } catch (err) {
    throw err;
  }
};

exports.getMemberAllInfo = async (login_id, user_role) => {
  try {
    const result = await query(`SELECT * FROM user WHERE login_id = ? and user_role = ?`, [login_id, user_role]);
    return result;
  } catch (err) {
    throw err;
  }
};

// 일반 유저 전체 조회
exports.getUsers = async () => {
  try {
    const result = await query(
      `SELECT id, user_name, user_email, login_id, birth_date, gender, phone_number, user_role, created_at FROM user WHERE user_role="User"`
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// 관리자 전체 조회
exports.getAdmins = async () => {
  try {
    const result = await query(
      `SELECT id, user_name, user_email, login_id, birth_date, gender, phone_number, user_role, created_at FROM user WHERE user_role="Admin"`
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// 회원가입
exports.signUp = async (data) => {
  const [user_name, user_email, login_id, hash, birth_date, gender, phone_number, user_role] = data;
  const login_pw = hash;
  try {
    const result = await query(
      `INSERT INTO user (user_name, user_email, login_id, login_pw, birth_date, gender, phone_number, user_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_name, user_email, login_id, login_pw, birth_date, gender, phone_number, user_role]
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// 로그인 시 로그 기록
exports.insertUserLog = async (user_role, login_id) => {
  try {
    const result = await query(`INSERT INTO user_log (user_role, login_id) VALUES (?, ?)`, [user_role, login_id]);
    return result;
  } catch (err) {
    throw err;
  }
};
