const {
  createBillForConfirmedInquiry,
  fetchBills,
  updateBill,
  getBillById,
} = require("../controller/billController");

const { isAuthenticated } = require("../middleware/isAuthenticated");
const catchError = require("../util/catchError");

const router = require("express").Router();

// FETCH BILLS
router.route("/bills").get(isAuthenticated, catchError(fetchBills));

//  CREATE BILL FOR CONFIRMED INQUIRY
router
  .route("/bills/:inquiryId")
  .post(isAuthenticated, catchError(createBillForConfirmedInquiry));

// GET SINGLE BILL BY ID
router.route("/bills/bill/:id").get(isAuthenticated, catchError(getBillById));

// UPDATE BILL BY ID
router.route("/bills/bill/:id").patch(isAuthenticated, catchError(updateBill));

module.exports = router;
