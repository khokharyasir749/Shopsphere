import React, { useState, useEffect } from "react";

export default function UserDashboard({ user, setUser, showToast, onExit }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // Orders Filter State
  const [orderFilter, setOrderFilter] = useState("All");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Profile Update State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchMyOrders = async () => {
    const token = localStorage.getItem("shopsphere_token");
    if (!token) return;
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/orders/my-orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

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

  // Derived Metrics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "Pending" || o.status === "Processing").length;
  const deliveredOrders = orders.filter(o => o.status === "Delivered").length;
  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  
  const latestOrder = orders.length > 0 ? orders.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b) : null;
  const filteredOrders = orderFilter === "All" ? orders : orders.filter(o => o.status === orderFilter);

  return (
    <main className="dashboard-container">
      <div className="dashboard-header" style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div>
          <h2>My Dashboard</h2>
          <p style={{color: "var(--text-muted)", fontSize: "0.95rem"}}>Welcome back, {user.name} ({user.email})</p>
        </div>
        <button className="add-cart-btn" onClick={onExit}>← Back to Store</button>
      </div>

      <div className="admin-tabs" style={{display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem"}}>
        <button className={`tab-btn ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>Overview</button>
        <button className={`tab-btn ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>My Orders</button>
        <button className={`tab-btn ${activeTab === "security" ? "active" : ""}`} onClick={() => setActiveTab("security")}>Account & Security</button>
      </div>

      <div className="dashboard-content">
        {activeTab === "overview" && (
          <div className="admin-panel-section">
            <div className="stats-grid" style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem"}}>
              <div className="stat-card"><h3>Total Orders</h3><p className="stat-value">{totalOrders}</p></div>
              <div className="stat-card"><h3>Pending</h3><p className="stat-value">{pendingOrders}</p></div>
              <div className="stat-card"><h3>Delivered</h3><p className="stat-value">{deliveredOrders}</p></div>
              <div className="stat-card"><h3>Total Spent</h3><p className="stat-value">${totalSpent.toFixed(2)}</p></div>
            </div>

            <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem"}}>
              <div className="profile-card">
                <h3>Quick Profile</h3>
                <div style={{display: "flex", alignItems: "center", gap: "1rem", marginTop: "1rem"}}>
                  <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
                  <div className="profile-info">
                    <h4 style={{margin: 0}}>{user.name}</h4>
                    <p style={{margin: 0, color: "var(--text-muted)"}}>{user.email}</p>
                    <span className="role-badge" style={{marginTop: "0.5rem", display: "inline-block"}}>{user.role}</span>
                  </div>
                </div>
                <p style={{marginTop: "1.5rem", fontSize: "0.85rem", color: "var(--text-muted)"}}>
                  Member since {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>

              {latestOrder && (
                <div className="profile-card">
                  <h3>Recent Order</h3>
                  <div style={{marginTop: "1rem"}}>
                    <div style={{display: "flex", justifyContent: "space-between", marginBottom: "0.5rem"}}>
                      <span className="order-id">#{latestOrder._id.slice(-8).toUpperCase()}</span>
                      <span className={`order-status ${latestOrder.status.toLowerCase()}`}>{latestOrder.status}</span>
                    </div>
                    <p style={{margin: "0.25rem 0", color: "var(--text-muted)"}}>Date: {new Date(latestOrder.createdAt).toLocaleDateString()}</p>
                    <p style={{margin: "0.25rem 0", color: "var(--text-muted)"}}>Items: {latestOrder.items.reduce((s, i) => s + i.quantity, 0)}</p>
                    <p style={{margin: "0.5rem 0", fontWeight: 700}}>Total: ${latestOrder.totalAmount.toFixed(2)}</p>
                    <button className="text-btn" style={{marginTop: "0.5rem", color: "var(--accent-cyan)"}} onClick={() => { setActiveTab("orders"); setExpandedOrderId(latestOrder._id); }}>
                      View Full Details →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="admin-panel-section">
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem"}}>
              <h3>My Orders</h3>
              <select 
                value={orderFilter} 
                onChange={e => setOrderFilter(e.target.value)}
                style={{padding: "0.5rem", background: "var(--bg-input)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)"}}
              >
                <option value="All">All Orders</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            
            {loadingOrders ? (
              <p>Loading orders...</p>
            ) : filteredOrders.length === 0 ? (
              <div className="empty-state" style={{margin: 0}}>
                <div className="empty-icon">📦</div>
                <h3>No orders found</h3>
                <p>{orderFilter === "All" ? "Start shopping and your orders will appear here." : `No orders with status ${orderFilter}.`}</p>
                {orderFilter === "All" && <button className="add-cart-btn" onClick={onExit}>Shop Now</button>}
              </div>
            ) : (
              <div className="orders-grid">
                {filteredOrders.map(order => (
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
                      onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                    >
                      {expandedOrderId === order._id ? "▲ Hide Details" : "▼ View Details"}
                    </button>
                    {expandedOrderId === order._id && (
                      <div className="order-expanded">
                        <p style={{fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "0.5rem", marginTop: "0.75rem"}}>ITEMS</p>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="order-item-row" style={{display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem"}}>
                            <img src={item.product?.image || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100&auto=format&fit=crop&q=80"} alt={item.name} style={{width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover"}}/>
                            <div style={{flex: 1}}>
                              <div style={{fontSize: "0.9rem"}}>{item.name}</div>
                              <div style={{fontSize: "0.8rem", color: "var(--text-muted)"}}>x{item.quantity} &mdash; ${(item.price * item.quantity).toFixed(2)}</div>
                            </div>
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
        )}

        {activeTab === "security" && (
          <div className="admin-panel-section" style={{maxWidth: "600px"}}>
            <div className="profile-card edit-mode" style={{width: "100%", maxWidth: "100%", padding: "2rem"}}>
              <h3>Account & Security</h3>
              <form onSubmit={handleProfileUpdate} style={{marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem"}}>
                <div className="form-group"><label>Full Name</label><input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} required/></div>
                <div className="form-group"><label>Email Address</label><input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} required/></div>
                
                <div style={{borderTop: "1px solid rgba(255,255,255,0.05)", margin: "1rem 0", paddingTop: "1.5rem"}}>
                  <h4 style={{marginBottom: "1rem", color: "var(--text-main)"}}>Change Password</h4>
                  <p style={{fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem"}}>Leave blank if you do not want to change your password.</p>
                  <div className="form-group"><label>Current Password</label><input type="password" value={profileForm.currentPassword} onChange={e => setProfileForm({...profileForm, currentPassword: e.target.value})} placeholder="Required to set new password" /></div>
                  <div className="form-group"><label>New Password</label><input type="password" value={profileForm.newPassword} onChange={e => setProfileForm({...profileForm, newPassword: e.target.value})} /></div>
                  <div className="form-group"><label>Confirm New Password</label><input type="password" value={profileForm.confirmPassword} onChange={e => setProfileForm({...profileForm, confirmPassword: e.target.value})} /></div>
                </div>
                
                <div style={{display: "flex", gap: "1rem", marginTop: "1rem"}}>
                  <button type="submit" className="add-cart-btn" style={{flex: 1, padding: "1rem", fontSize: "1rem"}} disabled={profileLoading}>{profileLoading ? "Saving Changes..." : "Save All Changes"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
