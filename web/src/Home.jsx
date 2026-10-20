import { useI18n } from "./i18n/index.jsx";
import { Note, Th, useData, useFormat } from "./lib.jsx";
import Shell, { COUNTRIES } from "./Shell.jsx";
import Radar from "./Radar.jsx";
import { CATS } from "./pages/Overview.jsx";

const COLORS = ["var(--f-F)", "var(--f-A)", "var(--f-I)", "var(--f-R)"];

const IDS = Object.keys(COUNTRIES);

function useCountry(id) {
  return {
    repos: useData(`${id}/repos-overview.json`),
    all: useData(`${id}/orcid-overview.json`),
    staff: useData(`${id}/orcid-overview-staff.json`),
  };
}

export default function Home() {
  const { t, tr } = useI18n();
  const { pct, num } = useFormat();
  // One hook call per country, in a fixed order.
  const data = Object.fromEntries(IDS.map((id) => [id, useCountry(id)]));
  const ROWS = [
    ["home.row.repos", null, (d) => num(d.repos?.totals.repositories)],
    ["home.row.dois", null, (d) => num(d.repos?.totals.totalDois)],
    ["home.row.complete", "home.row.complete.tip", (d) => pct(d.repos?.avgCompleteness)],
    ["home.row.fair", "fair.col.sampled.tip", (d) => (d.repos?.fairLive ? pct(d.repos.fairLive.overallPercent / 100) : null)],
    ["home.row.profiles", "ov.orcid.profiles.tip", (d) => num(d.all?.uniqueProfiles)],
    ["home.row.orcidAll", "ov.orcid.avg.tip", (d) => pct(d.all?.avgOverall)],
    ["home.row.orcidStaff", "view.staff.hint", (d) => pct(d.staff?.avgOverall)],
    ["home.row.empty", "ov.orcid.empty.tip", (d) => pct(d.all?.avgEmpty)],
  ];
  const year = data[IDS[0]].all?.undatedRecentSince;
  return (
    <Shell country={null} title={t("app.title")}>
      <h1>{t("app.title")}</h1>
      <p className="lede">{t("home.lede")}</p>
      <div className="table-wrap compare">
        <table>
          <thead>
            <tr>
              <Th />
              {IDS.map((id) => <Th key={id} r><a href={`./${id}/`}>{t(`country.${id}.name`)}</a></Th>)}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([key, tip, f]) => (
              <tr key={key}>
                <td data-tip={tip ? t(tip, { year }) : undefined}>{t(key)}</td>
                {IDS.map((id) => <td key={id} className="mono r">{f(data[id]) ?? t("app.na")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {IDS.every((id) => data[id].all) && (
        <>
          <h2>{t("home.radar.title")}</h2>
          <Note>{t("home.radar.note")}</Note>
          <Radar label={t("home.radar.title")}
            axes={CATS.map((k) => ({ key: k, label: t(`cat.${k}`) }))}
            series={IDS.map((id, i) => ({ label: t(`country.${id}.name`), color: COLORS[i % COLORS.length], values: data[id].all.categoryAverages }))} />
        </>
      )}
      <div className="country-links">
        {IDS.map((id) => (
          <a key={id} className="btn" href={`./${id}/`}>{t("home.open", { country: t(`country.${id}.name`) })}</a>
        ))}
      </div>
      <p className="muted">{tr("home.data")}</p>
    </Shell>
  );
}
