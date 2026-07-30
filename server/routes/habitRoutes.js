const express = require("express");
const habitController = require("../controllers/habitController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/", authMiddleware, habitController.create);
router.get("/", authMiddleware, habitController.getAll);
router.put("/:id", authMiddleware, habitController.update);
router.delete("/:id", authMiddleware, habitController.delete);

module.exports = router;
