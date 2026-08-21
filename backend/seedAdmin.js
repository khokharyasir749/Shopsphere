require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shopsphere");
    
    // Check if admin exists
    const existingAdmin = await User.findOne({ email: "admin@shopsphere.com" });
    if (existingAdmin) {
      console.log("Admin already exists!");
      process.exit(0);
    }

    const adminUser = await User.create({
      name: "ShopSphere Admin",
      email: "admin@shopsphere.com",
      password: "password123",
      role: "admin",
    });

    console.log("Admin user created successfully!");
    console.log(`Email: ${adminUser.email}`);
    console.log("Password: password123");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error);
    process.exit(1);
  }
};

seedAdmin();
