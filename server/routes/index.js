const express = require("express");
const authRoutes = require("./authRoutes");
const clientRoutes = require("./clientRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const projectRoutes = require("./projectRoutes");
const leadRoutes = require("./leadRoutes");
const metaRoutes = require("./metaRoutes");
const taskRoutes = require("./taskRoutes");
const { requireAuth } = require("../middleware/authMiddleware");
const errorHandler = require("../middleware/errorHandler");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "webfy-api",
    timestamp: new Date().toISOString()
  });
});

router.use("/auth", authRoutes);
router.use(requireAuth);
router.use("/clients", clientRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/meta", metaRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/leads", leadRoutes);
router.use(errorHandler);

module.exports = router;
