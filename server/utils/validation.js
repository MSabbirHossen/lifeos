const validateAuthPayload = (payload = {}) => {
  const errors = [];

  if (
    !payload.email ||
    typeof payload.email !== "string" ||
    !payload.email.trim()
  ) {
    errors.push("email is required");
  }

  if (
    !payload.password ||
    typeof payload.password !== "string" ||
    !payload.password.trim()
  ) {
    errors.push("password is required");
  }

  return { isValid: errors.length === 0, errors };
};

const validateFinancePayload = (payload = {}) => {
  const errors = [];

  if (!payload.type || !["expense", "income"].includes(payload.type)) {
    errors.push("type must be expense or income");
  }

  if (
    typeof payload.amount !== "number" ||
    Number.isNaN(payload.amount) ||
    payload.amount <= 0
  ) {
    errors.push("amount must be a positive number");
  }

  if (
    !payload.description ||
    typeof payload.description !== "string" ||
    !payload.description.trim()
  ) {
    errors.push("description is required");
  }

  return { isValid: errors.length === 0, errors };
};

const validateTimeTrackerPayload = (payload = {}) => {
  const errors = [];

  if (
    !payload.task ||
    typeof payload.task !== "string" ||
    !payload.task.trim()
  ) {
    errors.push("task is required");
  }

  if (
    !payload.category ||
    typeof payload.category !== "string" ||
    !payload.category.trim()
  ) {
    errors.push("category is required");
  }

  if (
    !payload.startTime ||
    Number.isNaN(new Date(payload.startTime).getTime())
  ) {
    errors.push("startTime must be a valid date");
  }

  if (!payload.endTime || Number.isNaN(new Date(payload.endTime).getTime())) {
    errors.push("endTime must be a valid date");
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = {
  validateAuthPayload,
  validateFinancePayload,
  validateTimeTrackerPayload,
};
