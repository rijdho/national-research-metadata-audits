import { useEffect, useState } from "react";
import { useI18n } from "./i18n/index.jsx";

// Data files live next to the pages: ./data/ from the start page, ../data/ from a country page.
const BASE = document.getElementById("root")?.dataset.base || "./";

export function useData(path) {
  const [data, setData] = useState(undefined);
  useEffect(() => {
    let alive = true;
    setData(undefined);
    fetch(`${BASE}data/${path}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(null));
    return () => { alive = false; };
  }, [path]);
  return data;
}
export const dataUrl = (path) => `${BASE}data/${path}`;

// Share of the profiles in the given link classes; null when there is nothing to count.
export const STAFF = ["current", "undated-recent"];
export function share(linkCounts, keys) {
  const n = Object.values(linkCounts || {}).reduce((a, b) => a + b, 0);
  return n ? keys.reduce((a, k) => a + (linkCounts[k] || 0), 0) / n : null;
}

// Every repository is a DataCite client, so it always has a DataCite Commons page.
export const dcUrl = (id) => `https://commons.datacite.org/repositories/${id}`;
// Some DataCite URLs omit the scheme.
export const extUrl = (u) => (!u ? null : /^https?:\/\//i.test(u) ? u : `https://${u}`);

/** Number formatters in the interface language. */
export function useFormat() {
  const { locale, t } = useI18n();
  const nf1 = new Intl.NumberFormat(locale, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf0 = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  return {
    pct: (x) => (x == null ? t("app.na") : nf1.format(x)),
    pct0: (x) => (x == null ? t("app.na") : nf0.format(x)),
    num: (n) => (n == null ? t("app.na") : n.toLocaleString(locale)),
    /** "a, b and c" in the interface language. */
    list: (items) => new Intl.ListFormat(locale, { type: "conjunction" }).format(items),
  };
}

export function Stat({ value, label, sub, tip }) {
  return (
    <div className="stat">
      <div className="num">{value}</div>
      <div className="lbl" data-tip={tip || undefined}>{label}</div>
      {sub && <div className="lbl" style={{ marginTop: 2, opacity: 0.7 }}>{sub}</div>}
    </div>
  );
}

export function Bar({ label, value, count, max = 1, color, tip }) {
  const { pct0 } = useFormat();
  const w = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    // The tooltip belongs to the whole row, so it opens centred above the bar.
    <div className="bar-row" data-tip={tip || undefined}>
      <span className="lbl">{label}</span>
      <span className="bar-bg"><span className="bar-fg" style={{ width: `${w}%`, background: color }} /></span>
      <span className="count">{count ?? pct0(value)}</span>
    </div>
  );
}

// Short explanation under a heading.
export function Note({ children }) {
  return <p className="muted note">{children}</p>;
}

// "term: meaning" list.
export function DefList({ items }) {
  return (
    <div className="deflist">
      {items.map(([k, v]) => (
        <div key={k} className="muted"><b>{k}</b>: {v}</div>
      ))}
    </div>
  );
}

export function Callout({ title, children }) {
  return (
    <div className="callout">
      <div className="callout-title">{title}</div>
      <div className="muted">{children}</div>
    </div>
  );
}

export function ViewToggle({ view, setView, since }) {
  const { t } = useI18n();
  return (
    <div style={{ margin: "0 0 12px" }}>
      <div className="view-toggle" role="group" aria-label={t("view.label")}>
        {["all", "staff"].map((v) => (
          <button key={v} type="button" className={view === v ? "active" : ""} aria-pressed={view === v} onClick={() => setView(v)}>
            {t(`view.${v}`)}
          </button>
        ))}
      </div>
      <div className="muted view-hint">{t(`view.${view}.hint`, { year: since ?? "" })}</div>
    </div>
  );
}

/** A table header cell with an optional tooltip; `r` right-aligns a numeric column. */
export function Th({ children, tip, r }) {
  return <th className={r ? "r" : undefined} data-tip={tip || undefined}>{children}</th>;
}
