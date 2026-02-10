import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { Card, Toast } from "../../components/ui";
import { useStore } from "../../state/store";

// PUBLIC_INTERFACE
export default function CartPage() {
  /** Customer view: cart contents and quick access to checkout. */
  const { state, setCartQty, clearCart, cartTotal } = useStore();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [toast, setToast] = useState({ open: false, title: "", message: "" });

  useEffect(() => {
    if (!state.cart.restaurantId) return;
    let mounted = true;
    api.getRestaurant(state.cart.restaurantId)
      .then((r) => { if (mounted) setRestaurant(r); })
      .catch(() => { /* optional */ });
    return () => { mounted = false; };
  }, [state.cart.restaurantId]);

  const total = cartTotal();

  return (
    <div className="container main">
      <div className="row">
        <div>
          <h1 className="h1" style={{ marginBottom: 0 }}>Cart</h1>
          <div className="subtle">
            {restaurant?.name ? `From ${restaurant.name}` : (state.cart.restaurantId ? "From selected restaurant" : "Empty")}
          </div>
        </div>
        <div className="row">
          <Link to="/" className="btn btn-sm" style={{ textDecoration: "none" }}>Continue browsing</Link>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              clearCart();
              setToast({ open: true, title: "Cart cleared", message: "All items removed." });
            }}
            disabled={state.cart.items.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      <hr className="hr" />

      {state.cart.items.length === 0 ? (
        <Card title="Nothing in your cart yet" right={<span className="tag">Tip</span>}>
          <div className="subtle">
            Add a menu item from a restaurant to start an order.
          </div>
          <div style={{ marginTop: 12 }}>
            <Link to="/" className="btn btn-primary btn-block" style={{ textDecoration: "none" }}>
              Browse restaurants
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <Card
            title="Items"
            right={<span className="tag">{state.cart.items.length} lines</span>}
            footer={
              <div className="row">
                <div style={{ fontFamily: "var(--mono)" }}>
                  Total: <strong>${total.toFixed(2)}</strong>
                </div>
                <button className="btn btn-success" onClick={() => navigate("/checkout")}>
                  Proceed to Checkout
                </button>
              </div>
            }
          >
            <table className="table" aria-label="Cart items">
              <thead>
                <tr>
                  <th style={{ width: "45%" }}>Item</th>
                  <th style={{ width: "20%" }}>Price</th>
                  <th style={{ width: "20%" }}>Qty</th>
                  <th style={{ width: "15%" }}>Line</th>
                </tr>
              </thead>
              <tbody>
                {state.cart.items.map((i) => (
                  <tr key={i.menuItemId}>
                    <td>
                      <div style={{ fontWeight: 900 }}>{i.name}</div>
                      <div className="subtle" style={{ fontFamily: "var(--mono)" }}>{i.menuItemId}</div>
                    </td>
                    <td>${Number(i.price || 0).toFixed(2)}</td>
                    <td>
                      <div className="row" style={{ justifyContent: "flex-start" }}>
                        <button className="btn btn-sm" onClick={() => setCartQty(i.menuItemId, Math.max(0, (i.qty || 0) - 1))}>-</button>
                        <input
                          className="input"
                          style={{ width: 72, padding: "7px 10px" }}
                          inputMode="numeric"
                          value={i.qty}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setCartQty(i.menuItemId, Number.isFinite(v) ? v : 0);
                          }}
                          aria-label={`Quantity for ${i.name}`}
                        />
                        <button className="btn btn-sm" onClick={() => setCartQty(i.menuItemId, (i.qty || 0) + 1)}>+</button>
                      </div>
                    </td>
                    <td>${(Number(i.price || 0) * Number(i.qty || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card title="Quick checks" right={<span className="tag">Retro rules</span>}>
            <div className="subtle">
              One restaurant per cart keeps deliveries smoother. If you want items from another restaurant, clear the cart first.
            </div>
          </Card>
        </>
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
