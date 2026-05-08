const express = require("express");
const { getStaffMeta } = require("../controllers/metaController");

const router = express.Router();

router.get("/", getStaffMeta);

module.exports = router;
