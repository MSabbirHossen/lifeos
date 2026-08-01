const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/", authMiddleware, dashboardController.getDashboard);
router.get("/overview", authMiddleware, dashboardController.getOverview);
router.get("/charts", authMiddleware, dashboardController.getCharts);
router.get("/today", authMiddleware, dashboardController.getTodaySnapshot);
router.get("/preferences", authMiddleware, dashboardController.getPreferences);
router.put(
  "/preferences",
  authMiddleware,
  dashboardController.updatePreferences,
);

module.exports = router;
