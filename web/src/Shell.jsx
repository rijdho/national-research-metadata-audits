import { useEffect, useState } from "react";

// The concept DOI on Zenodo (it resolves to the latest version), shown at the foot of the rail.
const DOI = "10.5281/zenodo.23498571";
import { LANGS, useI18n } from "./i18n/index.jsx";

export const COUNTRIES = { austria: { glyph: "AT" }, netherlands: { glyph: "NL" } };

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const t = localStorage.getItem("nra-theme");
      if (t === "dark" || t === "light") return t;
    } catch { /* storage blocked */ }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const toggle = () => setTheme((t) => {
    const next = t === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("nra-theme", next); } catch { /* storage blocked */ }
    return next;
  });
  return [theme, toggle];
}

const SunIcon = () => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>
);
const MoonIcon = () => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
);
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
);

/**
 * The house shell. `country` is null on the start page.
 * `tabs` are [id, label, mark]; `tab`/`go` drive the current one (none on the start page).
 */
export default function Shell({ country, tabs = [], tab, go, title, children }) {
  const { t, tr, lang, setLang } = useI18n();
  const [theme, toggle] = useTheme();
  const [railOpen, setRailOpen] = useState(false);
  const home = country ? "../" : "./";
  const glyph = country ? COUNTRIES[country].glyph : "NR";
  const name = country ? t(`country.${country}.name`) : t("app.title");
  const toLabel = t(theme === "dark" ? "app.theme.toLight" : "app.theme.toDark");
  useEffect(() => { document.title = country ? t("h1", { country: name }) : t("app.title"); }, [lang, country]);
  const pick = (id) => { setRailOpen(false); go(id); };

  return (
    <div className={`app${railOpen ? " rail-open" : ""}`}>
      <aside className="rail">
        <div className="brand-mark">
          <a className="brand-glyph" style={{ "--glyph": `'${glyph}'` }} href={country ? "./" : home} tabIndex={-1} aria-hidden="true" />
          <div>
            <p className="brand-name"><a href={country ? "./" : home}>{name}</a></p>
            <a className="brand-sub" href="https://rijdho.github.io">rijdho.github.io</a>
            <p className="brand-family">{tr("footer.family")}</p>
          </div>
        </div>
        {tabs.length > 0 && (
          <>
            <p className="nav-label">{t("nav.audit")}</p>
            <nav aria-label={t("nav.audit")}>
              {tabs.map(([id, label, mark]) => (
                <button key={id} type="button" className={`nav-item${tab === id ? " active" : ""}`}
                  aria-current={tab === id ? "page" : undefined} onClick={() => pick(id)}>
                  <span className="nav-step" aria-hidden="true">{mark}</span>
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </>
        )}
        <p className="nav-label">{t("nav.countries")}</p>
        <nav aria-label={t("nav.countries")}>
          {country && (
            <a className="nav-item" href={home}><span className="nav-step" aria-hidden="true">NR</span><span>{t("nav.home")}</span></a>
          )}
          {Object.entries(COUNTRIES).filter(([id]) => id !== country).map(([id, c]) => (
            <a key={id} className="nav-item" href={`${home}${id}/`}>
              <span className="nav-step" aria-hidden="true">{c.glyph}</span><span>{t(`country.${id}.name`)}</span>
            </a>
          ))}
        </nav>
        {/* The credits stand here only (house-style README, "The house credits"). */}
        <div className="rail-foot">
          {tr("rail.by")}<br />
          {t("rail.code")}<br />
          {t("rail.data")}<br />
          {tr("rail.source")}<br />
          <a href={`https://doi.org/${DOI}`} target="_blank" rel="noopener noreferrer">DOI {DOI}</a>
        </div>
      </aside>
      {railOpen && <button className="rail-backdrop" type="button" aria-label={t("app.menuClose")} onClick={() => setRailOpen(false)} />}
      <div className="main-col">
        <div className="cmdbar">
          <button className="menu-btn" type="button" onClick={() => setRailOpen(true)} aria-label={t("app.menu")}><MenuIcon /></button>
          <div className="cmd-title">{title}</div>
          <div className="cmd-spacer" />
          {/* The switch shows only when there is more than one language. */}
          {LANGS.length > 1 && (
            <div className="langs" role="group" aria-label={t("app.language")}>
              {LANGS.map((l) => (
                <button key={l.code} type="button" aria-current={lang === l.code ? "true" : undefined} title={l.label}
                  lang={l.code} onClick={() => setLang(l.code)}>{l.short}</button>
              ))}
            </div>
          )}
          <button className="icon-btn" type="button" onClick={toggle} title={toLabel} aria-label={toLabel}>
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
        <main className="content">
          <div className="content-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
