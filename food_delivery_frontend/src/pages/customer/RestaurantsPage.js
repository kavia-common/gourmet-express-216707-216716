import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Card, Toast } from "../../components/ui";

// PUBLIC_INTERFACE
export default function RestaurantsPage() {
  /** Customer view: restaurant list/grid with search. */
  const [restaurants, setRestaurants] = useState([]);
  const [q, setQ] = useState("");
  const [toast, setToast] = useState({ open: false, title: "", message: "" });

  useEffect(() => {
    let mounted = true;
    api.listRestaurants()
      .then((data) => { if (mounted) setRestaurants(Array.isArray(data) ? data : []); })
      .catch((e) => setToast({ open: true, title: "API error", message: e.message || "Could not load restaurants." }));
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return restaurants;
    return restaurants.filter((r) => `${r.name} ${r.cuisine}`.toLowerCase().includes(needle));
  }, [restaurants, q]);

  return (
    <div className="container main">
      <h1 className="h1">Restaurants</h1>
      <div className="subtle">
        Browse a retro-fresh lineup. Tap a restaurant to see the menu and add items to your cart.
      </div>

      <hr className="hr" />

      <div className="grid" style={{ marginBottom: 12 }}>
        <div className="card">
          <div className="row">
            <div style={{ flex: 1, minWidth: 220 }}>
              <label className="subtle" htmlFor="search">Search</label>
              <input
                id="search"
                className="input"
                placeholder="Try: ramen, burgers, veggie..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div style={{ minWidth: 220 }}>
              <div className="subtle">Tip</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
                Use <span className="kbd">/cart</span> to checkout quickly.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid cols-3">
        {filtered.map((r) => (
          <Link key={r.id} to={`/restaurants/${encodeURIComponent(r.id)}`} style={{ textDecoration: "none" }}>
            <Card
              title={r.name}
              right={<span className="tag">{r.cuisine || "Cuisine"}</span>}
              footer={
                <div className="row">
                  <span className="subtle">ETA ~ {r.etaMinutes || 30}m</span>
                  <span className="badge primary"><span className="dot" />Rating {r.rating || "—"}</span>
                </div>
              }
            >
              <div className="subtle" style={{ marginTop: 8 }}>
                {r.description || "Tap to view menu items."}
              </div>
            </Card>
          </Link>
        ))}
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
