const util = require("util");
const db = require("../database/db"); // 데이터베이스 연결 설정

const query = util.promisify(db.query).bind(db);
const beginTransaction = util.promisify(db.beginTransaction).bind(db); // 트랜잭션 시작
const commit = util.promisify(db.commit).bind(db); // 트랜잭션 커밋
const rollback = util.promisify(db.rollback).bind(db); // 트랜잭션 롤백 (시작 지점으로)

exports.insertUserReservation = async ({ show_id, show_times_id, user_id, is_receive_email, orderId = null, amount = null }) => {
  try {
    let queryValue = "";
    let queryParams = [];
    if (orderId) {
      queryValue = "(orderId, amount, show_id, show_times_id, user_id, is_receive_email) VALUES (?, ?, ?, ?, ?, ?)";
      queryParams = [orderId, amount, show_id, show_times_id, user_id, is_receive_email];
    } else {
      queryValue = "(show_id, show_times_id, user_id, is_receive_email) VALUES (?, ?, ?, ?)";
      queryParams = [show_id, show_times_id, user_id, is_receive_email];
    }
    await query(`INSERT INTO user_reservation ${queryValue}`, queryParams);
    return true;
  } catch (err) {
    console.error(err);
    return err;
  }
};

exports.updateShowTimes = async ({ show_times_id }) => {
  try {
    const updateShowTimes = await query(`UPDATE show_times SET head_count = CASE WHEN head_count > 0 THEN head_count - 1 ELSE 0 END WHERE id = ?`, [
      show_times_id,
    ]);
    return updateShowTimes;
  } catch (err) {
    console.error(err);
    return err;
  }
};

exports.getUserReservation = async ({ show_id, user_id }) => {
  try {
    const result = await query(`SELECT * FROM user_reservation WHERE show_id = ? AND user_id = ?`, [show_id, user_id]);
    return result;
  } catch (err) {
    console.error(err);
    return err;
  }
};
