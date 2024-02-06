const getKoreaTime = require("./getKoreaTime");

const getToday = () => {
  const today = getKoreaTime();
  return today.split("T")[0];
};

module.exports = getToday;
