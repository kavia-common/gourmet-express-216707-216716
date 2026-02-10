import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui";

// PUBLIC_INTERFACE
export default function NotFoundPage() {
  /** 404 page. */
  return (
    <div className="container main">
      <h1 className="h1">404</h1>
      <div className="subtle">This route does not exist. Return to the restaurant grid.</div>
      <hr className="hr" />
      <Card title="Lost in the neon grid" right={<span className="tag">Not found</span>}>
        <div className="subtle">
          Head back to home to continue.
        </div>
        <div style={{ marginTop: 12 }}>
          <Link to="/" className="btn btn-primary btn-block" style={{ textDecoration: "none" }}>
            Go to Restaurants
          </Link>
        </div>
      </Card>
    </div>
  );
}
