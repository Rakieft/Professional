const express = require("express");
const { requireRole } = require("../middleware/authMiddleware");
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
router.get("/", requireRole("admin", "cofounder", "secretary", "operations_manager"), listUsers);
router.post("/", requireRole("admin", "cofounder", "secretary", "operations_manager"), createUser);
router.put("/:id", requireRole("admin", "cofounder", "secretary", "operations_manager"), updateUser);
router.patch("/:id/status", requireRole("admin", "cofounder", "secretary", "operations_manager"), toggleUserStatus);

module.exports = router;
