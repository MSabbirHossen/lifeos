const DEFAULT_WEIGHTS = {
  islamic: 25,
  health: 20,
  fitness: 15,
  study: 15,
  habits: 15,
  finance: 5,
  journal: 5,
};

const clamp = (value) => Math.min(100, Math.max(0, Number(value) || 0));

const normalizeWeights = (weights = DEFAULT_WEIGHTS) => {
  const merged = { ...DEFAULT_WEIGHTS, ...(weights || {}) };
  const sum = Object.values(merged).reduce((acc, v) => acc + Number(v || 0), 0);
  if (!sum) {
    return DEFAULT_WEIGHTS;
  }

  return Object.fromEntries(
    Object.entries(merged).map(([key, value]) => [
      key,
      (Number(value || 0) / sum) * 100,
    ]),
  );
};

const getCategory = (score) => {
  if (score >= 85)
    return { category: "Excellent", message: "Strong consistency today" };
  if (score >= 70)
    return { category: "Great", message: "Good momentum across life areas" };
  if (score >= 55)
    return { category: "Stable", message: "Solid baseline, keep building" };
  return { category: "Needs Focus", message: "Focus on one key habit today" };
};

const computeLifeScore = (dimensions, customWeights) => {
  const weights = normalizeWeights(customWeights);
  const score = Object.entries(weights).reduce((sum, [key, weight]) => {
    return sum + (clamp(dimensions[key]) * weight) / 100;
  }, 0);

  const rounded = Math.round(score);
  const meta = getCategory(rounded);

  return {
    score: rounded,
    category: meta.category,
    message: meta.message,
    weights,
    dimensions: Object.fromEntries(
      Object.entries(dimensions).map(([key, value]) => [key, clamp(value)]),
    ),
  };
};

module.exports = {
  DEFAULT_WEIGHTS,
  computeLifeScore,
  normalizeWeights,
};
