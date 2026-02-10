import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { Card, Modal, StatusBadge, Toast } from "../../components/ui";

// PUBLIC_INTERFACE
export default function AdminDashboard() {
  /** Admin view: manage restaurants, menus, and orders via basic CRUD UI. */
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);

  const [activeRestaurantId, setActiveRestaurantId] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

  const [restaurantModal, setRestaurantModal] = useState({ open: false, mode: "create", data: {} });
  const [menuModal, setMenuModal] = useState({ open: false, mode: "create", data: {} });

  const [toast, setToast] = useState({ open: false, title: "", message: "" });

  async function refreshRestaurants() {
    const list = await api.listRestaurants();
    setRestaurants(Array.isArray(list) ? list : []);
  }

  async function refreshOrders() {
    const list = await api.listOrders();
    setOrders(Array.isArray(list) ? list : []);
  }

  async function refreshMenu(rid) {
    if (!rid) return;
    const items = await api.listMenuItems(rid);
    setMenuItems(Array.isArray(items) ? items : []);
  }

  useEffect(() => {
    refreshRestaurants().catch((e) => setToast({ open: true, title: "Admin", message: e.message || "Failed loading restaurants." }));
    refreshOrders().catch(() => { /* ok */ });
  }, []);

  useEffect(() => {
    refreshMenu(activeRestaurantId).catch(() => { /* ok */ });
  }, [activeRestaurantId]);

  const activeRestaurant = useMemo(
    () => restaurants.find((r) => r.id === activeRestaurantId) || null,
    [restaurants, activeRestaurantId]
  );

  async function saveRestaurant() {
    try {
      const saved = await api.adminUpsertRestaurant(restaurantModal.data);
      setToast({ open: true, title: "Restaurant saved", message: saved.name || saved.id });
      setRestaurantModal({ open: false, mode: "create", data: {} });
      await refreshRestaurants();
    } catch (e) {
      setToast({ open: true, title: "Save failed", message: e.message || "Could not save restaurant." });
    }
  }

  async function deleteRestaurant(id) {
    if (!id) return;
    try {
      await api.adminDeleteRestaurant(id);
      setToast({ open: true, title: "Deleted", message: `Restaurant ${id} removed.` });
      if (activeRestaurantId === id) {
        setActiveRestaurantId(null);
        setMenuItems([]);
      }
      await refreshRestaurants();
    } catch (e) {
      setToast({ open: true, title: "Delete failed", message: e.message || "Could not delete restaurant." });
    }
  }

  async function saveMenuItem() {
    try {
      const rid = activeRestaurantId;
      const saved = await api.adminUpsertMenuItem(rid, menuModal.data);
      setToast({ open: true, title: "Menu item saved", message: saved.name || saved.id });
      setMenuModal({ open: false, mode: "create", data: {} });
      await refreshMenu(rid);
    } catch (e) {
      setToast({ open: true, title: "Save failed", message: e.message || "Could not save menu item." });
    }
  }

  async function deleteMenuItem(itemId) {
    try {
      const rid = activeRestaurantId;
      await api.adminDeleteMenuItem(rid, itemId);
      setToast({ open: true, title: "Deleted", message: `Menu item ${itemId} removed.` });
      await refreshMenu(rid);
    } catch (e) {
      setToast({ open: true, title: "Delete failed", message: e.message || "Could not delete menu item." });
    }
  }

  async function setOrderStatus(orderId, status) {
    try {
      const updated = await api.updateOrderStatus(orderId, status);
      setToast({ open: true, title: "Order updated", message: `${orderId} → ${updated.status || status}` });
      await refreshOrders();
    } catch (e) {
      setToast({ open: true, title: "Update failed", message: e.message || "Could not update order." });
    }
  }

  return (
    <div className="container main">
      <h1 className="h1">Admin</h1>
      <div className="subtle">Basic CRUD UIs for restaurants, menus, and orders.</div>

      <hr className="hr" />

      <div className="grid cols-2">
        <Card
          title="Restaurants"
          right={
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setRestaurantModal({ open: true, mode: "create", data: { name: "", cuisine: "", etaMinutes: 30, rating: 4.5, description: "" } })}
            >
              + Add
            </button>
          }
        >
          <div className="stack" style={{ marginTop: 8 }}>
            <select
              className="select"
              value={activeRestaurantId || ""}
              onChange={(e) => setActiveRestaurantId(e.target.value || null)}
              aria-label="Select restaurant to manage menu"
            >
              <option value="">Select a restaurant…</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            <table className="table" aria-label="Restaurants table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ETA</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 900 }}>{r.name}</div>
                      <div className="subtle">{r.cuisine}</div>
                    </td>
                    <td>{r.etaMinutes || 30}m</td>
                    <td>
                      <div className="row" style={{ justifyContent: "flex-start" }}>
                        <button
                          className="btn btn-sm"
                          onClick={() => setRestaurantModal({ open: true, mode: "edit", data: { ...r } })}
                        >
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteRestaurant(r.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {restaurants.length === 0 ? (
                  <tr><td colSpan={3} className="subtle">No restaurants found.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          title="Menu items"
          right={
            <button
              className="btn btn-primary btn-sm"
              disabled={!activeRestaurantId}
              onClick={() => setMenuModal({ open: true, mode: "create", data: { name: "", price: 9.99, description: "" } })}
            >
              + Add
            </button>
          }
          footer={
            <div className="subtle">
              {activeRestaurant ? `Managing menu for: ${activeRestaurant.name}` : "Select a restaurant to manage its menu."}
            </div>
          }
        >
          {!activeRestaurantId ? (
            <div className="subtle">Choose a restaurant to load menu items.</div>
          ) : (
            <table className="table" aria-label="Menu items table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th style={{ width: 110 }}>Price</th>
                  <th style={{ width: 170 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map((mi) => (
                  <tr key={mi.id}>
                    <td>
                      <div style={{ fontWeight: 900 }}>{mi.name}</div>
                      <div className="subtle">{mi.description}</div>
                    </td>
                    <td>${Number(mi.price || 0).toFixed(2)}</td>
                    <td>
                      <div className="row" style={{ justifyContent: "flex-start" }}>
                        <button className="btn btn-sm" onClick={() => setMenuModal({ open: true, mode: "edit", data: { ...mi } })}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteMenuItem(mi.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {menuItems.length === 0 ? (
                  <tr><td colSpan={3} className="subtle">No menu items found.</td></tr>
                ) : null}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div style={{ marginTop: 12 }}>
        <Card title="Orders" right={<span className="tag">Admin</span>}>
          <table className="table" aria-label="Orders table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Status</th>
                <th style={{ width: 260 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <div style={{ fontFamily: "var(--mono)", fontWeight: 900 }}>{o.id}</div>
                    <div className="subtle">Items: {(o.items || []).reduce((s, i) => s + (i.qty || 0), 0)}</div>
                  </td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>
                    <div className="row" style={{ justifyContent: "flex-start" }}>
                      <button className="btn btn-sm" onClick={() => setOrderStatus(o.id, "IN_PROGRESS")}>In progress</button>
                      <button className="btn btn-warning btn-sm" onClick={() => setOrderStatus(o.id, "OUT_FOR_DELIVERY")}>Out</button>
                      <button className="btn btn-success btn-sm" onClick={() => setOrderStatus(o.id, "DELIVERED")}>Delivered</button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 ? (
                <tr><td colSpan={3} className="subtle">No server orders (local orders live on customer device).</td></tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      </div>

      <Modal
        open={restaurantModal.open}
        title={restaurantModal.mode === "edit" ? "Edit restaurant" : "Add restaurant"}
        onClose={() => setRestaurantModal({ open: false, mode: "create", data: {} })}
        footer={
          <>
            <button className="btn" onClick={() => setRestaurantModal({ open: false, mode: "create", data: {} })}>Cancel</button>
            <button className="btn btn-primary" onClick={saveRestaurant}>Save</button>
          </>
        }
      >
        <div className="stack">
          <div>
            <label className="subtle" htmlFor="rname">Name</label>
            <input
              id="rname"
              className="input"
              value={restaurantModal.data.name || ""}
              onChange={(e) => setRestaurantModal((m) => ({ ...m, data: { ...m.data, name: e.target.value } }))}
            />
          </div>
          <div>
            <label className="subtle" htmlFor="rcuisine">Cuisine</label>
            <input
              id="rcuisine"
              className="input"
              value={restaurantModal.data.cuisine || ""}
              onChange={(e) => setRestaurantModal((m) => ({ ...m, data: { ...m.data, cuisine: e.target.value } }))}
            />
          </div>
          <div className="grid cols-2">
            <div>
              <label className="subtle" htmlFor="reta">ETA minutes</label>
              <input
                id="reta"
                className="input"
                inputMode="numeric"
                value={restaurantModal.data.etaMinutes ?? 30}
                onChange={(e) => setRestaurantModal((m) => ({ ...m, data: { ...m.data, etaMinutes: Number(e.target.value) } }))}
              />
            </div>
            <div>
              <label className="subtle" htmlFor="rrating">Rating</label>
              <input
                id="rrating"
                className="input"
                inputMode="decimal"
                value={restaurantModal.data.rating ?? 4.5}
                onChange={(e) => setRestaurantModal((m) => ({ ...m, data: { ...m.data, rating: Number(e.target.value) } }))}
              />
            </div>
          </div>
          <div>
            <label className="subtle" htmlFor="rdesc">Description</label>
            <textarea
              id="rdesc"
              className="textarea"
              value={restaurantModal.data.description || ""}
              onChange={(e) => setRestaurantModal((m) => ({ ...m, data: { ...m.data, description: e.target.value } }))}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={menuModal.open}
        title={menuModal.mode === "edit" ? "Edit menu item" : "Add menu item"}
        onClose={() => setMenuModal({ open: false, mode: "create", data: {} })}
        footer={
          <>
            <button className="btn" onClick={() => setMenuModal({ open: false, mode: "create", data: {} })}>Cancel</button>
            <button className="btn btn-primary" onClick={saveMenuItem} disabled={!activeRestaurantId}>Save</button>
          </>
        }
      >
        <div className="stack">
          <div>
            <label className="subtle" htmlFor="miname">Name</label>
            <input
              id="miname"
              className="input"
              value={menuModal.data.name || ""}
              onChange={(e) => setMenuModal((m) => ({ ...m, data: { ...m.data, name: e.target.value } }))}
            />
          </div>
          <div>
            <label className="subtle" htmlFor="miprice">Price</label>
            <input
              id="miprice"
              className="input"
              inputMode="decimal"
              value={menuModal.data.price ?? 9.99}
              onChange={(e) => setMenuModal((m) => ({ ...m, data: { ...m.data, price: Number(e.target.value) } }))}
            />
          </div>
          <div>
            <label className="subtle" htmlFor="midesc">Description</label>
            <textarea
              id="midesc"
              className="textarea"
              value={menuModal.data.description || ""}
              onChange={(e) => setMenuModal((m) => ({ ...m, data: { ...m.data, description: e.target.value } }))}
            />
          </div>
          <div className="subtle">
            Restaurant: <span className="kbd">{activeRestaurantId || "none"}</span>
          </div>
        </div>
      </Modal>

      <Toast
        open={toast.open}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast({ open: false, title: "", message: "" })}
      />
    </div>
  );
}
