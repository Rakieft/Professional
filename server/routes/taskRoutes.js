const express = require("express");
const { listTasks, createTask } = require("../controllers/taskController");

const router = express.Router();

router.get("/", listTasks);
router.post("/", createTask);

module.exports = router;
