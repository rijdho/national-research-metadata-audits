import { useI18n } from "../i18n/index.jsx";
import { FAIR_LETTERS, FAIR_NAMES } from "./Overview.jsx";

export default function About({ c }) {
  const { t, tr } = useI18n();
  return (
    <div className="prose">
      <h2>{t("about.what.title")}</h2>
      <p className="muted">{tr("about.what.body", { in: c.in })}</p>
      <h2>{t("about.fair.title")}</h2>
      <p className="muted">{tr("about.fair.sampled")}</p>
      <p className="muted">{tr("about.fair.fields")}</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>{t("fair.principle")}</th><th>{t("fair.col.sampled")}</th><th>{t("fair.col.fields")}</th></tr></thead>
          <tbody>
            {FAIR_LETTERS.map((l) => (
              <tr key={l}><td>{FAIR_NAMES[l]}</td><td className="muted">{t(`fair.sampled.${l}`)}</td><td className="muted">{t(`fair.fields.${l}`)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>{t("about.limits.title")}</h2>
      <ul className="muted">
        {[1, 2, 3, 4].map((i) => <li key={i}>{tr(`about.limits.${i}`)}</li>)}
      </ul>
      <h2>{t("about.sources.title")}</h2>
      <ul className="muted">
        {[1, 2, 3, 4].map((i) => <li key={i}>{t(`about.sources.${i}`, { in: c.in })}</li>)}
      </ul>
    </div>
  );
}
