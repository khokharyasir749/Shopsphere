require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "*"
}));
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.status(200).json({
    name: "ShopSphere API",
    status: "Online",
    timestamp: new Date().toISOString(),
    endpoints: {
      products: "/api/products",
      health: "/"
    }
  });
});

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// Database Connection & Server Start
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shopsphere";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully");
  })
  .catch((error) => {
    console.warn("⚠️ MongoDB connection notice:", error.message);
    console.warn("Server will continue running. Products API will handle requests.");
  });

app.listen(PORT, () => {
  console.log(`🚀 ShopSphere backend server listening at http://localhost:${PORT}`);
});