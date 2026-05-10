const express = require("express");
const {
  listNotifications,
  markNotificationRead
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", listNotifications);
router.patch("/:id/read", markNotificationRead);

module.exports = router;
