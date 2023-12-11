const util = require("util");
const db = require("../database/db"); // 데이터베이스 연결 설정
const filterShow = require("../utils/filterShow"); // 공연 필터링 함수

const query = util.promisify(db.query).bind(db);
const beginTransaction = util.promisify(db.beginTransaction).bind(db); // 트랜잭션 시작
const commit = util.promisify(db.commit).bind(db); // 트랜잭션 커밋
const rollback = util.promisify(db.rollback).bind(db); // 트랜잭션 롤백 (시작 지점으로)

// 공연 필터링 조회
exports.getConcerts = async ({ location, start_date, end_date, progress, category }) => {
  try {
    const { queryValue, queryParams } = filterShow("공연", { location, start_date, end_date, progress, category });

    const result = await query(queryValue, queryParams);
    return result;
  } catch (err) {
    throw err;
  }
};

// 전시 필터링 조회
exports.getExhibitions = async ({ location, start_date, end_date, progress }) => {
  try {
    const { queryValue, queryParams } = filterShow("전시", { location, start_date, end_date, progress });

    const result = await query(queryValue, queryParams);
    return result;
  } catch (err) {
    throw err;
  }
};
