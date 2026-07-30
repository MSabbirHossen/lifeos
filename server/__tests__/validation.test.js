const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateAuthPayload,
  validateFinancePayload,
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

test("validateFinancePayload requires amount and description", () => {
  const result = validateFinancePayload({ type: "expense", amount: 0 });

  assert.equal(result.isValid, false);
  assert.ok(result.errors.includes("description is required"));
});
