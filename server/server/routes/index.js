const express = require("express");
const dashboardRoutes = require("./dashboardRoutes");
const projectRoutes = require("./projectRoutes");
const leadRoutes = require("./leadRoutes");
const errorHandler = require("../middleware/errorHandler");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "webfy-api",
    timestamp: new Date().toISOString()
  });
});

router.use("/dashboard", dashboardRoutes);
router.use("/projects", projectRoutes);
router.use("/leads", leadRoutes);
router.use(errorHandler);

module.exports = router;
