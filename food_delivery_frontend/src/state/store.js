import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const STORAGE_KEY = "gourmet_express_state_v1";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const initialState = {
  cart: {
    restaurantId: null,
    items: [] // { menuItemId, name, price, qty }
  },
  orders: [] // { id, status, restaurantId, items, address, notes, paymentMethod, createdAt }
};

function reducer(state, action) {
  switch (action.type) {
    case "CART_CLEAR":
      return { ...state, cart: { restaurantId: null, items: [] } };

    case "CART_ADD_ITEM": {
      const { restaurantId, item } = action.payload;

      // Enforce single-restaurant cart for simplicity.
      const isDifferentRestaurant = state.cart.restaurantId && state.cart.restaurantId !== restaurantId;
      const baseCart = isDifferentRestaurant ? { restaurantId, items: [] } : { ...state.cart, restaurantId };

      const existing = baseCart.items.find((i) => i.menuItemId === item.menuItemId);
      const items = existing
        ? baseCart.items.map((i) => (i.menuItemId === item.menuItemId ? { ...i, qty: i.qty + item.qty } : i))
        : [item, ...baseCart.items];

      return { ...state, cart: { ...baseCart, items } };
    }

    case "CART_SET_QTY": {
      const { menuItemId, qty } = action.payload;
      const items = state.cart.items
        .map((i) => (i.menuItemId === menuItemId ? { ...i, qty } : i))
        .filter((i) => i.qty > 0);
      return { ...state, cart: { ...state.cart, items } };
    }

    case "ORDER_ADD": {
      const order = action.payload;
      return { ...state, orders: [order, ...state.orders] };
    }

    case "ORDER_UPDATE_STATUS": {
      const { orderId, status } = action.payload;
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o))
      };
    }

    case "HYDRATE":
      return action.payload;

    default:
      return state;
  }
}

const StoreCtx = createContext(null);

// PUBLIC_INTERFACE
export function StoreProvider({ children }) {
  /** Provides app-wide cart and orders state with persistence. */
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate once.
  useEffect(() => {
    const saved = safeParse(window.localStorage.getItem(STORAGE_KEY) || "");
    if (saved && typeof saved === "object") dispatch({ type: "HYDRATE", payload: { ...initialState, ...saved } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist.
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const api = useMemo(() => {
    const getCartTotal = () =>
      state.cart.items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);

    return {
      state,

      // PUBLIC_INTERFACE
      addToCart: (restaurantId, menuItem) => {
        /** Add a menu item to cart (qty +1). */
        dispatch({
          type: "CART_ADD_ITEM",
          payload: {
            restaurantId,
            item: { menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, qty: 1 }
          }
        });
      },

      // PUBLIC_INTERFACE
      setCartQty: (menuItemId, qty) => {
        /** Set quantity for a cart item. Qty<=0 removes item. */
        dispatch({ type: "CART_SET_QTY", payload: { menuItemId, qty } });
      },

      // PUBLIC_INTERFACE
      clearCart: () => {
        /** Clear the cart. */
        dispatch({ type: "CART_CLEAR" });
      },

      // PUBLIC_INTERFACE
      cartTotal: () => {
        /** Calculate cart total. */
        return getCartTotal();
      },

      // PUBLIC_INTERFACE
      addOrder: (order) => {
        /** Add an order to local state. */
        dispatch({ type: "ORDER_ADD", payload: order });
      },

      // PUBLIC_INTERFACE
      updateOrderStatusLocal: (orderId, status) => {
        /** Update order status in local state. */
        dispatch({ type: "ORDER_UPDATE_STATUS", payload: { orderId, status } });
      }
    };
  }, [state]);

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}

// PUBLIC_INTERFACE
export function useStore() {
  /** Hook for accessing store state/actions. */
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
