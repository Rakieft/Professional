const express = require("express");
const { submitContactRequest, submitQuoteRequest } = require("../controllers/contactController");

const router = express.Router();

router.post("/", submitContactRequest);
router.post("/quote", submitQuoteRequest);

module.exports = router;
