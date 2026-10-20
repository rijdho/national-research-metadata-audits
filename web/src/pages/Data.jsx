import { useI18n } from "../i18n/index.jsx";
import { Note, dataUrl } from "../lib.jsx";
import { MIN_PROFILES } from "./Researchers.jsx";

const JSON_FILES = [
  "orcid-overview.json", "orcid-overview-staff.json", "orcid-institutions.json", "orcid-institutions-staff.json",
  "orcid-fields.json", "orcid-fields-staff.json", "orcid-timeline.json", "orcid-timeline-staff.json",
  "repos-overview.json", "repos.json", "repos-software.json", "repos-institutions.json",
];

export default function Data({ country, repoOv, orcidAll }) {
  const { t, tr } = useI18n();
  const file = (name) => (
    <a className="mono" href={dataUrl(`${country}/${name}`)} download>{name}</a>
  );
  return (
    <div className="prose">
      <h2>{t("data.title")}</h2>
      <Note>{tr("data.note")}</Note>
      <ul className="downloads">
        <li>{file("institutions.csv")}<span className="muted">{t("data.institutions")}</span></li>
        <li>{file("repositories.csv")}<span className="muted">{t("data.repositories")}</span></li>
      </ul>
      <p className="muted">{tr("data.dictionary")}</p>
      <h2>{t("data.json.title")}</h2>
      <Note>{t("data.json.note")}</Note>
      <p className="json-list">
        {JSON_FILES.map((f, i) => <span key={f}>{i > 0 && " · "}{file(f)}</span>)}
      </p>
      <p className="muted">{t("data.small", { min: MIN_PROFILES })}</p>
      {repoOv && orcidAll && (
        <p className="muted">{t("data.generated", { ...repoOv.dates,
          orcid: orcidAll.fetchedFrom === orcidAll.fetchedTo ? t("data.orcid.on", { d: orcidAll.fetchedTo }) : t("data.orcid.range", { from: orcidAll.fetchedFrom, to: orcidAll.fetchedTo }) })}</p>
      )}
      <h2>{t("data.private.title")}</h2>
      <p className="muted">{tr("data.private.body")}</p>
    </div>
  );
}
