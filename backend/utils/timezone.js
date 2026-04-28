const { startOfDay, endOfDay } = require("date-fns");

let timezoneConfig = "Asia/Kathmandu";

const initTimezone = () => {
  try {
    const setupData = require("../configs/setup.json");
    if (setupData.default_timezone) {
      timezoneConfig = setupData.default_timezone;
    }
  } catch (e) {
    timezoneConfig = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
};

initTimezone();

const setTimezone = (tz) => {
  timezoneConfig = tz;
};

const getTimezone = () => timezoneConfig;

const getLocalDateRange = (startDateStr, endDateStr) => {
  const [year, month, day] = startDateStr.split("-").map(Number);
  const startLocal = new Date(year, month - 1, day, 0, 0, 0);

  const [year2, month2, day2] = endDateStr.split("-").map(Number);
  const endLocal = new Date(year2, month2 - 1, day2, 23, 59, 59, 999);

  return {
    start: startLocal,
    end: endLocal,
  };
};

module.exports = {
  setTimezone,
  getTimezone,
  getLocalDateRange,
};