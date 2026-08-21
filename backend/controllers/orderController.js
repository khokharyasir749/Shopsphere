const Order = require("../models/Order");
const Product = require("../models/Product");

// POST /api/orders — Create a new order
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No order items provided" });
    }

    const { fullName, address, city, postalCode, country } = shippingAddress || {};
    if (!fullName || !address || !city || !postalCode || !country) {
      return res.status(400).json({ message: "All shipping address fields are required" });
    }

    // Verify each item against DB and calculate total server-side
    let totalAmount = 0;
    const resolvedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        });
      }
      resolvedItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: item.quantity,
      });
      totalAmount += product.price * item.quantity;
    }

    // Apply coupon if provided in request body
    let discount = 0;
    if (req.body.couponCode) {
      const Coupon = require("../models/Coupon");
      const coupon = await Coupon.findOne({ code: req.body.couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        const notExpired = !coupon.expiresAt || new Date(coupon.expiresAt) >= new Date();
        const metMinPurchase = totalAmount >= (coupon.minPurchase || 0);
        if (notExpired && metMinPurchase) {
          if (coupon.discountType === "percentage") {
            discount = totalAmount * (coupon.discountAmount / 100);
          } else {
            discount = coupon.discountAmount;
          }
          if (discount > totalAmount) {
            discount = totalAmount;
          }
        }
      }
    }

    totalAmount = Math.max(0, totalAmount - discount);

    const order = await Order.create({
      user: req.user._id,
      items: resolvedItems,
      shippingAddress,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    });

    // Decrement stock for each purchased item
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

// GET /api/orders/my-orders — Get all orders for current user
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("items.product", "name image");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};

// GET /api/orders/:id — Get single order by ID (own orders only)
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product", "name image");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    // Ensure the order belongs to the current user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order", error: error.message });
  }
};

module.exports = { createOrder, getMyOrders, getOrderById };
