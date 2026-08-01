const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/overview", authMiddleware, dashboardController.getOverview);
router.get("/charts", authMiddleware, dashboardController.getCharts);

module.exports = router;
