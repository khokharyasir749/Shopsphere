const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { getAdminStats, getAllOrders, updateOrderStatus, getAllUsers } = require("../controllers/adminController");

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

router.get("/stats", getAdminStats);
router.get("/orders", getAllOrders);
router.put("/orders/:id/status", updateOrderStatus);
router.get("/users", getAllUsers);

module.exports = router;
