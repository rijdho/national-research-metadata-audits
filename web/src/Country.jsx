import { useEffect, useState } from "react";
import { useI18n } from "./i18n/index.jsx";
import { useData } from "./lib.jsx";
import Shell from "./Shell.jsx";
import Overview from "./pages/Overview.jsx";
import Repositories from "./pages/Repositories.jsx";
import Researchers from "./pages/Researchers.jsx";
import Data from "./pages/Data.jsx";
import About from "./pages/About.jsx";

const TAB_IDS = ["overview", "repos", "researchers", "data", "about"];
const MARKS = { overview: "01", repos: "02", researchers: "03", data: "↓", about: "i" };
// The tab is kept in the address (#researchers), so a link can open it directly.
const fromHash = () => {
  const h = window.location.hash.slice(1);
  return TAB_IDS.includes(h) ? h : "overview";
};

export default function Country({ country }) {
  const { t, tr } = useI18n();
  const [tab, setTab] = useState(fromHash);
  const [view, setView] = useState("all");
  useEffect(() => {
    const on = () => setTab(fromHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = (id) => {
    history.replaceState(null, "", id === "overview" ? window.location.pathname + window.location.search : `#${id}`);
    setTab(id);
    window.scrollTo(0, 0);
  };

  const d = (f) => `${country}/${f}`;
  const repoOv = useData(d("repos-overview.json"));
  const repos = useData(d("repos.json"));
  const software = useData(d("repos-software.json"));
  const orcidAll = useData(d("orcid-overview.json"));
  const orcidStaff = useData(d("orcid-overview-staff.json"));
  const institutions = useData(d(view === "staff" ? "orcid-institutions-staff.json" : "orcid-institutions.json"));

  const c = { name: t(`country.${country}.name`), in: t(`country.${country}.in`) };
  const tabs = TAB_IDS.map((id) => [id, t(`tab.${id}`), MARKS[id]]);
  const shared = { c, orcidAll, orcidStaff };

  return (
    <Shell country={country} tabs={tabs} tab={tab} go={go} title={t(`tab.${tab}`)}>
      <p className="eyebrow">{t("app.eyebrow")}</p>
      <h1>{t("h1", { country: c.name })}</h1>
      <p className="lede">{tr("lede", { in: c.in })}</p>
      {tab === "overview" && <Overview {...shared} repoOv={repoOv} />}
      {tab === "repos" && <Repositories repoOv={repoOv} repos={repos} software={software} />}
      {tab === "researchers" && <Researchers {...shared} institutions={institutions} view={view} setView={setView} />}
      {tab === "data" && <Data country={country} repoOv={repoOv} orcidAll={orcidAll} />}
      {tab === "about" && <About c={c} />}
    </Shell>
  );
}
