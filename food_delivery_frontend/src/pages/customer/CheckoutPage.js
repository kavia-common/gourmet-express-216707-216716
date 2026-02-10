import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../api/client";
import { Card, Toast } from "../../components/ui";
import { useStore } from "../../state/store";

// PUBLIC_INTERFACE
export default function CheckoutPage() {
  /** Customer view: checkout form and order creation. */
  const { state, clearCart, cartTotal, addOrder } = useStore();
  const navigate = useNavigate();

  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, title: "", message: "" });

  const canSubmit = useMemo(() => {
    return !!state.cart.restaurantId && state.cart.items.length > 0 && address.trim().length >= 6 && !loading;
  }, [state.cart.restaurantId, state.cart.items.length, address, loading]);

  const total = cartTotal();

  async function placeOrder() {
    setLoading(true);
    try {
      const payload = {
        restaurantId: state.cart.restaurantId,
        items: state.cart.items,
        address: address.trim(),
        notes: notes.trim(),
        paymentMethod
      };

      const created = await api.createOrder(payload);

      // Track locally even if backend created it, so UI has something consistent.
      addOrder(created);
      clearCart();
      setToast({ open: true, title: "Order placed", message: `Order ${created.id} created.` });
      navigate(`/orders/${encodeURIComponent(created.id)}`);
    } catch (e) {
      setToast({ open: true, title: "Checkout failed", message: e.message || "Could not place order." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container main">
      <div className="row">
        <div>
          <h1 className="h1" style={{ marginBottom: 0 }}>Checkout</h1>
          <div className="subtle">Confirm delivery details and place your order.</div>
        </div>
        <div className="row">
          <Link to="/cart" className="btn btn-sm" style={{ textDecoration: "none" }}>Back to cart</Link>
        </div>
      </div>

      <hr className="hr" />

      {state.cart.items.length === 0 ? (
        <Card title="Cart is empty" right={<span className="tag">No signal</span>}>
          <div className="subtle">Add some items first.</div>
          <div style={{ marginTop: 12 }}>
            <Link to="/" className="btn btn-primary btn-block" style={{ textDecoration: "none" }}>
              Browse restaurants
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid cols-2">
          <Card
            title="Delivery info"
            right={<span className="tag">Step 1</span>}
            footer={
              <button className="btn btn-success btn-block" onClick={placeOrder} disabled={!canSubmit}>
                {loading ? "Placing order..." : `Place order ($${total.toFixed(2)})`}
              </button>
            }
          >
            <div className="stack" style={{ marginTop: 10 }}>
              <div>
                <label className="subtle" htmlFor="address">Address</label>
                <input
                  id="address"
                  className="input"
                  placeholder="123 Neon Street, Apt 4B"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="subtle" htmlFor="payment">Payment</label>
                <select
                  id="payment"
                  className="select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CARD">Card</option>
                  <option value="CASH">Cash</option>
                  <option value="WALLET">Wallet</option>
                </select>
              </div>

              <div>
                <label className="subtle" htmlFor="notes">Notes (optional)</label>
                <textarea
                  id="notes"
                  className="textarea"
                  placeholder="Gate code, delivery instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="subtle">
                Minimum address length: 6 characters. This is a demo validation.
              </div>
            </div>
          </Card>

          <Card title="Order summary" right={<span className="tag">Step 2</span>}>
            <table className="table" aria-label="Checkout summary">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ width: 90 }}>Qty</th>
                  <th style={{ width: 110 }}>Line</th>
                </tr>
              </thead>
              <tbody>
                {state.cart.items.map((i) => (
                  <tr key={i.menuItemId}>
                    <td>
                      <div style={{ fontWeight: 900 }}>{i.name}</div>
                      <div className="subtle">${Number(i.price || 0).toFixed(2)}</div>
                    </td>
                    <td>{i.qty}</td>
                    <td>${(Number(i.price || 0) * Number(i.qty || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="row" style={{ marginTop: 12 }}>
              <span className="subtle">Total</span>
              <span style={{ fontFamily: "var(--mono)", fontWeight: 900 }}>${total.toFixed(2)}</span>
            </div>

            <div className="subtle" style={{ marginTop: 8 }}>
              Retro note: payments are mocked unless backend integrates a real provider.
            </div>
          </Card>
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
