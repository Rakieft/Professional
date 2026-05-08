const express = require("express");
const { listProjects, createProject } = require("../controllers/projectController");

const router = express.Router();

router.get("/", listProjects);
router.post("/", createProject);

module.exports = router;
