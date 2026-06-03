const express = require("express");
const { requireRole } = require("../middleware/authMiddleware");
const {
  getFinanceOverview,
  createQuote,
  createPayment,
  createInvoiceFromQuote
} = require("../controllers/financeController");

const router = express.Router();

router.get("/", requireRole("admin", "marketing_lead", "business_sales", "administrative_assistant", "cofounder", "secretary", "operations_manager", "project_manager", "sales_manager"), getFinanceOverview);
router.post("/quotes", requireRole("admin", "marketing_lead", "business_sales", "administrative_assistant", "cofounder", "secretary", "operations_manager", "project_manager", "sales_manager"), createQuote);
router.post("/quotes/:id/invoice", requireRole("admin", "marketing_lead", "business_sales", "administrative_assistant", "cofounder", "secretary", "operations_manager", "project_manager", "sales_manager"), createInvoiceFromQuote);
router.post("/payments", requireRole("admin", "marketing_lead", "business_sales", "administrative_assistant", "cofounder", "secretary", "operations_manager", "project_manager", "sales_manager"), createPayment);

module.exports = router;
