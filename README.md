# 🛒 ShopSphere — Full-Stack MERN E-Commerce Platform

ShopSphere is a responsive e-commerce web application engineered with the MERN stack (MongoDB, Express.js, React, Node.js) and Vite. The platform features an end-to-end shopping workflow for customers alongside an administrative control panel for inventory, order tracking, and catalog management.

---

## ✨ Core Features

### 🛍️ Storefront & Customer Experience
* 🔍 **Multi-Criteria Search & Filters:** Search by keyword, filter by dynamic price slider and stock availability, and sort by price, date, or customer rating.
* 📦 **Product Quick View & Recommendations:** Detailed modal view with high-resolution image previews, stock alerts, and category-based "You May Also Like" product suggestions.
* ⭐ **Customer Reviews & Ratings:** Authenticated review submission engine with 1–5 star ratings, duplicate prevention, and real-time average calculation.
* ❤️ **Persistent Cart & Wishlist:** Client-side local persistence for cart items and favorite products across browser sessions.
* 🏷️ **Promo Code & Coupon Engine:** Dynamic promo code validation with subtotal checks and instant discount recalculations.
* 👤 **Customer Account Dashboard:** Key account metrics (Total Orders, Total Spent), expandable order history with fulfillment statuses, and profile management.

### ⚙️ Admin Console
* 🔒 **Role-Based Access Control:** Secure JWT route protection ensuring administrative actions remain isolated from regular customers.
* 📊 **Product Catalog Management:** Complete CRUD operations for products, including live image uploads via Multer.
* 📦 **Stock Management:** Automated inventory decrements on checkout with out-of-stock indicators.
* 🚚 **Order Processing Pipeline:** Real-time order lifecycle status management (Pending, Processing, Shipped, Delivered, Cancelled).
* 🎟️ **Coupon Manager:** Interface to generate, inspect, and remove discount codes with minimum spend thresholds.

---

## 🛠️ Technology Stack

* 💻 **Frontend:** React 18, Vite, Context API, Modern Glassmorphic Dark UI
* ⚙️ **Backend:** Node.js, Express.js, RESTful API Architecture
* 🗄️ **Database:** MongoDB Atlas with Mongoose ODM
* 🔐 **Security:** JSON Web Tokens (JWT) and Bcrypt password hashing
* 📁 **Asset Handling:** Multer middleware for file storage and serving

---

## 🚀 Installation & Local Setup

### Prerequisites
* Node.js (v18+)
* MongoDB Atlas connection URI or local MongoDB instance

### Backend Setup
1. Open the backend directory:
   ```bash
   cd backend
