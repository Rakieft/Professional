const express = require("express");
const {
  listTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTaskDetail,
  addTaskComment,
  addTaskFile
} = require("../controllers/taskController");

const router = express.Router();

router.get("/", listTasks);
router.get("/:id/detail", getTaskDetail);
router.post("/", createTask);
router.post("/:id/comments", addTaskComment);
router.post("/:id/files", addTaskFile);
router.put("/:id", updateTask);
router.patch("/:id/status", updateTaskStatus);
router.delete("/:id", deleteTask);

module.exports = router;
