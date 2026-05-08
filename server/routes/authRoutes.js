const express = require("express");
const { getSession, login, logout } = require("../controllers/authController");

const router = express.Router();

router.get("/session", getSession);
router.post("/login", login);
router.post("/logout", logout);

module.exports = router;
