const GENERIC_SUFFIX_TOKENS = new Set([
  "js",
  "javascript",
  "course",
  "classes",
  "class",
]);

const normalizeStudyName = (value = "") => {
  const trimmed = String(value).trim().toLowerCase();

  if (!trimmed) {
    return "";
  }

  const tokens = trimmed
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const normalizedTokens =
    tokens.length > 1
      ? tokens.filter((token) => !GENERIC_SUFFIX_TOKENS.has(token))
      : tokens;

  return (normalizedTokens.length ? normalizedTokens : tokens).join("");
};

const buildAnalyticsWindow = ({ range = "7days", startDate, endDate }) => {
  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setHours(23, 59, 59, 999);

  const windowStart = new Date(now);
  windowStart.setHours(0, 0, 0, 0);

  switch (range) {
    case "today":
      break;
    case "30days":
      windowStart.setDate(windowStart.getDate() - 29);
      break;
    case "month":
      windowStart.setDate(1);
      break;
    case "custom": {
      const customStart = new Date(startDate);
      const customEnd = new Date(endDate || startDate);

      if (
        Number.isNaN(customStart.getTime()) ||
        Number.isNaN(customEnd.getTime())
      ) {
        throw new Error("Custom range requires valid startDate and endDate");
      }

      customStart.setHours(0, 0, 0, 0);
      customEnd.setHours(23, 59, 59, 999);

      if (customStart > customEnd) {
        throw new Error("Custom range startDate must be before endDate");
      }

      return { windowStart: customStart, windowEnd: customEnd };
    }
    case "7days":
    default:
      windowStart.setDate(windowStart.getDate() - 6);
      break;
  }

  return { windowStart, windowEnd };
};

const toDateKey = (value) => {
  const date = new Date(value);
  return date.toISOString().slice(0, 10);
};

const minutesBetween = (startTime, endTime) => {
  return Math.max(
    0,
    Math.round(
      (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000,
    ),
  );
};

module.exports = {
  normalizeStudyName,
  buildAnalyticsWindow,
  toDateKey,
  minutesBetween,
};
