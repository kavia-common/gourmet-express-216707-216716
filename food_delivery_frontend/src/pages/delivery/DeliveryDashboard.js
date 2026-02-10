import React, { useMemo, useState } from "react";
import { Card, Toast } from "../../components/ui";
import { api } from "../../api/client";

/**
 * This is a lightweight delivery UI.
 * In a real system, driver identity would come from auth; here we use a local input.
 */

// PUBLIC_INTERFACE
export default function DeliveryDashboard() {
  /** Delivery view: list assigned deliveries and update status. */
  const [driverId, setDriverId] = useState("driver-1");
  const [deliveries, setDeliveries] = useState([]);
  const [toast, setToast] = useState({ open: false, title: "", message: "" });
  const [loading, setLoading] = useState(false);

  const hasDeliveries = useMemo(() => deliveries.length > 0, [deliveries.length]);

  async function loadAssigned() {
    setLoading(true);
    try {
      const list = await api.deliveryListAssigned(driverId.trim() || "driver-1");
      setDeliveries(Array.isArray(list) ? list : []);
      setToast({ open: true, title: "Loaded", message: "Assigned deliveries refreshed." });
    } catch (e) {
      setToast({ open: true, title: "Load failed", message: e.message || "Could not load assigned deliveries." });
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(deliveryId, status) {
    try {
      const updated = await api.deliveryUpdateStatus(deliveryId, status);
      setDeliveries((prev) => prev.map((d) => (d.id === deliveryId ? { ...d, status: updated.status || status } : d)));
      setToast({ open: true, title: "Status updated", message: `${deliveryId} → ${status}` });
    } catch (e) {
      setToast({ open: true, title: "Update failed", message: e.message || "Could not update delivery status." });
    }
  }

  return (
    <div className="container main">
      <h1 className="h1">Delivery</h1>
      <div className="subtle">
        View assigned deliveries and update their status. (Demo UI until backend provides endpoints.)
      </div>

      <hr className="hr" />

      <div className="grid cols-2">
        <Card
          title="Driver station"
          right={<span className="tag">Dispatch</span>}
          footer={
            <button className="btn btn-primary btn-block" onClick={loadAssigned} disabled={loading}>
              {loading ? "Loading..." : "Load assigned deliveries"}
            </button>
          }
        >
          <div className="stack">
            <div>
              <label className="subtle" htmlFor="driverId">Driver ID</label>
              <input
                id="driverId"
                className="input"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
              />
            </div>
            <div className="subtle">
              When backend supports delivery assignment, this will show real tasks.
            </div>
          </div>
        </Card>

        <Card title="Assigned deliveries" right={<span className="tag">{deliveries.length}</span>}>
          {!hasDeliveries ? (
            <div className="subtle">
              No deliveries loaded. Use the button on the left to refresh.
            </div>
          ) : (
            <table className="table" aria-label="Assigned deliveries">
              <thead>
                <tr>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th style={{ width: 260 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontFamily: "var(--mono)", fontWeight: 900 }}>{d.id}</div>
                      <div className="subtle">{d.address || "Address: —"}</div>
                    </td>
                    <td style={{ fontFamily: "var(--mono)" }}>{(d.status || "ASSIGNED").toUpperCase()}</td>
                    <td>
                      <div className="row" style={{ justifyContent: "flex-start" }}>
                        <button className="btn btn-sm" onClick={() => updateStatus(d.id, "PICKED_UP")}>Picked up</button>
                        <button className="btn btn-warning btn-sm" onClick={() => updateStatus(d.id, "OUT_FOR_DELIVERY")}>Out</button>
                        <button className="btn btn-success btn-sm" onClick={() => updateStatus(d.id, "DELIVERED")}>Done</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Toast
        open={toast.open}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast({ open: false, title: "", message: "" })}
      />
    </div>
  );
}
