const Coupon = require("../models/Coupon");

// Validate coupon (public/protected)
// POST /api/coupons/validate
// Req body: { code, subtotal }
const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon code not found" });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: "Coupon is inactive" });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ message: "Coupon has expired" });
    }

    const minSpend = Number(coupon.minPurchase) || 0;
    const currentSubtotal = Number(subtotal) || 0;

    if (currentSubtotal < minSpend) {
      return res.status(400).json({
        message: `Minimum purchase of $${minSpend.toFixed(2)} required for this coupon`,
      });
    }

    let calculatedDiscount = 0;
    if (coupon.discountType === "percentage") {
      calculatedDiscount = currentSubtotal * (coupon.discountAmount / 100);
    } else {
      calculatedDiscount = coupon.discountAmount;
    }

    // Cap the discount at the subtotal
    if (calculatedDiscount > currentSubtotal) {
      calculatedDiscount = currentSubtotal;
    }

    res.status(200).json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountAmount: coupon.discountAmount,
      minPurchase: coupon.minPurchase,
      calculatedDiscount: Number(calculatedDiscount.toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to validate coupon",
      error: error.message,
    });
  }
};

// Get all coupons (admin only)
// GET /api/coupons
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch coupons",
      error: error.message,
    });
  }
};

// Create coupon (admin only)
// POST /api/coupons
const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountAmount, minPurchase, expiresAt, isActive } = req.body;

    if (!code || !discountAmount) {
      return res.status(400).json({ message: "Code and discount amount are required" });
    }

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType: discountType || "percentage",
      discountAmount: Number(discountAmount),
      minPurchase: Number(minPurchase) || 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json(coupon);
  } catch (error) {
    res.status(400).json({
      message: "Failed to create coupon",
      error: error.message,
    });
  }
};

// Delete coupon (admin only)
// DELETE /api/coupons/:id
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.status(200).json({ message: "Coupon deleted successfully", id: req.params.id });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete coupon",
      error: error.message,
    });
  }
};

module.exports = {
  validateCoupon,
  getCoupons,
  createCoupon,
  deleteCoupon,
};
