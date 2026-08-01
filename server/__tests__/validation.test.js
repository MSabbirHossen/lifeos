const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateAuthPayload,
  validateFinancePayload,
  validateJournalPayload,
  validateStudyPlanPayload,
  validateStudySessionPayload,
  validateTimeTrackerPayload,
  validateTaskPayload,
} = require("../utils/validation");

test("validateAuthPayload rejects missing credentials", () => {
  const result = validateAuthPayload({ email: "test@example.com" });

  assert.equal(result.isValid, false);
  assert.ok(result.errors.includes("password is required"));
});

test("validateAuthPayload accepts valid credentials", () => {
  const result = validateAuthPayload({
    email: "user@example.com",
    password: "secret123",
  });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
});

test("validateFinancePayload requires amount and expenseName for expenses", () => {
  const result = validateFinancePayload({ type: "expense", amount: 0 });

  assert.equal(result.isValid, false);
  assert.ok(
    result.errors.includes("expenseName is required for expense entries"),
  );
});

test("validateFinancePayload requires description for income", () => {
  const result = validateFinancePayload({
    type: "income",
    amount: 1000,
    description: "",
  });

  assert.equal(result.isValid, false);
  assert.ok(
    result.errors.includes("description is required for income entries"),
  );
});

test("validateJournalPayload rejects missing title", () => {
  const result = validateJournalPayload({ notes: "sample" });

  assert.equal(result.isValid, false);
  assert.ok(result.errors.includes("title is required"));
});

test("validateJournalPayload accepts reflection question snapshot", () => {
  const result = validateJournalPayload({
    title: "Daily check-in",
    notes: "Reflection answer",
    reflectionQuestion: {
      questionId: "689123456789012345678901",
      text: "What motivates me deeply?",
      category: "Purpose",
    },
  });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
});

test("validateTimeTrackerPayload requires a task name and valid time span", () => {
  const result = validateTimeTrackerPayload({
    taskName: "React Learning",
    category: "Textbook Study",
    startTime: "2026-08-01T10:00:00.000Z",
    endTime: "2026-08-01T09:00:00.000Z",
  });

  assert.equal(result.isValid, false);
  assert.ok(result.errors.includes("endTime must be after startTime"));
});

test("validateTaskPayload accepts a populated task name", () => {
  const result = validateTaskPayload({ name: "Quran Memorization" });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
});

test("validateStudySessionPayload requires subject, topic, and duration", () => {
  const result = validateStudySessionPayload({
    subject: "",
    topic: "",
    duration: 0,
  });

  assert.equal(result.isValid, false);
  assert.ok(result.errors.includes("subject is required"));
  assert.ok(result.errors.includes("topic is required"));
  assert.ok(result.errors.includes("duration must be a positive number"));
});

test("validateStudyPlanPayload accepts a well-formed study plan", () => {
  const result = validateStudyPlanPayload({
    subjectId: "689123456789012345678901",
    estimatedHours: 80,
    completedHours: 30,
    targetDate: "2026-08-31",
    totalTopics: 40,
    completedTopics: 25,
  });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
});
