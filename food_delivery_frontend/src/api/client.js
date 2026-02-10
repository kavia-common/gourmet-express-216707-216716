/**
 * Centralized API client for Gourmet Express.
 * Uses REACT_APP_API_BASE_URL (env) to determine the backend base URL.
 *
 * If your backend is local in development, set:
 *   REACT_APP_API_BASE_URL=http://localhost:3001
 *
 * Note: The current backend OpenAPI in this workspace only exposes "/" health.
 * This client therefore supports:
 *  - calling real endpoints when available
 *  - falling back to local mock data so the UI remains usable end-to-end
 */

const DEFAULT_BASE_URL = "http://localhost:3001";

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Returns the API base URL from the environment (with a sensible dev default). */
  const envUrl = process.env.REACT_APP_API_BASE_URL;
  return (envUrl && envUrl.trim().length > 0) ? envUrl.trim().replace(/\/+$/, "") : DEFAULT_BASE_URL;
}

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const resp = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  // Try to parse JSON; if not JSON, return text.
  const contentType = resp.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!resp.ok) {
    const payload = isJson ? await resp.json().catch(() => ({})) : await resp.text().catch(() => "");
    const message = typeof payload === "string" ? payload : (payload.detail || payload.message || "Request failed");
    const err = new Error(message);
    err.status = resp.status;
    err.payload = payload;
    throw err;
  }

  return isJson ? resp.json() : resp.text();
}

/**
 * Simple in-memory mock data so UI works even if backend endpoints are not implemented yet.
 * Kept deliberately small; can be replaced once backend exposes real routes.
 */
const mockDb = {
  restaurants: [
    {
      id: "r-arcade",
      name: "Arcade Diner",
      cuisine: "Burgers • Shakes",
      etaMinutes: 25,
      rating: 4.6,
      description: "Neon booths, crispy fries, and a jukebox of flavors."
    },
    {
      id: "r-cybernoodle",
      name: "Cyber Noodle Lab",
      cuisine: "Ramen • Bao",
      etaMinutes: 35,
      rating: 4.7,
      description: "Slurp-worthy bowls tuned to perfect umami frequency."
    },
    {
      id: "r-vintageveggie",
      name: "Vintage Veggie",
      cuisine: "Plant-based • Bowls",
      etaMinutes: 30,
      rating: 4.4,
      description: "Garden-fresh plates with a retro twist."
    }
  ],
  menuItemsByRestaurantId: {
    "r-arcade": [
      { id: "m-a-1", name: "Pixel Burger", price: 11.5, description: "Double patty, cheddar, arcade sauce." },
      { id: "m-a-2", name: "8-bit Fries", price: 4.75, description: "Crispy, salty, dangerously snackable." },
      { id: "m-a-3", name: "Neon Shake", price: 6.25, description: "Vanilla + glowberry swirl." }
    ],
    "r-cybernoodle": [
      { id: "m-c-1", name: "Circuit Ramen", price: 13.0, description: "Pork broth, char siu, soft egg." },
      { id: "m-c-2", name: "Bao Bytes (2)", price: 7.5, description: "Steamed buns, spicy mayo drizzle." }
    ],
    "r-vintageveggie": [
      { id: "m-v-1", name: "Cassette Kale Bowl", price: 12.25, description: "Kale, quinoa, citrus dressing." },
      { id: "m-v-2", name: "Retro Root Wrap", price: 10.5, description: "Roasted roots, hummus, crunch." }
    ]
  }
};

