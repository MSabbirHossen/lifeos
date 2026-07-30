const express = require("express");
const studyController = require("../controllers/studyController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/", authMiddleware, studyController.create);
router.get("/", authMiddleware, studyController.getAll);
router.put("/:id", authMiddleware, studyController.update);
router.delete("/:id", authMiddleware, studyController.delete);

module.exports = router;
