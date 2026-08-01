const cacheService = require("../services/cacheService");
const {
  buildDashboardAnalytics,
  getUserPreferences,
  updateUserPreferences,
} = require("../services/dashboardAnalytics");

const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000;

const normalizeRange = (range = "30d") => {
  const allowed = new Set(["today", "7d", "30d", "90d", "year"]);
  return allowed.has(range) ? range : "30d";
};

const parseBool = (value, defaultValue = true) => {
  if (value == null) return defaultValue;
  return value !== "false";
};

const getCacheKey = ({
  userId,
  range,
  currency,
  comparePrevious,
  maintenanceCalories,
}) =>
  [
    "dashboard:v3",
    userId,
    range,
    currency || "default",
    comparePrevious ? "cmp" : "nocmp",
    Number(maintenanceCalories || 0),
  ].join(":");

const getDashboardPayload = async ({
  userId,
  range,
  currency,
  comparePrevious,
  maintenanceCalories,
}) => {
  await cacheService.initRedis();

  const key = getCacheKey({
    userId,
    range,
    currency,
    comparePrevious,
    maintenanceCalories,
  });

  const result = await cacheService.getOrSet(key, DASHBOARD_CACHE_TTL_MS, () =>
    buildDashboardAnalytics({
      userId,
      range,
      currency,
      comparePrevious,
      maintenanceCalories,
    }),
  );

  return result;
};

const dashboardController = {
  getDashboard: async (req, res) => {
    try {
      const range = normalizeRange(req.query.range || "30d");
      const currency = req.query.currency;
      const comparePrevious = parseBool(req.query.comparePrevious, true);
      const maintenanceCalories = Number(req.query.maintenanceCalories || 0);

      const { value, cached } = await getDashboardPayload({
        userId: req.userId,
        range,
        currency,
        comparePrevious,
        maintenanceCalories,
      });

      res.json({ success: true, cached, data: value });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to build dashboard",
        error: error.message,
      });
    }
  },

  getOverview: async (req, res) => {
    try {
      const range = normalizeRange(req.query.range || "30d");
      const currency = req.query.currency;
      const comparePrevious = parseBool(req.query.comparePrevious, true);
      const maintenanceCalories = Number(req.query.maintenanceCalories || 0);

      const { value } = await getDashboardPayload({
        userId: req.userId,
        range,
        currency,
        comparePrevious,
        maintenanceCalories,
      });

      res.json({ success: true, data: value.overview });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to build overview",
        error: error.message,
      });
    }
  },

  getCharts: async (req, res) => {
    try {
      const range = normalizeRange(req.query.range || "30d");
      const currency = req.query.currency;
      const comparePrevious = parseBool(req.query.comparePrevious, true);
      const maintenanceCalories = Number(req.query.maintenanceCalories || 0);

      const { value } = await getDashboardPayload({
        userId: req.userId,
        range,
        currency,
        comparePrevious,
        maintenanceCalories,
      });

      res.json({ success: true, data: value.charts });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to build charts",
        error: error.message,
      });
    }
  },

  getTodaySnapshot: async (req, res) => {
    try {
      const currency = req.query.currency;
      const maintenanceCalories = Number(req.query.maintenanceCalories || 0);

      const { value } = await getDashboardPayload({
        userId: req.userId,
        range: "today",
        currency,
        comparePrevious: false,
        maintenanceCalories,
      });

      res.json({ success: true, data: value.snapshot });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to build today snapshot",
        error: error.message,
      });
    }
  },

  getPreferences: async (req, res) => {
    try {
      const preferences = await getUserPreferences(req.userId);
      res.json({ success: true, data: preferences });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard preferences",
        error: error.message,
      });
    }
  },

  updatePreferences: async (req, res) => {
    try {
      const next = req.body || {};
      const preferences = await updateUserPreferences(req.userId, next);

      await cacheService.clearPrefix(`dashboard:v3:${req.userId}:`);

      res.json({ success: true, data: preferences });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update dashboard preferences",
        error: error.message,
      });
    }
  },
};

module.exports = dashboardController;