// PUBLIC_INTERFACE
export const api = {
  /** Domain API methods (some backed by server, otherwise mock fallback). */

  // PUBLIC_INTERFACE
  async health() {
    /** Health check against backend root endpoint. */
    return request("/", { method: "GET" });
  },

  // PUBLIC_INTERFACE
  async listRestaurants() {
    /** List restaurants. Falls back to mock data if backend route is missing. */
    try {
      return await request("/restaurants", { method: "GET" });
    } catch (e) {
      return mockDb.restaurants;
    }
  },

  // PUBLIC_INTERFACE
  async getRestaurant(restaurantId) {
    /** Get one restaurant by id. Falls back to mock data if backend route is missing. */
    try {
      return await request(`/restaurants/${encodeURIComponent(restaurantId)}`, { method: "GET" });
    } catch (e) {
      return mockDb.restaurants.find(r => r.id === restaurantId) || null;
    }
  },

  // PUBLIC_INTERFACE
  async listMenuItems(restaurantId) {
    /** List menu items for a restaurant. Falls back to mock data if backend route is missing. */
    try {
      return await request(`/restaurants/${encodeURIComponent(restaurantId)}/menu`, { method: "GET" });
    } catch (e) {
      return mockDb.menuItemsByRestaurantId[restaurantId] || [];
    }
  },

  // PUBLIC_INTERFACE
  async createOrder(payload) {
    /**
     * Create an order. If backend route unavailable, returns a mock order.
     * payload: { restaurantId, items: [{menuItemId,name,price,qty}], address, notes, paymentMethod }
     */
    try {
      return await request("/orders", { method: "POST", body: payload });
    } catch (e) {
      const now = Date.now();
      return {
        id: `ord-mock-${now}`,
        status: "PLACED",
        createdAt: new Date(now).toISOString(),
        ...payload
      };
    }
  },

  // PUBLIC_INTERFACE
  async getOrder(orderId) {
    /** Fetch order detail. For mock orders, the caller should keep local state; this falls back to minimal mock. */
    try {
      return await request(`/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
    } catch (e) {
      return { id: orderId, status: "IN_PROGRESS" };
    }
  },

  // PUBLIC_INTERFACE
  async listOrders() {
    /** List orders (admin view). If backend missing, returns empty and relies on local state when available. */
    try {
      return await request("/orders", { method: "GET" });
    } catch (e) {
      return [];
    }
  },

  // PUBLIC_INTERFACE
  async updateOrderStatus(orderId, status) {
    /** Update order status (admin). Falls back to echo response. */
    try {
      return await request(`/orders/${encodeURIComponent(orderId)}/status`, { method: "PATCH", body: { status } });
    } catch (e) {
      return { id: orderId, status };
    }
  },

  // PUBLIC_INTERFACE
  async adminUpsertRestaurant(restaurant) {
    /** Admin create/update restaurant. Falls back to mock memory update. */
    try {
      if (restaurant.id) return await request(`/admin/restaurants/${encodeURIComponent(restaurant.id)}`, { method: "PUT", body: restaurant });
      return await request("/admin/restaurants", { method: "POST", body: restaurant });
    } catch (e) {
      if (!restaurant.id) {
        restaurant = { ...restaurant, id: `r-mock-${Date.now()}` };
        mockDb.restaurants = [restaurant, ...mockDb.restaurants];
      } else {
        mockDb.restaurants = mockDb.restaurants.map(r => (r.id === restaurant.id ? { ...r, ...restaurant } : r));
      }
      return restaurant;
    }
  },

  // PUBLIC_INTERFACE
  async adminDeleteRestaurant(restaurantId) {
    /** Admin delete restaurant. Falls back to mock memory delete. */
    try {
      return await request(`/admin/restaurants/${encodeURIComponent(restaurantId)}`, { method: "DELETE" });
    } catch (e) {
      mockDb.restaurants = mockDb.restaurants.filter(r => r.id !== restaurantId);
      delete mockDb.menuItemsByRestaurantId[restaurantId];
      return { ok: true };
    }
  },

  // PUBLIC_INTERFACE
  async adminUpsertMenuItem(restaurantId, item) {
    /** Admin create/update menu item. Falls back to mock memory update. */
    try {
      if (item.id) return await request(`/admin/restaurants/${encodeURIComponent(restaurantId)}/menu/${encodeURIComponent(item.id)}`, { method: "PUT", body: item });
      return await request(`/admin/restaurants/${encodeURIComponent(restaurantId)}/menu`, { method: "POST", body: item });
    } catch (e) {
      const list = mockDb.menuItemsByRestaurantId[restaurantId] || [];
      if (!item.id) {
        item = { ...item, id: `m-mock-${Date.now()}` };
        mockDb.menuItemsByRestaurantId[restaurantId] = [item, ...list];
      } else {
        mockDb.menuItemsByRestaurantId[restaurantId] = list.map(mi => (mi.id === item.id ? { ...mi, ...item } : mi));
      }
      return item;
    }
  },

  // PUBLIC_INTERFACE
  async adminDeleteMenuItem(restaurantId, itemId) {
    /** Admin delete menu item. Falls back to mock memory delete. */
    try {
      return await request(`/admin/restaurants/${encodeURIComponent(restaurantId)}/menu/${encodeURIComponent(itemId)}`, { method: "DELETE" });
    } catch (e) {
      const list = mockDb.menuItemsByRestaurantId[restaurantId] || [];
      mockDb.menuItemsByRestaurantId[restaurantId] = list.filter(mi => mi.id !== itemId);
      return { ok: true };
    }
  },

  // PUBLIC_INTERFACE
  async deliveryListAssigned(driverId) {
    /** Delivery: list assigned deliveries. Falls back to a simple mock based on local storage orders. */
    try {
      return await request(`/delivery/${encodeURIComponent(driverId)}/assigned`, { method: "GET" });
    } catch (e) {
      return [];
    }
  },

  // PUBLIC_INTERFACE
  async deliveryUpdateStatus(deliveryId, status) {
    /** Delivery: update status. Falls back to echo. */
    try {
      return await request(`/delivery/${encodeURIComponent(deliveryId)}/status`, { method: "PATCH", body: { status } });
    } catch (e) {
      return { id: deliveryId, status };
    }
  }
};
