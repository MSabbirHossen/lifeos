const express = require("express");
const authMiddleware = require("../middleware/auth");
const { getRatesForDate } = require("../services/currencyService");

const router = express.Router();

router.get("/rates", authMiddleware, async (req, res) => {
  try {
    const rates = await getRatesForDate(new Date());
    res.json({
      USD_BDT: Number(rates.USD || 120),
      SAR_BDT: Number(rates.SAR || 32),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch currency rates",
      error: error.message,
    });
  }
});

module.exports = router;
