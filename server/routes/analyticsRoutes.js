const express = require("express");
const { requireRole } = require("../middleware/authMiddleware");
const {
  getExecutiveAnalytics,
  upsertCompensation
} = require("../controllers/analyticsController");

const router = express.Router();

router.get("/executive", requireRole("admin"), getExecutiveAnalytics);
router.put("/compensation/:userId", requireRole("admin"), upsertCompensation);

module.exports = router;
