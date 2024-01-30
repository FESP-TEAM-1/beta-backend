// 현재 시간이 더 크면 over
const compareWithCurrentTime = (timeString) => {
  const currentTime = new Date();
  const inputTime = new Date(stringToTime(timeString));

  return currentTime > inputTime ? "over" : "low";
};

const stringToTime = (stringTime) => {
  const [date, time] = stringTime.split(" - ");

  const [text, hm] = time.split(" ");
  let [h, m] = hm.split(":");
  h = Number(h);

  if (text === "오후" && h !== 12) {
    h += 12;
  } else if (text === "오전" && h === 12) {
    h = 0;
  }

  return `${date}T${String(h).padStart(2, "0")}:${m}`;
};

module.exports = compareWithCurrentTime;
