const normalizeTaskName = (value = "") =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const formatTaskName = (value = "") =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const calculateDurationSeconds = (startTime, endTime) => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return 0;
  }

  return Math.floor((end - start) / 1000);
};

const startOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const buildAnalyticsWindow = ({ range, startDate, endDate } = {}) => {
  const now = new Date();

  if (startDate && endDate) {
    const windowStart = startOfDay(startDate);
    const windowEnd = endOfDay(endDate);
    return { windowStart, windowEnd };
  }

  switch (range) {
    case "week": {
      const windowStart = startOfDay(now);
      windowStart.setDate(windowStart.getDate() - 6);
      return { windowStart, windowEnd: now };
    }
    case "month": {
      const windowStart = startOfDay(now);
      windowStart.setDate(1);
      return { windowStart, windowEnd: now };
    }
    case "today":
    default:
      return { windowStart: startOfDay(now), windowEnd: now };
  }
};

const getOverlapSeconds = (startTime, endTime, windowStart, windowEnd) => {
  const overlapStart = Math.max(
    new Date(startTime).getTime(),
    windowStart.getTime(),
  );
  const overlapEnd = Math.min(new Date(endTime).getTime(), windowEnd.getTime());

  if (overlapEnd <= overlapStart) {
    return 0;
  }

  return Math.floor((overlapEnd - overlapStart) / 1000);
};

const toDateKey = (date) => new Date(date).toISOString().slice(0, 10);

module.exports = {
  normalizeTaskName,
  formatTaskName,
  calculateDurationSeconds,
  buildAnalyticsWindow,
  getOverlapSeconds,
  startOfDay,
  endOfDay,
  toDateKey,
};