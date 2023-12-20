const util = require("util");
const db = require("../database/db"); // 데이터베이스 연결 설정

const query = util.promisify(db.query).bind(db);
const beginTransaction = util.promisify(db.beginTransaction).bind(db); // 트랜잭션 시작
const commit = util.promisify(db.commit).bind(db); // 트랜잭션 커밋
const rollback = util.promisify(db.rollback).bind(db); // 트랜잭션 롤백 (시작 지점으로)

exports.insertUserReservation = async ({ show_id, show_times_id, user_id, is_emailSend }) => {
  try {
    await beginTransaction(); // 트랜잭션 시작
    const insertReservation = await query(`INSERT INTO user_reservation (show_id, user_id, show_times_id, is_emailSend) VALUES (?, ?, ?, ?)`, [
      show_id,
      user_id,
      show_times_id,
      is_emailSend,
    ]);
    await commit(); // 커밋
    return insertReservation;
  } catch (err) {
    await rollback(); // 롤백
    console.error(err);
    return err;
  }
};

exports.updateShowTimes = async ({ show_times_id }) => {
  try {
    await beginTransaction(); // 트랜잭션 시작
    const updateShowTimes = await query(`UPDATE show_times SET head_count = CASE WHEN head_count > 0 THEN head_count - 1 ELSE 0 END WHERE id = ?`, [
      show_times_id,
    ]);
    await commit(); // 커밋
    return updateShowTimes;
  } catch (err) {
    await rollback(); // 롤백
    console.error(err);
    return err;
  }
};
