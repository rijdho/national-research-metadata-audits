import { createRoot } from "react-dom/client";
// The shared look (an exact copy of the house style), then this site's own styles.
import "./house/house.css";
import "./house/house-data.css";
import "./index.css";
import { tooltips } from "./house/house-tip.js";
import { LangProvider } from "./i18n/index.jsx";
import Country from "./Country.jsx";
import Home from "./Home.jsx";

// Each HTML page names its country on #root; the start page names none.
const root = document.getElementById("root");
const country = root.dataset.country || null;

// One floating tooltip for every element with data-tip (house-tip.js; #tip is in each page).
tooltips();

createRoot(root).render(
  <LangProvider>
    {country ? <Country country={country} /> : <Home />}
  </LangProvider>
);
