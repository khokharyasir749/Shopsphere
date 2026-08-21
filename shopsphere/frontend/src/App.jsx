import { useState, useEffect } from "react";
import AdminDashboard from "./components/AdminDashboard";
import "./App.css";

const CATEGORIES = ["All", "Electronics", "Fashion", "Home", "Accessories", "Sports"];

const DEFAULT_PRODUCTS = [
  {
    _id: "seed-1",
    name: "Smart Watch Pro",
    description: "Advanced fitness tracker with vibrant AMOLED display, blood oxygen monitoring, and 7-day battery life.",
    price: 149.99,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    stock: 25
  },
  {
    _id: "seed-2",
    name: "Wireless ANC Headphones",
    description: "High-fidelity active noise cancelling headphones featuring 40mm drivers and 30-hour battery life.",
    price: 199.99,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    stock: 18
  },
  {
    _id: "seed-3",
    name: "Ultra Lightweight Running Shoes",
    description: "Ergonomic breathable mesh running shoes built for maximum speed, cushioning, and daily road comfort.",
    price: 89.99,
    category: "Footwear",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    stock: 30
  },
  {
    _id: "seed-4",
    name: "Minimalist Leather Backpack",
    description: "Premium handcrafted genuine leather backpack with dedicated 15-inch laptop compartment.",
    price: 119.50,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
    stock: 12
  },
  {
    _id: "seed-5",
    name: "Ergonomic LED Desk Lamp",
    description: "Touch control LED desk lamp with wireless phone charging pad and 5 color temperature settings.",
    price: 49.99,
    category: "Home",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",
    stock: 40
  },
  {
    _id: "seed-6",
    name: "Artisan Ceramic Mug Set",
    description: "Set of 4 matte ceramic mugs with heat-insulating wooden handles, perfect for coffee or tea.",
    price: 34.99,
    category: "Home",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    stock: 50
  }
];

