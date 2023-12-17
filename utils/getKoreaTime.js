// 현재 시간을 UTC 기준으로 가져오기
const getKoreaTime = () => {
  const nowUtc = new Date();

  // 한국 시간대로 변환 (UTC+9)
  const koreaTime = new Date(nowUtc.getTime() + 9 * 60 * 60 * 1000);

  // ISO 8601 형식으로 변환
  const formattedKoreaTime = koreaTime.toISOString();

  return formattedKoreaTime;
};
module.exports = getKoreaTime;
