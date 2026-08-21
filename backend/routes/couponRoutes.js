const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  validateCoupon,
  getCoupons,
  createCoupon,
  deleteCoupon,
} = require("../controllers/couponController");

// Public route to validate coupon
router.post("/validate", validateCoupon);

// Admin-only routes
router.get("/", protect, adminOnly, getCoupons);
router.post("/", protect, adminOnly, createCoupon);
router.delete("/:id", protect, adminOnly, deleteCoupon);

module.exports = router;
