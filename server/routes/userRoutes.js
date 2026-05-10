const express = require("express");
const {
  listUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  getMyProfile,
  updateMyProfile
} = require("../controllers/userController");

const router = express.Router();

router.get("/me", getMyProfile);
router.patch("/me", updateMyProfile);
router.get("/", listUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id/status", toggleUserStatus);

module.exports = router;
