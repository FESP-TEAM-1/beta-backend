const getToday = require("./getToday"); // 오늘 날짜를 가져오는 함수

const filterShow = (type, ...arg) => {
  const { location, start_date, end_date, progress, category } = arg[0];

  let queryValue = "SELECT * FROM showing WHERE show_type = ?";
  let queryParams = [type];

  // start_date 조건 추가
  if (start_date) {
    queryValue += " AND start_date <= ?";
    queryParams.push(end_date);
  }

  // end_date 조건 추가
  if (end_date) {
    queryValue += " AND end_date >= ?";
    queryParams.push(start_date);
  }

  // location 조건 추가 (location이 'all'이 아닐 때만)
  if (location !== "all") {
    queryValue += " AND location LIKE ?";
    queryParams.push(`%${location}%`);
  }

  // progress 조건 추가
  if (progress !== "all") {
    const today = getToday(); // 오늘 날짜
    switch (progress) {
      case "1": // 진행 중인 공연
        queryValue += " AND (end_date >= ? AND start_date <= ?)";
        queryParams.push(today);
        queryParams.push(today);
        break;
      case "2": // 진행 예정인 공연
        queryValue += " AND start_date > ?";
        queryParams.push(today);
        break;
      case "3": // 종료된 공연
        queryValue += " AND end_date < ?";
        queryParams.push(today);
        break;
    }
  }

  // 공연일 경우 category 조건 추가
  if (type === "공연") {
    if (category !== "all") {
      queryValue += " AND show_sub_type = ?";
      queryParams.push(category);
    }
  }

  return { queryValue, queryParams };
};

module.exports = filterShow;
