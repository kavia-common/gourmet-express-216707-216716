import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Restaurants header", () => {
  render(<App />);
  const header = screen.getByText(/Restaurants/i);
  expect(header).toBeInTheDocument();
});
