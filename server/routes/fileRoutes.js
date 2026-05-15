const express = require("express");
const {
  listProjectFiles,
  createProjectFile,
  updateProjectFile,
  deleteProjectFile
} = require("../controllers/fileController");

const router = express.Router();

router.get("/", listProjectFiles);
router.post("/", createProjectFile);
router.put("/:id", updateProjectFile);
router.delete("/:id", deleteProjectFile);

module.exports = router;
