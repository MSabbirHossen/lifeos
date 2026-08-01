const express = require("express");
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/search", authMiddleware, taskController.search);
router.post("/", authMiddleware, taskController.create);
router.get("/recent", authMiddleware, taskController.recent);

module.exports = router;