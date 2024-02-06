const filterShow = (type, ...arg) => {
  const { location, start_date, end_date, progress, category } = arg[0];

  let queryValue = "SELECT * FROM showing WHERE show_type = ?";
  let queryParams = [type];

  if (location && location !== "all") {
    queryValue += " AND location LIKE ?";
    queryParams.push(`%${location}%`);
  }

  if (type === "공연") {
    if (category && category !== "all") {
      queryValue += " AND show_sub_type = ?";
      queryParams.push(category);
    }
  }

  switch (progress) {
    case "all":
      break;
    case "1":
      queryValue += " AND start_date <= ? AND end_date >= ?";
      queryParams.push(end_date);
      queryParams.push(start_date);
      break;
    case "2":
      queryValue += " AND start_date > ?";
      queryParams.push(start_date);
      break;
    case "3":
      queryValue += " AND end_date < ?";
      queryParams.push(start_date);
      break;
  }

  return { queryValue, queryParams };
};

module.exports = filterShow;
