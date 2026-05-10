const express = require("express");
const {
  getFinanceOverview,
  createQuote,
  createPayment,
  createInvoiceFromQuote
} = require("../controllers/financeController");

const router = express.Router();

router.get("/", getFinanceOverview);
router.post("/quotes", createQuote);
router.post("/quotes/:id/invoice", createInvoiceFromQuote);
router.post("/payments", createPayment);

module.exports = router;
