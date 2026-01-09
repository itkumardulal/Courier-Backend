const {
  addInquiry,
  fetchInquiries,
  fetchSingleInquiry,
  updateInquiry,
  confirmInquiry,
  cancelInquiry,
  approveInquiry,
  fetchConfirmedInquiriesWithoutBill,
  fetchAdminInquiries,
  updateConfirmedInquiryData,
} = require("../controller/inquiryController");
const { isAuthenticated } = require("../middleware/isAuthenticated");
const catchError = require("../util/catchError");

const router = require("express").Router();

// Create inquiry (user)
router
  .route("/inquiries")
  .get(isAuthenticated, catchError(fetchInquiries))
  .post(catchError(addInquiry));

// Single inquiry
router
  .route("/inquiries/:id")
  .get(isAuthenticated, catchError(fetchSingleInquiry))
  .patch(isAuthenticated, catchError(updateInquiry));

// Confirm inquiry
router
  .route("/inquiries/:id/confirm")
  .post(isAuthenticated, catchError(confirmInquiry));

// Cancel inquiry
router
  .route("/inquiries/:id/cancel")
  .post(isAuthenticated, catchError(cancelInquiry));

// Approve inquiry (admin)
router
  .route("/admin/inquiries/:id/approve")
  .patch(isAuthenticated, catchError(approveInquiry));

// Fetch confirmed inquiries without bills
router
  .route("/inquiries/confirmed/no-bill")
  .get(isAuthenticated, catchError(fetchConfirmedInquiriesWithoutBill));

// Admin inquiries list (excludes BILL)
router
  .route("/admin/inquiries")
  .get(isAuthenticated, catchError(fetchAdminInquiries));

// Update confirmed inquiry data
router
  .route("/inquiries/:id/update-confirmed-data")
  .patch(isAuthenticated, catchError(updateConfirmedInquiryData));

module.exports = router;
