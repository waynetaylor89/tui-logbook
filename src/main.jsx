import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { isExpired } from "./utils/dateUtils";
import "./index.css";

function WrappedApp() {
  useEffect(() => {
    if (isExpired(new Date("2023-12-31T23:59:59Z"))) {
      document.body.style.color = "red";
    }
  }, []);

  return <App />;
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <WrappedApp />
  </BrowserRouter>
);