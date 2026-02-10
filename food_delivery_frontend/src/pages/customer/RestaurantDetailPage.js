import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { Card, Modal, Toast } from "../../components/ui";
import { useStore } from "../../state/store";

// PUBLIC_INTERFACE
export default function RestaurantDetailPage() {
  /** Customer view: restaurant detail + menu items + add to cart. */
  const { restaurantId } = useParams();
  const { state, addToCart, cartTotal } = useStore();

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState({ open: false, title: "", message: "" });

  useEffect(() => {
    let mounted = true;
    api.getRestaurant(restaurantId)
      .then((r) => { if (mounted) setRestaurant(r); })
      .catch((e) => setToast({ open: true, title: "API error", message: e.message || "Could not load restaurant." }));

    api.listMenuItems(restaurantId)
      .then((items) => { if (mounted) setMenu(Array.isArray(items) ? items : []); })
      .catch((e) => setToast({ open: true, title: "API error", message: e.message || "Could not load menu." }));

    return () => { mounted = false; };
  }, [restaurantId]);

  const cartRestaurantMismatch = useMemo(() => {
    return state.cart.restaurantId && state.cart.restaurantId !== restaurantId;
  }, [state.cart.restaurantId, restaurantId]);

  return (
    <div className="container main">
      <div className="row">
        <div>
          <h1 className="h1" style={{ marginBottom: 0 }}>
            {restaurant?.name || "Restaurant"}
          </h1>
          <div className="subtle">
            {restaurant?.cuisine || "Menu"} • ETA ~ {restaurant?.etaMinutes || 30}m
          </div>
        </div>

        <div className="row">
          <Link to="/cart" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
            Go to Cart (${cartTotal().toFixed(2)})
          </Link>
          <Link to="/" className="btn btn-sm" style={{ textDecoration: "none" }}>
            Back
          </Link>
        </div>
      </div>

      <hr className="hr" />

      {cartRestaurantMismatch ? (
        <Card
          title="Cart contains items from a different restaurant"
          right={<span className="badge warning"><span className="dot" />Heads up</span>}
          footer={
            <Link to="/cart" className="btn btn-warning btn-block" style={{ textDecoration: "none" }}>
              Review cart (you can clear it at checkout)
            </Link>
          }
        >
          <div className="subtle">
            For a smoother checkout, Gourmet Express keeps the cart to one restaurant at a time.
          </div>
        </Card>
      ) : null}

      <div className="grid cols-2">
        {menu.map((mi) => (
          <Card
            key={mi.id}
            title={mi.name}
            right={<span className="tag">${Number(mi.price || 0).toFixed(2)}</span>}
            footer={
              <div className="row">
                <button className="btn btn-sm" onClick={() => setSelected(mi)}>
                  Details
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    addToCart(restaurantId, mi);
                    setToast({ open: true, title: "Added to cart", message: `${mi.name} added.` });
                  }}
                >
                  Add
                </button>
              </div>
            }
          >
            <div className="subtle">{mi.description || "A tasty classic."}</div>
          </Card>
        ))}
      </div>

      <Modal
        open={!!selected}
        title={selected ? selected.name : "Item"}
        onClose={() => setSelected(null)}
        footer={
          selected ? (
            <>
              <button className="btn" onClick={() => setSelected(null)}>Close</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  addToCart(restaurantId, selected);
                  setToast({ open: true, title: "Added to cart", message: `${selected.name} added.` });
                  setSelected(null);
                }}
              >
                Add to cart
              </button>
            </>
          ) : null
        }
      >
        <div className="stack">
          <div className="badge primary"><span className="dot" />${Number(selected?.price || 0).toFixed(2)}</div>
          <div className="subtle">{selected?.description || "A retro favorite."}</div>
          <div className="subtle">
            Pro tip: checkout from <span className="kbd">/cart</span>.
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