// (No mock orders - real orders fetched from API)

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("shopsphere_cart");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [toast, setToast] = useState(null);
  const [currentView, setCurrentView] = useState("store");

  // Auth State
  const [user, setUser] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });

  // Profile Update State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "", email: "", currentPassword: "", newPassword: "", confirmPassword: ""
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Orders State
  const [myOrders, setMyOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    fullName: "", address: "", city: "", postalCode: "", country: ""
  });
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "Electronics",
    image: "",
    stock: 10
  });

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const token = localStorage.getItem("shopsphere_token");
    if (token) {
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data._id) setUser(data);
      })
      .catch(() => localStorage.removeItem("shopsphere_token"));
    }
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("shopsphere_token", data.token);
        setUser(data);
        setIsAuthModalOpen(false);
        showToast(`✅ Welcome, ${data.name}!`);
        setAuthForm({ name: "", email: "", password: "" });
      } else {
        throw new Error(data.message || "Authentication failed");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("shopsphere_token");
    setUser(null);
    setShowDashboard(false);
    setCurrentView("store");
    showToast("👋 Logged out successfully");
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      return showToast("❌ New passwords do not match");
    }
    
    setProfileLoading(true);
    try {
      const token = localStorage.getItem("shopsphere_token");
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          currentPassword: profileForm.currentPassword,
          newPassword: profileForm.newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        localStorage.setItem("shopsphere_token", data.token);
        setIsEditingProfile(false);
        showToast("✅ Profile updated successfully!");
        setProfileForm({...profileForm, currentPassword: "", newPassword: "", confirmPassword: ""});
      } else {
        showToast(`❌ ${data.message || "Failed to update profile"}`);
      }
    } catch (err) {
      showToast("❌ Error updating profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = "/api/products";
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
      } else if (!searchQuery && selectedCategory === "All") {
        // Fallback to default products if DB is completely empty
        setProducts(DEFAULT_PRODUCTS);
      } else {
        setProducts(data);
      }
    } catch (err) {
      console.warn("Using fallback local data due to network/API error:", err.message);
      // Filter default products locally as fallback
      let filtered = DEFAULT_PRODUCTS;
      if (selectedCategory !== "All") {
        filtered = filtered.filter((p) => p.category === selectedCategory);
      }
      if (searchQuery.trim()) {
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      setProducts(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    if (showDashboard && user) fetchMyOrders();
  }, [showDashboard]);

  useEffect(() => {
    localStorage.setItem("shopsphere_cart", JSON.stringify(cart));
  }, [cart]);

  // Cart operations
  const addToCart = (product, requestedQty = 1) => {
    const existingItem = cart.find(item => item.product._id === product._id);
    const currentQty = existingItem ? existingItem.quantity : 0;
    
    if (currentQty + requestedQty > product.stock) {
      showToast(`❌ Cannot add more than ${product.stock} items. Available stock: ${product.stock - currentQty}`);
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product._id === product._id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += requestedQty;
        return updated;
      } else {
        return [...prev, { product, quantity: requestedQty }];
      }
    });
    showToast(`✅ Added ${requestedQty > 1 ? requestedQty + 'x ' : ''}"${product.name}" to your cart! 🛒`);
  };

  const updateQuantity = (productId, delta) => {
    const item = cart.find(i => i.product._id === productId);
    if (!item) return;
    
    if (item.quantity + delta > item.product.stock) {
      showToast(`❌ Limit reached. Only ${item.product.stock} in stock.`);
      return;
    }

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product._id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
    showToast("Item removed from cart");
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Add Product Submit
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.description || !newProduct.price) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        showToast("✅ Product created successfully!");
        setIsAddModalOpen(false);
        setNewProduct({
          name: "",
          description: "",
          price: "",
          category: "Electronics",
          image: "",
          stock: 10
        });
        fetchProducts();
      } else {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create product");
      }
    } catch (err) {
      // Local fallback creation
      const createdLocally = {
        ...newProduct,
        _id: `local-${Date.now()}`,
        price: Number(newProduct.price),
        image:
          newProduct.image ||
          "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80"
      };
      setProducts((prev) => [createdLocally, ...prev]);
      showToast("✅ Product added to view catalog!");
      setIsAddModalOpen(false);
    }
  };

  const fetchMyOrders = async () => {
    const token = localStorage.getItem("shopsphere_token");
    if (!token) return;
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/orders/my-orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setMyOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    const token = localStorage.getItem("shopsphere_token");
    if (!token) {
      setIsCheckoutOpen(false);
      setAuthMode("login");
      setIsAuthModalOpen(true);
      showToast("Please log in to place an order");
      return;
    }
    setCheckoutLoading(true);
    try {
      const items = cart.map(item => ({
        productId: item.product._id,
        quantity: item.quantity
      }));
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items, shippingAddress: shippingForm })
      });
      const data = await res.json();
      if (res.ok) {
        setCart([]);
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
        setShippingForm({ fullName: "", address: "", city: "", postalCode: "", country: "" });
        showToast(`🎉 Order placed! Total: $${data.totalAmount.toFixed(2)}`);
      } else {
        throw new Error(data.message || "Checkout failed");
      }
    } catch (err) {
      showToast(`❌ ${err.message}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className="toast">{toast}</div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo" onClick={() => { setSelectedCategory("All"); setSearchQuery(""); setShowDashboard(false); setCurrentView("store"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <div className="logo-icon">🛍️</div>
          <span>Shop<span className="logo-badge">Sphere</span></span>
        </div>

        <div className={`nav-links ${isMobileMenuOpen ? "open" : ""}`}>
          <a href="#home" onClick={(e) => { e.preventDefault(); setShowDashboard(false); setCurrentView("store"); setIsMobileMenuOpen(false); }}>Home</a>
          <a href="#products" onClick={(e) => { e.preventDefault(); setSelectedCategory("All"); setShowDashboard(false); setCurrentView("store"); setIsMobileMenuOpen(false); }}>Products</a>
          <a href="#categories" onClick={(e) => { e.preventDefault(); setShowDashboard(false); setCurrentView("store"); setIsMobileMenuOpen(false); }}>Categories</a>
          <div className="search-nav-item">
            <span className="search-icon-nav">🔍</span>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="nav-controls">
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? "✕" : "☰"}
          </button>
          
          {user ? (
             <div style={{display: "flex", alignItems: "center", gap: "1rem"}}>
                {user.role === "admin" && (
                  <button className="text-btn" onClick={() => setCurrentView("admin")} style={{marginRight: "0.5rem", color: "var(--accent-cyan)", fontWeight: 600}}>Admin Panel</button>
                )}
                <span onClick={() => { setShowDashboard(true); setCurrentView("store"); setIsMobileMenuOpen(false); }} style={{color: "var(--text-main)", fontWeight: 600, cursor: "pointer"}} className="user-greeting">Hi, {user.name.split(' ')[0]}</span>
                <button className="add-product-btn" onClick={handleLogout} style={{padding: "0.4rem 0.8rem"}}>Logout</button>
             </div>
          ) : (
             <button className="add-product-btn" onClick={() => { setAuthMode("login"); setIsAuthModalOpen(true); }} style={{padding: "0.4rem 0.8rem"}}>Login</button>
          )}

          <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
            <span>🛒</span> Cart
            {totalCartCount > 0 && <span className="cart-badge">{totalCartCount}</span>}
          </button>
        </div>
      </nav>

      {currentView === "admin" ? (
        <AdminDashboard user={user} showToast={showToast} onExit={() => setCurrentView("store")} />
      ) : showDashboard && user ? (
        <main className="dashboard-container">
          <div className="dashboard-header">
            <h2>My Dashboard</h2>
            <button className="add-cart-btn" onClick={() => setShowDashboard(false)}>← Back to Shop</button>
          </div>
          <div className="dashboard-content">
            <div className="profile-section">
              <h3>Profile</h3>
              {!isEditingProfile ? (
                <div className="profile-card">
                  <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
                  <div className="profile-info">
                    <h4>{user.name}</h4>
                    <p>{user.email}</p>
                    <span className="role-badge">{user.role}</span>
                  </div>
                  <button className="text-btn" style={{marginTop: "1rem", color: "var(--accent-cyan)", display: "block"}} onClick={() => { setProfileForm({...profileForm, name: user.name, email: user.email}); setIsEditingProfile(true); }}>Edit Profile & Security</button>
                </div>
              ) : (
                <div className="profile-card edit-mode" style={{width: "100%", maxWidth: "500px"}}>
                  <h4>Edit Profile & Security</h4>
                  <form onSubmit={handleProfileUpdate} style={{marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem"}}>
                    <div className="form-group"><label>Name</label><input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} required/></div>
                    <div className="form-group"><label>Email</label><input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} required/></div>
                    
                    <div style={{borderTop: "1px solid rgba(255,255,255,0.05)", margin: "1rem 0", paddingTop: "1rem"}}>
                      <h5 style={{marginBottom: "1rem", color: "var(--text-muted)", fontSize: "0.9rem"}}>Change Password (Optional)</h5>
                      <div className="form-group"><label>Current Password</label><input type="password" value={profileForm.currentPassword} onChange={e => setProfileForm({...profileForm, currentPassword: e.target.value})} placeholder="Leave blank to keep current" /></div>
                      <div className="form-group"><label>New Password</label><input type="password" value={profileForm.newPassword} onChange={e => setProfileForm({...profileForm, newPassword: e.target.value})} /></div>
                      <div className="form-group"><label>Confirm New Password</label><input type="password" value={profileForm.confirmPassword} onChange={e => setProfileForm({...profileForm, confirmPassword: e.target.value})} /></div>
                    </div>
                    
                    <div style={{display: "flex", gap: "1rem", marginTop: "0.5rem"}}>
                      <button type="submit" className="add-cart-btn" style={{flex: 1}} disabled={profileLoading}>{profileLoading ? "Saving..." : "Save Changes"}</button>
                      <button type="button" className="view-details-btn" style={{flex: 1}} onClick={() => setIsEditingProfile(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
            <div className="orders-section">
              <h3>Order History</h3>
              {ordersLoading ? (
                <div style={{padding: "2rem", textAlign: "center", color: "var(--text-muted)"}}>Loading orders...</div>
              ) : myOrders.length === 0 ? (
                <div className="empty-state" style={{margin: 0}}>
                  <div className="empty-icon">📦</div>
                  <h3>No orders yet</h3>
                  <p>Start shopping and your orders will appear here.</p>
                  <button className="add-cart-btn" onClick={() => setShowDashboard(false)}>Shop Now</button>
                </div>
              ) : (
                <div className="orders-grid">
                  {myOrders.map(order => (
                    <div key={order._id} className="order-card">
                      <div className="order-header">
                        <span className="order-id">#{order._id.slice(-8).toUpperCase()}</span>
                        <span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span>
                      </div>
                      <div className="order-details-text">
                        <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                        <p>Items: {order.items.reduce((s, i) => s + i.quantity, 0)}</p>
                        <p className="order-total">Total: ${order.totalAmount.toFixed(2)}</p>
                      </div>
                      <button
                        className="view-details-btn"
                        onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                      >
                        {expandedOrder === order._id ? "▲ Hide Details" : "▼ View Details"}
                      </button>
                      {expandedOrder === order._id && (
                        <div className="order-expanded">
                          <p style={{fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "0.5rem", marginTop: "0.75rem"}}>ITEMS</p>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="order-item-row">
                              <span>{item.name}</span>
                              <span>x{item.quantity} &mdash; ${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          <p style={{fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "0.5rem", marginTop: "0.75rem"}}>SHIPPING TO</p>
                          <p style={{fontSize: "0.85rem", color: "var(--text-muted)"}}>{order.shippingAddress.fullName}, {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      ) : (
        <>
          {/* HERO SECTION */}
          <section className="hero">
            <div className="hero-content">
          <div className="tagline-pill">
            <span>✨</span> Next-Gen E-Commerce Experience
          </div>
          <h1>
            Discover Quality Products <br />
            <span>Built for Modern Living</span>
          </h1>
          <p className="hero-text">
            Shop the latest electronics, fashion, home essentials, and lifestyle accessories. Enjoy fast shipping, secure payment, and premium quality guarantee.
          </p>

          <div className="hero-stats">
            <div className="stat-item">
              <h3>100%</h3>
              <p>Authentic Items</p>
            </div>
            <div className="stat-item">
              <h3>24/7</h3>
              <p>Customer Care</p>
            </div>
            <div className="stat-item">
              <h3>Free</h3>
              <p>Shipping $50+</p>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH & FILTER SECTION */}
      <div className="filter-section">
        <div className="filter-bar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search products by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="category-pills">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN PRODUCTS DISPLAY */}
      <main className="products-container">
        <div className="section-header">
          <h2>
            {selectedCategory === "All" ? "Featured Products" : `${selectedCategory} Collection`}
          </h2>
          <span className="product-count">{products.length} Items Available</span>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <h3>Loading Collection...</h3>
            <p>Fetching the latest catalog items for you.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No Products Found</h3>
            <p>Try adjusting your search criteria or category filter.</p>
            <button
              className="add-cart-btn"
              onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <div key={product._id} className="product-card">
                <div className="card-image-wrap" onClick={() => { setSelectedProduct(product); setModalQuantity(1); }}>
                  <img
                    src={product.image || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80"}
                    alt={product.name}
                  />
                  {product.stock <= 0 && <span className="out-of-stock-badge">Out of Stock</span>}
                  <span className="category-tag">{product.category}</span>
                </div>

                <div className="card-body">
                  <h3 onClick={() => { setSelectedProduct(product); setModalQuantity(1); }}>{product.name}</h3>
                  <p className="product-desc">{product.description}</p>

                  <div className="card-footer">
                    <span className="price">${Number(product.price).toFixed(2)}</span>
                    <span className="stock-info" style={{fontSize: "0.8rem", color: "var(--text-muted)"}}>Stock: {product.stock}</span>
                  </div>
                  <div className="card-actions" style={{marginTop: "0.75rem", display: "flex", gap: "0.5rem"}}>
                    <button 
                      className="add-cart-btn" 
                      style={{flex: 1, opacity: product.stock <= 0 ? 0.5 : 1}} 
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                    >
                      {product.stock <= 0 ? "Out of Stock" : "+ Add to Cart"}
                    </button>
                    <button className="view-details-btn" style={{flex: 1, background: "rgba(255,255,255,0.05)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", fontWeight: 600, fontSize: "0.85rem"}} onClick={() => { setSelectedProduct(product); setModalQuantity(1); }}>
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      </>
      )}

      {/* SLIDE-OVER CART DRAWER */}
      {isCartOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setIsCartOpen(false)} />
          <div className="cart-drawer">
            <div className="drawer-header">
              <h3>Shopping Cart ({totalCartCount})</h3>
              <button className="close-btn" onClick={() => setIsCartOpen(false)}>✕</button>
            </div>

            <div className="drawer-body">
              {cart.length === 0 ? (
                <div className="empty-state" style={{ background: "transparent", border: "none" }}>
                  <div className="empty-icon">🛒</div>
                  <h3>Your cart is empty</h3>
                  <p>Add some awesome products from the catalog!</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product._id} className="cart-item">
                    <img src={item.product.image} alt={item.product.name} />
                    <div className="cart-item-details">
                      <div className="cart-item-title">{item.product.name}</div>
                      <div className="cart-item-price">${(item.product.price * item.quantity).toFixed(2)}</div>
                      <div className="qty-controls">
                        <button className="qty-btn" onClick={() => updateQuantity(item.product._id, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button 
                          className="qty-btn" 
                          onClick={() => updateQuantity(item.product._id, 1)}
                          disabled={item.quantity >= item.product.stock}
                          style={{ opacity: item.quantity >= item.product.stock ? 0.5 : 1 }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button className="remove-item-btn" onClick={() => removeFromCart(item.product._id)}>🗑️</button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="drawer-footer">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>${cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Estimated Shipping</span>
                  <span>{cartSubtotal >= 50 ? "FREE" : "$4.99"}</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>${(cartSubtotal >= 50 ? cartSubtotal : cartSubtotal + 4.99).toFixed(2)}</span>
                </div>

                <button className="checkout-btn" onClick={() => setIsCheckoutOpen(true)}>
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* CHECKOUT / SHIPPING MODAL */}
      {isCheckoutOpen && (
        <div className="modal-backdrop" onClick={() => setIsCheckoutOpen(false)}>
          <div className="modal-content" style={{maxWidth: "480px"}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📦 Shipping Details</h3>
              <button className="close-btn" onClick={() => setIsCheckoutOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCheckout} className="modal-body">
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" required placeholder="John Doe" value={shippingForm.fullName} onChange={e => setShippingForm({...shippingForm, fullName: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Address *</label>
                <input type="text" required placeholder="123 Main St" value={shippingForm.address} onChange={e => setShippingForm({...shippingForm, address: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input type="text" required placeholder="New York" value={shippingForm.city} onChange={e => setShippingForm({...shippingForm, city: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Postal Code *</label>
                  <input type="text" required placeholder="10001" value={shippingForm.postalCode} onChange={e => setShippingForm({...shippingForm, postalCode: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Country *</label>
                <input type="text" required placeholder="United States" value={shippingForm.country} onChange={e => setShippingForm({...shippingForm, country: e.target.value})} />
              </div>
              <div style={{background: "var(--bg-input)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.9rem"}}>
                <div style={{display: "flex", justifyContent: "space-between", color: "var(--text-muted)"}}>
                  <span>Cart Total</span><span>${cartSubtotal.toFixed(2)}</span>
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={checkoutLoading}>
                {checkoutLoading ? "Placing Order..." : `🎉 Place Order - $${cartSubtotal.toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAuthModalOpen(false)}>
          <div className="modal-content" style={{maxWidth: "400px"}} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{authMode === "login" ? "Welcome Back" : "Create Account"}</h3>
              <button className="close-btn" onClick={() => setIsAuthModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAuthSubmit} className="modal-body">
              {authMode === "register" && (
                <div className="form-group">
                  <label>Name *</label>
                  <input type="text" required placeholder="John Doe" value={authForm.name} onChange={(e) => setAuthForm({...authForm, name: e.target.value})} />
                </div>
              )}
              <div className="form-group">
                <label>Email *</label>
                <input type="email" required placeholder="john@example.com" value={authForm.email} onChange={(e) => setAuthForm({...authForm, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input type="password" required placeholder="••••••••" value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})} />
              </div>
              <button type="submit" className="submit-btn" style={{marginTop: "1rem"}}>
                {authMode === "login" ? "Sign In" : "Register"}
              </button>
              <p style={{textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem", color: "var(--text-muted)"}}>
                {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
                <span style={{color: "var(--primary)", cursor: "pointer", fontWeight: 600}} onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
                  {authMode === "login" ? "Sign Up" : "Sign In"}
                </span>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Product</h3>
              <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateProduct} className="modal-body">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ergonomic Office Chair"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="99.99"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe the product details and key features..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                />
              </div>

              <button type="submit" className="submit-btn">
                Publish Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT QUICK VIEW MODAL */}
      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" style={{ maxWidth: "680px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedProduct.name}</h3>
              <button className="close-btn" onClick={() => setSelectedProduct(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="product-detail-layout">
                <div style={{ position: "relative" }}>
                  <img
                    src={selectedProduct.image || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80"}
                    alt={selectedProduct.name}
                  />
                  {selectedProduct.stock <= 0 && <span className="out-of-stock-badge">Out of Stock</span>}
                </div>
                <div className="product-detail-info">
                  <span className="category-tag" style={{ position: "static", display: "inline-block", marginBottom: "0.5rem" }}>
                    {selectedProduct.category}
                  </span>
                  <h2>{selectedProduct.name}</h2>
                  <div className="product-detail-price">${Number(selectedProduct.price).toFixed(2)}</div>
                  <p style={{fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "0.5rem"}}>
                    Stock Status: <span style={{color: selectedProduct.stock > 0 ? '#4ade80' : '#f87171', fontWeight: 600}}>{selectedProduct.stock > 0 ? `${selectedProduct.stock} Available` : 'Out of Stock'}</span>
                  </p>
                  <p className="product-desc" style={{ WebkitLineClamp: "none", marginBottom: "1.5rem", flex: 1 }}>
                    {selectedProduct.description}
                  </p>

                  <div style={{display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem"}}>
                    <span style={{fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600}}>Quantity:</span>
                    <div className="qty-controls" style={{background: "var(--bg-input)", padding: "0.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginTop: 0}}>
                      <button type="button" className="qty-btn" onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}>-</button>
                      <span style={{width: "36px", textAlign: "center", fontWeight: 700}}>{modalQuantity}</span>
                      <button type="button" className="qty-btn" onClick={() => setModalQuantity(Math.min(selectedProduct.stock, modalQuantity + 1))}>+</button>
                    </div>
                  </div>

                  <button
                    className="submit-btn"
                    disabled={selectedProduct.stock === 0}
                    style={{opacity: selectedProduct.stock === 0 ? 0.5 : 1, padding: "1rem", fontSize: "1.05rem"}}
                    onClick={() => {
                      if (selectedProduct.stock > 0) {
                        addToCart(selectedProduct, modalQuantity);
                        setSelectedProduct(null);
                      }
                    }}
                  >
                    {selectedProduct.stock > 0 ? `🛒 Add to Cart - $${(selectedProduct.price * modalQuantity).toFixed(2)}` : 'Out of Stock'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer>
        <div className="footer-content">
          <div className="footer-logo">ShopSphere</div>
          <div className="footer-links">
            <a href="#home">Home</a>
            <a href="#products">Products</a>
            <a href="#about">About Us</a>
            <a href="#support">Customer Support</a>
          </div>
          <p className="copyright">© 2026 ShopSphere. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;