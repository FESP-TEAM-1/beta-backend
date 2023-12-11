const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // 두 자리로 맞춤
  const day = String(today.getDate()).padStart(2, "0"); // 두 자리로 맞춤

  return `${year}-${month}-${day}`;
};

module.exports = getToday;
