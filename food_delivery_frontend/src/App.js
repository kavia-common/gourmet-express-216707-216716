import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import { StoreProvider } from "./state/store";
import { NavBar } from "./components/NavBar";

import RestaurantsPage from "./pages/customer/RestaurantsPage";
import RestaurantDetailPage from "./pages/customer/RestaurantDetailPage";
import CartPage from "./pages/customer/CartPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import OrdersPage from "./pages/customer/OrdersPage";
import OrderTrackingPage from "./pages/customer/OrderTrackingPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard";

import NotFoundPage from "./pages/NotFoundPage";

// PUBLIC_INTERFACE
function App() {
  /** App entry: sets up providers, navigation, and role-based routes. */
  return (
    <div className="App">
      <StoreProvider>
        <BrowserRouter>
          <NavBar />
          <Routes>
            {/* Customer */}
            <Route path="/" element={<RestaurantsPage />} />
            <Route path="/restaurants/:restaurantId" element={<RestaurantDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:orderId" element={<OrderTrackingPage />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Delivery */}
            <Route path="/delivery" element={<DeliveryDashboard />} />

            {/* Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <footer className="footer">
            Gourmet Express • Retro-light UI • API base: <span className="kbd">{process.env.REACT_APP_API_BASE_URL || "http://localhost:3001"}</span>
          </footer>
        </BrowserRouter>
      </StoreProvider>
    </div>
  );
}

export default App;
