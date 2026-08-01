export const formatDuration = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds > 0 ? `${remainingSeconds}s` : ""}`.trim();
  }

  return `${remainingSeconds}s`;
};

export const formatTimeLabel = (value) => {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

export const formatDateLabel = (value) => {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
};

export const toDateTimeLocalValue = (value) => {
  const date = value ? new Date(value) : new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const formatRangeLabel = (range) => {
  switch (range) {
    case "week":
      return "Last 7 Days";
    case "month":
      return "This Month";
    case "custom":
      return "Custom Date Range";
    case "today":
    default:
      return "Today";
  }
};
