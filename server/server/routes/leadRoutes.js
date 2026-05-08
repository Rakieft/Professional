const express = require("express");
const { listLeads } = require("../controllers/leadController");

const router = express.Router();

router.get("/", listLeads);

module.exports = router;
