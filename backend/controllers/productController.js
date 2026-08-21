const Product = require("../models/Product");

const initialProducts = [
  {
    name: "Smart Watch Pro",
    description: "Advanced fitness tracker with vibrant AMOLED display, blood oxygen monitoring, and 7-day battery life.",
    price: 149.99,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    stock: 25
  },
  {
    name: "Wireless ANC Headphones",
    description: "High-fidelity active noise cancelling headphones featuring 40mm drivers and 30-hour battery life.",
    price: 199.99,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    stock: 18
  },
  {
    name: "Ultra Lightweight Running Shoes",
    description: "Ergonomic breathable mesh running shoes built for maximum speed, cushioning, and daily road comfort.",
    price: 89.99,
    category: "Footwear",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    stock: 30
  },
  {
    name: "Minimalist Leather Backpack",
    description: "Premium handcrafted genuine leather backpack with dedicated 15-inch laptop compartment.",
    price: 119.50,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
    stock: 12
  },
  {
    name: "Ergonomic LED Desk Lamp",
    description: "Touch control LED desk lamp with wireless phone charging pad and 5 color temperature settings.",
    price: 49.99,
    category: "Home",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",
    stock: 40
  },
  {
    name: "Artisan Ceramic Mug Set",
    description: "Set of 4 matte ceramic mugs with heat-insulating wooden handles, perfect for coffee or tea.",
    price: 34.99,
    category: "Home",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    stock: 50
  },
  {
    name: "RGB Mechanical Keyboard",
    description: "Hot-swappable mechanical keyboard with custom linear switches and per-key RGB illumination.",
    price: 129.99,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
    stock: 15
  },
  {
    name: "Urban Canvas Jacket",
    description: "Stylish weather-resistant canvas jacket tailored with soft cotton lining for all-season wear.",
    price: 79.99,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    stock: 22
  }
];

const getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== "All") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    let products = await Product.find(query).sort({ createdAt: -1 });

    // If no products exist in DB yet and no search filter applied, seed automatically
    if (products.length === 0 && !category && !search) {
      const count = await Product.countDocuments();
      if (count === 0) {
        products = await Product.insertMany(initialProducts);
      }
    }

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;
    
    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: "Name, description, price, and category are required" });
    }

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      category,
      image: image || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80",
      stock: Number(stock) || 10
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({
      message: "Failed to create product",
      error: error.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: "Failed to update product", error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
};

const seedProducts = async (req, res) => {
  try {
    await Product.deleteMany({});
    const products = await Product.insertMany(initialProducts);
    res.status(201).json({ message: "Database seeded successfully", products });
  } catch (error) {
    res.status(500).json({ message: "Failed to seed products", error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  seedProducts
};