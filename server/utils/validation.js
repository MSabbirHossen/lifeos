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
  const taskName = payload.taskName ?? payload.task;

  if (!taskName || typeof taskName !== "string" || !taskName.trim()) {
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

  if (
    payload.startTime &&
    payload.endTime &&
    !Number.isNaN(new Date(payload.startTime).getTime()) &&
    !Number.isNaN(new Date(payload.endTime).getTime()) &&
    new Date(payload.endTime).getTime() <= new Date(payload.startTime).getTime()
  ) {
    errors.push("endTime must be after startTime");
  }

  return { isValid: errors.length === 0, errors };
};

const validateTaskPayload = (payload = {}) => {
  const errors = [];

  if (
    !payload.name ||
    typeof payload.name !== "string" ||
    !payload.name.trim()
  ) {
    errors.push("name is required");
  }

  return { isValid: errors.length === 0, errors };
};

const validateJournalPayload = (payload = {}) => {
  const errors = [];

  if (
    !payload.title ||
    typeof payload.title !== "string" ||
    !payload.title.trim()
  ) {
    errors.push("title is required");
  }

  if (payload.mood && typeof payload.mood === "string") {
    const allowedMoods = [
      "happy",
      "sad",
      "neutral",
      "excited",
      "anxious",
      "calm",
    ];
    if (!allowedMoods.includes(payload.mood)) {
      errors.push("mood must be a valid option");
    }
  }

  if (
    payload.reflectionQuestion &&
    typeof payload.reflectionQuestion !== "object"
  ) {
    errors.push("reflectionQuestion must be an object");
  }

  if (
    payload.reflectionQuestion &&
    typeof payload.reflectionQuestion === "object"
  ) {
    const { questionId, text, category } = payload.reflectionQuestion;

    if (questionId != null && typeof questionId !== "string") {
      errors.push(
        "reflectionQuestion.questionId must be a string when provided",
      );
    }

    if (text != null && typeof text !== "string") {
      errors.push("reflectionQuestion.text must be a string when provided");
    }

    if (category != null && typeof category !== "string") {
      errors.push("reflectionQuestion.category must be a string when provided");
    }
  }

  return { isValid: errors.length === 0, errors };
};

const validateStudySessionPayload = (payload = {}) => {
  const errors = [];

  if (
    !payload.subject &&
    (!payload.subjectId || typeof payload.subjectId !== "string")
  ) {
    errors.push("subject is required");
  }

  if (
    !payload.topic ||
    typeof payload.topic !== "string" ||
    !payload.topic.trim()
  ) {
    errors.push("topic is required");
  }

  if (
    typeof payload.duration !== "number" ||
    Number.isNaN(payload.duration) ||
    payload.duration <= 0
  ) {
    errors.push("duration must be a positive number");
  }

  if (payload.date != null && Number.isNaN(new Date(payload.date).getTime())) {
    errors.push("date must be a valid date when provided");
  }

  return { isValid: errors.length === 0, errors };
};

const validateStudySubjectPayload = (payload = {}) => {
  const errors = [];

  if (
    !payload.name ||
    typeof payload.name !== "string" ||
    !payload.name.trim()
  ) {
    errors.push("name is required");
  }

  if (payload.archived != null && typeof payload.archived !== "boolean") {
    errors.push("archived must be a boolean when provided");
  }

  return { isValid: errors.length === 0, errors };
};

const validateStudyPlanPayload = (payload = {}) => {
  const errors = [];

  if (!payload.subjectId || typeof payload.subjectId !== "string") {
    errors.push("subjectId is required");
  }

  [
    ["estimatedHours", payload.estimatedHours],
    ["completedHours", payload.completedHours],
    ["totalTopics", payload.totalTopics],
    ["completedTopics", payload.completedTopics],
  ].forEach(([field, value]) => {
    if (
      value != null &&
      (typeof value !== "number" || Number.isNaN(value) || value < 0)
    ) {
      errors.push(`${field} must be a non-negative number when provided`);
    }
  });

  if (
    payload.targetDate != null &&
    payload.targetDate !== "" &&
    Number.isNaN(new Date(payload.targetDate).getTime())
  ) {
    errors.push("targetDate must be a valid date when provided");
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = {
  validateAuthPayload,
  validateFinancePayload,
  validateTimeTrackerPayload,
  validateTaskPayload,
  validateJournalPayload,
  validateStudySessionPayload,
  validateStudySubjectPayload,
  validateStudyPlanPayload,
};
