const express = require("express");
const {
  listTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask
} = require("../controllers/taskController");

const router = express.Router();

router.get("/", listTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.patch("/:id/status", updateTaskStatus);
router.delete("/:id", deleteTask);

module.exports = router;
