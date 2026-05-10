const express = require("express");
const { listLeads, createLead, convertLeadToClient, convertLeadToProject } = require("../controllers/leadController");

const router = express.Router();

router.get("/", listLeads);
router.post("/", createLead);
router.post("/:id/convert", convertLeadToClient);
router.post("/:id/convert-project", convertLeadToProject);

module.exports = router;
