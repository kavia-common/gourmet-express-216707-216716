import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useStore } from "../state/store";

function NavPill({ to, label, right }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `pill ${isActive ? "pill-active" : ""}`}
      end
      aria-label={label}
    >
      <span className="dot" />
      <span>{label}</span>
      {right ? <span style={{ marginLeft: 2 }}>{right}</span> : null}
    </NavLink>
  );
}

// PUBLIC_INTERFACE
export function NavBar() {
  /** Top navigation shared by all areas. */
  const { state } = useStore();
  const location = useLocation();

  const cartCount = state.cart.items.reduce((sum, i) => sum + (i.qty || 0), 0);

  // “Retro terminal” context hint
  const path = location.pathname;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand">
          <div className="brand-badge" aria-hidden="true">
            GE
          </div>
          <div className="brand-title">
            <strong>Gourmet Express</strong>
            <span>{path}</span>
          </div>
        </div>

        <nav className="navlinks" aria-label="Main navigation">
          <NavPill to="/" label="Restaurants" />
          <NavPill
            to="/cart"
            label="Cart"
            right={cartCount > 0 ? <span className="count">{cartCount}</span> : null}
          />
          <NavPill to="/orders" label="Orders" />
          <NavPill to="/admin" label="Admin" />
          <NavPill to="/delivery" label="Delivery" />
        </nav>
      </div>
    </header>
  );
}
