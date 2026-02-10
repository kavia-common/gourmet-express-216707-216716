import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Card, StatusBadge, Toast } from "../../components/ui";
import { useStore } from "../../state/store";

// PUBLIC_INTERFACE
export default function OrdersPage() {
  /** Customer view: show recent orders tracked locally; optionally merge with backend list. */
  const { state } = useStore();
  const [serverOrders, setServerOrders] = useState([]);
  const [toast, setToast] = useState({ open: false, title: "", message: "" });

  useEffect(() => {
    let mounted = true;
    api.listOrders()
      .then((o) => { if (mounted) setServerOrders(Array.isArray(o) ? o : []); })
      .catch(() => { /* silent */ });
    return () => { mounted = false; };
  }, []);

  const localOrders = state.orders || [];
  const merged = [...localOrders];

  // Merge server orders if they have different ids.
  for (const so of serverOrders) {
    if (!merged.some((o) => o.id === so.id)) merged.push(so);
  }

  return (
    <div className="container main">
      <div className="row">
        <div>
          <h1 className="h1" style={{ marginBottom: 0 }}>Orders</h1>
          <div className="subtle">Track your active orders in real time-ish.</div>
        </div>
        <div className="row">
          <Link to="/" className="btn btn-sm" style={{ textDecoration: "none" }}>Restaurants</Link>
        </div>
      </div>

      <hr className="hr" />

      {merged.length === 0 ? (
        <Card title="No orders yet" right={<span className="tag">Quiet channel</span>}>
          <div className="subtle">Place an order from a restaurant menu to start tracking it here.</div>
          <div style={{ marginTop: 12 }}>
            <Link to="/" className="btn btn-primary btn-block" style={{ textDecoration: "none" }}>
              Browse restaurants
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid cols-2">
          {merged.map((o) => (
            <Link key={o.id} to={`/orders/${encodeURIComponent(o.id)}`} style={{ textDecoration: "none" }}>
              <Card
                title={`Order ${String(o.id).slice(0, 10)}…`}
                right={<StatusBadge status={o.status} />}
                footer={<div className="subtle">Tap to open tracking.</div>}
              >
                <div className="subtle" style={{ fontFamily: "var(--mono)" }}>
                  {o.createdAt ? `Created: ${new Date(o.createdAt).toLocaleString()}` : "Created: —"}
                </div>
                <div className="subtle">
                  Items: {(o.items || []).reduce((sum, i) => sum + (i.qty || 0), 0)}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Toast
        open={toast.open}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast({ open: false, title: "", message: "" })}
      />
    </div>
  );
}
