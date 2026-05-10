const express = require("express");
const {
  listUsers,
  createUser,
  updateUser,
  toggleUserStatus
} = require("../controllers/userController");

const router = express.Router();

router.get("/", listUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id/status", toggleUserStatus);

module.exports = router;
