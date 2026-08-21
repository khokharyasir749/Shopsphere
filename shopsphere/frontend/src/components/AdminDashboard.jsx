import React, { useState, useEffect } from "react";

export default function AdminDashboard({ user, showToast, onExit }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Coupon State
  const [coupons, setCoupons] = useState([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "percentage",
    discountAmount: "",
    minPurchase: "",
    expiresAt: "",
    isActive: true
  });

  // Modals for products
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "", description: "", price: "", category: "Electronics", image: "", stock: 10
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setIsUploadingImage(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setProductForm({ ...productForm, image: `${data.imagePath}` });
        showToast("Image uploaded successfully");
      } else {
        showToast(data.message || "Failed to upload image");
      }
    } catch (err) {
      showToast("Error uploading image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const getToken = () => localStorage.getItem("shopsphere_token");

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (res.ok) setProducts(data);
    } finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (res.ok) setOrders(data);
    } finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } finally { setLoading(false); }
  };

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coupons", { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (res.ok) setCoupons(data);
    } finally { setLoading(false); }
  };

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discountAmount) {
      showToast("Code and discount amount are required");
      return;
    }
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          ...couponForm,
          discountAmount: Number(couponForm.discountAmount),
          minPurchase: Number(couponForm.minPurchase) || 0,
          expiresAt: couponForm.expiresAt || null
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Coupon created successfully");
        fetchCoupons();
        setIsCouponModalOpen(false);
        setCouponForm({ code: "", discountType: "percentage", discountAmount: "", minPurchase: "", expiresAt: "", isActive: true });
      } else {
        showToast(data.message || "Failed to create coupon");
      }
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        showToast("Coupon deleted successfully");
        fetchCoupons();
      } else {
        showToast("Failed to delete coupon");
      }
    } catch (err) {
      showToast(err.message);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchStats();
      if (activeTab === "products") fetchProducts();
      if (activeTab === "orders") fetchOrders();
      if (activeTab === "users") fetchUsers();
      if (activeTab === "coupons") fetchCoupons();
    }
  }, [activeTab, user]);

  if (user?.role !== "admin") {
    return (
      <div className="empty-state">
        <div className="empty-icon">🚫</div>
        <h3>Access Denied</h3>
        <p>You do not have permission to view the admin panel.</p>
        <button className="add-cart-btn" onClick={onExit}>Back to Store</button>
      </div>
    );
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!editingProduct;
    const url = isEdit ? `/api/products/${editingProduct._id}` : "/api/products";
    const method = isEdit ? "PUT" : "POST";
    
    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}` // If product creation requires auth
        },
        body: JSON.stringify(productForm)
      });
      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? "Product updated" : "Product created");
        fetchProducts();
        setIsProductModalOpen(false);
      } else {
        showToast(data.message || "Failed to save product");
      }
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        showToast("Product deleted");
        fetchProducts();
      } else {
        showToast("Failed to delete product");
      }
    } catch (err) {
      showToast(err.message);
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Order status updated to ${status}`);
        fetchOrders();
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to update status");
      }
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Admin Control Panel</h2>
        <div style={{display: "flex", gap: "1rem"}}>
          <button className="view-details-btn" onClick={fetchStats} style={{margin: 0}}>↻ Refresh</button>
          <button className="add-cart-btn" onClick={onExit}>Exit Admin</button>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>Overview</button>
        <button className={activeTab === "products" ? "active" : ""} onClick={() => setActiveTab("products")}>Products</button>
        <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>Orders</button>
        <button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>Users</button>
        <button className={activeTab === "coupons" ? "active" : ""} onClick={() => setActiveTab("coupons")}>Coupons</button>
      </div>

      <div className="admin-content">
        {activeTab === "overview" && stats && (
          <div className="admin-metrics-grid">
            <div className="admin-metric-card">
              <h4>Total Revenue</h4>
              <div className="value">${stats.totalSales.toFixed(2)}</div>
            </div>
            <div className="admin-metric-card">
              <h4>Total Orders</h4>
              <div className="value">{stats.totalOrders}</div>
            </div>
            <div className="admin-metric-card">
              <h4>Pending Orders</h4>
              <div className="value" style={{color: "#facc15"}}>{stats.pendingOrders}</div>
            </div>
            <div className="admin-metric-card">
              <h4>Total Products</h4>
              <div className="value">{stats.totalProducts}</div>
            </div>
            <div className="admin-metric-card">
              <h4>Total Users</h4>
              <div className="value">{stats.totalUsers}</div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="admin-panel-section">
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "1rem"}}>
              <h3>Inventory Management</h3>
              <button className="add-cart-btn" onClick={() => {
                setEditingProduct(null);
                setProductForm({ name: "", description: "", price: "", category: "Electronics", image: "", stock: 10 });
                setIsProductModalOpen(true);
              }}>+ Add Product</button>
            </div>
            {loading ? <p>Loading...</p> : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p._id}>
                      <td><img src={p.image} alt={p.name} style={{width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover"}}/></td>
                      <td>{p.name}</td>
                      <td>{p.category}</td>
                      <td>${p.price}</td>
                      <td>{p.stock}</td>
                      <td>
                        <button className="text-btn" onClick={() => {
                          setEditingProduct(p);
                          setProductForm({ name: p.name, description: p.description, price: p.price, category: p.category, image: p.image, stock: p.stock });
                          setIsProductModalOpen(true);
                        }}>Edit</button>
                        <button className="text-btn danger" onClick={() => handleDeleteProduct(p._id)} style={{marginLeft: "0.5rem", color: "#f87171"}}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="admin-panel-section">
            <h3>Orders Overview</h3>
            {loading ? <p>Loading...</p> : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <React.Fragment key={o._id}>
                      <tr>
                        <td style={{fontFamily: "monospace"}}>{o._id.slice(-8).toUpperCase()}</td>
                        <td>{o.user ? o.user.name : "Unknown"}</td>
                        <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td>${o.totalAmount.toFixed(2)}</td>
                        <td>
                          <select 
                            className="admin-status-select" 
                            value={o.status}
                            onChange={(e) => updateOrderStatus(o._id, e.target.value)}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td>
                          <button className="text-btn" onClick={() => setExpandedOrderId(expandedOrderId === o._id ? null : o._id)}>
                            {expandedOrderId === o._id ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>
                      {expandedOrderId === o._id && (
                        <tr className="admin-expanded-row">
                          <td colSpan="6">
                            <div className="admin-expanded-content">
                              <div>
                                <strong>Shipping Address:</strong><br/>
                                {o.shippingAddress?.fullName}<br/>
                                {o.shippingAddress?.address}, {o.shippingAddress?.city}, {o.shippingAddress?.postalCode}<br/>
                                {o.shippingAddress?.country}
                              </div>
                              <div style={{marginTop: "1rem"}}>
                                <strong>Items:</strong>
                                <ul style={{marginTop: "0.5rem", paddingLeft: "1.2rem"}}>
                                  {o.items.map((item, idx) => (
                                    <li key={idx}>{item.name} (x{item.quantity}) - ${(item.price * item.quantity).toFixed(2)}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="admin-panel-section">
            <h3>Registered Users</h3>
            {loading ? <p>Loading...</p> : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td style={{fontFamily: "monospace", fontSize: "0.85rem"}}>{u._id}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td><span className="role-badge">{u.role}</span></td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "coupons" && (
          <div className="admin-panel-section">
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "1rem"}}>
              <h3>Coupons & Promo Codes</h3>
              <button className="add-cart-btn" onClick={() => {
                setCouponForm({ code: "", discountType: "percentage", discountAmount: "", minPurchase: "", expiresAt: "", isActive: true });
                setIsCouponModalOpen(true);
              }}>+ Add Coupon</button>
            </div>
            {loading ? <p>Loading...</p> : coupons.length === 0 ? (
              <p style={{color: "var(--text-muted)", fontStyle: "italic"}}>No coupons found. Create one to get started!</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Min Spend</th>
                    <th>Expires At</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c._id}>
                      <td style={{fontFamily: "monospace", fontWeight: "bold", color: "var(--accent-cyan)"}}>{c.code}</td>
                      <td>{c.discountType === "percentage" ? `${c.discountAmount}%` : `$${c.discountAmount}`}</td>
                      <td>${Number(c.minPurchase).toFixed(2)}</td>
                      <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}</td>
                      <td>
                        <span className="role-badge" style={{
                          background: c.isActive ? "rgba(74, 222, 128, 0.1)" : "rgba(244, 63, 94, 0.1)",
                          color: c.isActive ? "#4ade80" : "#f43f5e",
                          border: c.isActive ? "1px solid rgba(74, 222, 128, 0.2)" : "1px solid rgba(244, 63, 94, 0.2)"
                        }}>
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <button className="text-btn danger" onClick={() => handleDeleteCoupon(c._id)} style={{color: "#f87171"}}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {isProductModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsProductModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
              <button className="close-btn" onClick={() => setIsProductModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleProductSubmit} className="modal-body">
              <div className="form-group"><label>Name *</label><input type="text" required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} /></div>
              <div className="form-group"><label>Description *</label><textarea required rows="3" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group"><label>Price *</label><input type="number" required min="0" step="0.01" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} /></div>
                <div className="form-group"><label>Stock *</label><input type="number" required min="0" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Category *</label>
                <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}>
                  <option value="Electronics">Electronics</option><option value="Fashion">Fashion</option><option value="Home">Home</option><option value="Accessories">Accessories</option><option value="Sports">Sports</option>
                </select>
              </div>
              <div className="form-group">
                <label>Image Upload</label>
                <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} disabled={isUploadingImage} />
                {isUploadingImage && <small style={{color: "var(--accent-cyan)"}}>Uploading image...</small>}
              </div>
              <div className="form-group">
                <label>Or Image URL (optional)</label>
                <input type="url" value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} />
                {productForm.image && <img src={productForm.image} alt="Preview" style={{marginTop: "0.5rem", maxWidth: "100px", borderRadius: "4px"}} />}
              </div>
              <button type="submit" className="submit-btn">{editingProduct ? "Save Changes" : "Create Product"}</button>
            </form>
          </div>
        </div>
      )}

      {isCouponModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCouponModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Coupon</h3>
              <button className="close-btn" onClick={() => setIsCouponModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCouponSubmit} className="modal-body">
              <div className="form-group">
                <label>Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER50"
                  value={couponForm.code}
                  onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                  style={{ textTransform: "uppercase" }}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select
                    value={couponForm.discountType}
                    onChange={e => setCouponForm({...couponForm, discountType: e.target.value})}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="e.g. 15 or 10.00"
                    value={couponForm.discountAmount}
                    onChange={e => setCouponForm({...couponForm, discountAmount: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Min Spend ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 50.00"
                    value={couponForm.minPurchase}
                    onChange={e => setCouponForm({...couponForm, minPurchase: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={couponForm.expiresAt}
                    onChange={e => setCouponForm({...couponForm, expiresAt: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={couponForm.isActive}
                  onChange={e => setCouponForm({...couponForm, isActive: e.target.checked})}
                  style={{ width: "auto" }}
                />
                <label htmlFor="isActive" style={{ margin: 0, cursor: "pointer" }}>Is Coupon Active?</label>
              </div>
              <button type="submit" className="submit-btn" style={{ marginTop: "1rem" }}>Create Coupon</button>
            </form>
          </div>
        </div>
      )}

      <footer className="admin-footer">
        <div className="admin-footer-left">
          ShopSphere Admin Console &bull; v1.0.0
          <span className="server-status">🟢 API Connected</span>
        </div>
        <div className="admin-footer-center">
          <a href="#store" onClick={(e) => { e.preventDefault(); onExit(); }}>Storefront</a>
          <a href="#docs" onClick={(e) => e.preventDefault()}>Documentation</a>
          <a href="#support" onClick={(e) => e.preventDefault()}>Support</a>
        </div>
        <div className="admin-footer-right">
          &copy; {new Date().getFullYear()} ShopSphere. Logged in as Administrator ({user.email})
        </div>
      </footer>
    </div>
  );
}
