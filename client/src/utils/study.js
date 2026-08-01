export const normalizeStudyName = (value = "") => {
  const trimmed = String(value).trim().toLowerCase();

  if (!trimmed) {
    return "";
  }

  const genericSuffixTokens = new Set([
    "js",
    "javascript",
    "course",
    "classes",
    "class",
  ]);

  const tokens = trimmed
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const nextTokens =
    tokens.length > 1
      ? tokens.filter((token) => !genericSuffixTokens.has(token))
      : tokens;

  return (nextTokens.length ? nextTokens : tokens).join("");
};

export const formatMinutes = (minutes = 0) => {
  const totalMinutes = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (!hours) {
    return `${remainingMinutes}m`;
  }

  if (!remainingMinutes) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

export const formatStudyDate = (value) => {
  if (!value) {
    return "No date";
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatRelativeStudyDate = (value) => {
  if (!value) {
    return "Not studied yet";
  }

  const diffDays = Math.floor(
    (Date.now() - new Date(value).getTime()) / 86400000,
  );

  if (diffDays <= 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "1 day ago";
  }

  return `${diffDays} days ago`;
};

export const toDateInputValue = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
};

export const getRangeLabel = (range) => {
  switch (range) {
    case "today":
      return "Today";
    case "30days":
      return "Last 30 Days";
    case "month":
      return "This Month";
    case "custom":
      return "Custom Range";
    case "7days":
    default:
      return "Last 7 Days";
  }
};
