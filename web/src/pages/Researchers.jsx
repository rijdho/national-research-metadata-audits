import { useI18n } from "../i18n/index.jsx";
import { Callout, Note, STAFF, Th, ViewToggle, share, useFormat } from "../lib.jsx";

export const MIN_PROFILES = 5; // the export blanks institutions below this (scripts/export.mjs)
export const ID_SOURCES = ["ROR", "RINGGOLD", "GRID", "FUNDREF", "LEI", "NONE"];
const CHECKS = ["biography", "keywords", "country", "urls", "employment_dated", "employment_ror_elsewhere", "education",
  "has_works", "works_5plus", "works_with_doi", "funding", "peer_review"];

function LinkTable({ ov }) {
  const { t, tr } = useI18n();
  const { pct, num } = useFormat();
  const year = ov.undatedRecentSince;
  const types = Object.entries(ov.byType || {});
  const keys = Object.keys(ov.linkCounts).filter((k) => k !== "none" || ov.linkCounts.none > 0);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <Th>{t("th.link")}</Th>
            <Th r>{t("th.profiles")}</Th>
            <Th r>{t("th.all")}</Th>
            {types.map(([k]) => <Th key={k} r>{t(`type.${k}`)}</Th>)}
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k}>
              <td data-tip={t(`link.${k}.tip`, { year })}>{t(`link.${k}`, { year })}</td>
              <td className="mono r">{num(ov.linkCounts[k])}</td>
              <td className="mono r">{pct(share(ov.linkCounts, [k]))}</td>
              {types.map(([tk, v]) => <td key={tk} className="mono r">{pct(share(v.linkCounts, [k]))}</td>)}
            </tr>
          ))}
          <tr>
            <td>{tr("res.links.staffRow")}</td>
            <td className="mono r">{num(STAFF.reduce((a, k) => a + (ov.linkCounts[k] || 0), 0))}</td>
            <td className="mono r"><b>{pct(share(ov.linkCounts, STAFF))}</b></td>
            {types.map(([tk, v]) => <td key={tk} className="mono r">{pct(share(v.linkCounts, STAFF))}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Employment entries at other organisations by the year they were added to ORCID. Up to 2021
// almost none carry a ROR id, from 2023 most do; 2022 is the change-over.
export const PERIODS = [["early", (y) => y <= 2021], ["y2022", (y) => y === 2022], ["late", (y) => y >= 2023]];
const sumBy = (byYear, keep) => {
  const out = {};
  for (const [y, m] of Object.entries(byYear || {})) if (keep(Number(y))) for (const [k, v] of Object.entries(m)) out[k] = (out[k] || 0) + v;
  return out;
};
const total = (m) => Object.values(m || {}).reduce((a, b) => a + b, 0);

function IdsTable({ all, staff }) {
  const { t, tr } = useI18n();
  const { pct, pct0, num } = useFormat();
  const cols = PERIODS.map(([k, keep]) => [k, sumBy(all.byYear, keep)]);
  const every = sumBy(all.byYear, () => true);
  const rorShare = (m) => (total(m) ? (m.ROR || 0) / total(m) : null);
  const staffCols = staff?.byYear && PERIODS.map(([k, keep]) => [k, sumBy(staff.byYear, keep)]);
  const staffEvery = staff?.byYear && sumBy(staff.byYear, () => true);
  return (
    <>
      <h2>{t("res.ids.title")}</h2>
      <Note>{tr("res.ids.note", { here: num(total(all.here)) })}</Note>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><Th>{t("th.idSource")}</Th>
              {cols.map(([k]) => <Th key={k} r>{t(`ids.period.${k}`)}</Th>)}
              <Th r>{t("ids.period.all")}</Th></tr>
          </thead>
          <tbody>
            {ID_SOURCES.filter((k) => every[k]).map((k) => (
              <tr key={k}>
                <td data-tip={t(`ids.${k}.tip`)}>{t(`ids.${k}`)}</td>
                {cols.map(([p, m]) => <td key={p} className="mono r">{pct(total(m) ? (m[k] || 0) / total(m) : null)}</td>)}
                <td className="mono r">{pct(total(every) ? (every[k] || 0) / total(every) : null)}</td>
              </tr>
            ))}
            <tr>
              <td>{t("th.entries")}</td>
              {cols.map(([p, m]) => <td key={p} className="mono r">{num(total(m))}</td>)}
              <td className="mono r">{num(total(every))}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {staffCols && (
        <Note>{tr("res.ids.staff", {
          staff: pct0(rorShare(staffEvery)), all: pct0(rorShare(every)),
          staffEarly: pct0(total(staffCols[0][1]) / total(staffEvery)), allEarly: pct0(total(cols[0][1]) / total(every)),
          pairs: PERIODS.map(([k], i) => t("res.ids.pair", { period: t(`ids.period.${k}`).toLowerCase(),
            staff: pct0(rorShare(staffCols[i][1])), all: pct0(rorShare(cols[i][1])) })).join("; "),
        })}</Note>
      )}
    </>
  );
}

export default function Researchers({ c, orcidAll, orcidStaff, institutions, view, setView }) {
  const { t, tr } = useI18n();
  const { pct, pct0, num } = useFormat();
  if (orcidAll === undefined) return <p className="muted">{t("app.loading")}</p>;
  if (!orcidAll || !orcidAll.totalInstitutions) {
    return (
      <div>
        <h2>{t("res.pending.title", { in: c.in })}</h2>
        <p className="muted">{t("res.pending.note", { in: c.in })}</p>
      </div>
    );
  }
  const year = orcidAll.undatedRecentSince;
  const both = () => (
    <>
      <Th r tip={t("view.all.hint")}>{t("view.all")}</Th>
      <Th r tip={t("view.staff.hint", { year })}>{t("view.staff")}</Th>
    </>
  );
  const rows = [...(institutions || [])].sort((a, b) => (b.totalProfiles || 0) - (a.totalProfiles || 0));
  const small = <span className="muted" data-tip={t("res.inst.suppressed", { min: MIN_PROFILES })}>{t("res.inst.hidden")}</span>;
  return (
    <div>
      <Callout title={t("res.counted.title")}>{tr("res.counted.body", { in: c.in, year })}</Callout>

      <h2>{t("res.byType.title")}</h2>
      <Note>{t("res.byType.note")}{orcidAll.byType?.healthcare && <> {t("res.byType.umc")}</>}</Note>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <Th>{t("th.type")}</Th>
              <Th r>{t("th.institutions")}</Th>
              <Th r>{t("th.profiles")}</Th>
              <Th r tip={t("res.byType.complete.tip", { view: t("view.all") })}>{t("th.complete")}: {t("view.all").toLowerCase()}</Th>
              <Th r tip={t("res.byType.complete.tip", { view: t("view.staff") })}>{t("th.complete")}: {t("view.staff").toLowerCase()}</Th>
              <Th r tip={t("th.staff.tip")}>{t("th.staff")}</Th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(orcidAll.byType || {}).map(([k, v]) => (
              <tr key={k}>
                <td>{t(`type.${k}`)}</td>
                <td className="mono r">{num(v.count)}</td>
                <td className="mono r">{num(v.totalProfiles)}</td>
                <td className="mono r">{pct(v.avgOverall)}</td>
                <td className="mono r">{pct(orcidStaff?.byType?.[k]?.avgOverall)}</td>
                <td className="mono r">{pct0(share(v.linkCounts, STAFF))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>{t("res.checks.title")}</h2>
      <Note>{t("res.checks.note")}</Note>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><Th>{t("th.check")}</Th>{both()}</tr>
          </thead>
          <tbody>
            {[...CHECKS].sort((a, b) => orcidAll.fieldAverages[a] - orcidAll.fieldAverages[b]).map((k) => (
              <tr key={k}>
                <td data-tip={t(`check.${k}.tip`)}>{t(`check.${k}`)}</td>
                <td className="mono r">{pct0(orcidAll.fieldAverages[k])}</td>
                <td className="mono r">{pct0(orcidStaff?.fieldAverages?.[k])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orcidAll.employmentIds?.byYear && <IdsTable all={orcidAll.employmentIds} staff={orcidStaff?.employmentIds} />}

      <h2>{t("res.links.title")}</h2>
      <Note>{t("res.links.note")}</Note>
      <LinkTable ov={orcidAll} />

      <h2>{t("res.inst.title", { n: rows.length })}</h2>
      <Note>{tr("res.inst.note", { min: MIN_PROFILES })}</Note>
      <ViewToggle view={view} setView={setView} since={year} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <Th>{t("th.institution")}</Th><Th>{t("th.type")}</Th><Th r>{t("th.profiles")}</Th>
              <Th r tip={t("ov.orcid.avg.tip")}>{t("th.complete")}</Th>
              <Th r tip={t("ov.orcid.empty.tip")}>{t("th.empty")}</Th>
              <Th r tip={t("th.staff.tip")}>{t("th.staff")}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.ror ? <a href={r.ror} target="_blank" rel="noreferrer">{r.name}</a> : r.name}</td>
                <td className="muted">{t(`type1.${r.type}`)}</td>
                <td className="mono r">{num(r.totalProfiles)}</td>
                <td className="mono r">{r.suppressed ? small : pct0(r.avgOverall)}</td>
                <td className="mono r">{r.suppressed ? small : pct0(r.emptyProfilesPct)}</td>
                <td className="mono r">{r.suppressed ? small : pct0(share(r.linkCounts, STAFF))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
