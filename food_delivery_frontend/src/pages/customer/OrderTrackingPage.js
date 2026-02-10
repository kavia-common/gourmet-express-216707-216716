import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { Card, StatusBadge, Toast } from "../../components/ui";
import { useStore } from "../../state/store";

const timeline = ["PLACED", "IN_PROGRESS", "OUT_FOR_DELIVERY", "DELIVERED"];

// PUBLIC_INTERFACE
export default function OrderTrackingPage() {
  /** Customer view: order tracking. Polls backend if available; falls back to local order state. */
  const { orderId } = useParams();
  const { state, updateOrderStatusLocal } = useStore();

  const local = useMemo(() => (state.orders || []).find((o) => o.id === orderId) || null, [state.orders, orderId]);

  const [order, setOrder] = useState(local || { id: orderId, status: "IN_PROGRESS" });
  const [toast, setToast] = useState({ open: false, title: "", message: "" });

  useEffect(() => {
    setOrder(local || { id: orderId, status: "IN_PROGRESS" });
  }, [local, orderId]);

  useEffect(() => {
    let alive = true;

    async function tick() {
      try {
        const fetched = await api.getOrder(orderId);
        if (!alive) return;
        if (fetched && fetched.status) {
          setOrder((prev) => ({ ...prev, ...fetched }));
          updateOrderStatusLocal(orderId, fetched.status);
        }
      } catch {
        // ignore
      }
    }

    tick();
    const id = window.setInterval(tick, 4000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [orderId, updateOrderStatusLocal]);

  const idx = timeline.indexOf((order.status || "").toUpperCase());
  const safeIdx = idx >= 0 ? idx : 1;

  function advanceDemoStatus() {
    const next = timeline[Math.min(timeline.length - 1, safeIdx + 1)];
    setOrder((prev) => ({ ...prev, status: next }));
    updateOrderStatusLocal(orderId, next);
    setToast({ open: true, title: "Status updated", message: `Now: ${next}` });
  }

  return (
    <div className="container main">
      <div className="row">
        <div>
          <h1 className="h1" style={{ marginBottom: 0 }}>Order Tracking</h1>
          <div className="subtle" style={{ fontFamily: "var(--mono)" }}>{orderId}</div>
        </div>
        <div className="row">
          <Link to="/orders" className="btn btn-sm" style={{ textDecoration: "none" }}>All orders</Link>
          <Link to="/" className="btn btn-sm" style={{ textDecoration: "none" }}>Restaurants</Link>
        </div>
      </div>

      <hr className="hr" />

      <Card
        title="Current status"
        right={<StatusBadge status={order.status} />}
        footer={
          <button className="btn btn-primary btn-block" onClick={advanceDemoStatus} disabled={safeIdx >= timeline.length - 1}>
            Advance status (demo)
          </button>
        }
      >
        <div className="stack" style={{ marginTop: 8 }}>
          {timeline.map((s, i) => {
            const active = i <= safeIdx;
            return (
              <div key={s} className={`badge ${active ? "primary" : ""}`} style={{ opacity: active ? 1 : 0.55 }}>
                <span className="dot" />
                {s}
              </div>
            );
          })}
        </div>

        <div className="subtle" style={{ marginTop: 10 }}>
          If the backend exposes order status updates, this page will reflect them via polling.
        </div>
      </Card>

      <Toast
        open={toast.open}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast({ open: false, title: "", message: "" })}
      />
    </div>
  );
}
