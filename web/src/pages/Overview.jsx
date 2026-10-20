import { useI18n } from "../i18n/index.jsx";
import { Bar, Note, Stat, Th, STAFF, share, useFormat } from "../lib.jsx";
import Radar from "../Radar.jsx";

export const FAIR_LETTERS = ["F", "A", "I", "R"];
export const FAIR_NAMES = { F: "Findable", A: "Accessible", I: "Interoperable", R: "Reusable" };
export const FIELDS = ["titles", "descriptions", "subjects", "relatedIdentifiers", "alternateIdentifiers", "version",
  "fundingReferences", "container", "geoLocations", "creators", "creatorOrcid", "contributors"];
export const CATS = ["identity", "employment", "education", "works", "funding", "peer_review"];
// Required by the DataCite schema, so filled in nearly every record whatever the repository does.
export const REQUIRED = ["titles", "creators"];

// The main results, written from the data: every figure in these sentences is read from the files.
function MainResults({ c, repoOv, orcidAll, orcidStaff }) {
  const { t, tr } = useI18n();
  const { pct0, num, list } = useFormat();
  const items = [];
  if (repoOv) {
    const f = FIELDS.filter((k) => !REQUIRED.includes(k)).sort((a, b) => repoOv.fieldAverages[b] - repoOv.fieldAverages[a]);
    const named = (ks) => list(ks.map((k) => `${t(`field.${k}`)} (${pct0(repoOv.fieldAverages[k])})`));
    items.push(tr("find.repos", { n: num(repoOv.totals.withDois), pct: pct0(repoOv.avgCompleteness),
      required: named(REQUIRED), top: named(f.slice(0, 2)), bottom: named(f.slice(-2).reverse()) }));
    if (repoOv.fairLive) {
      items.push(tr("find.fair", { pct: pct0(repoOv.fairLive.overallPercent / 100), met: repoOv.fairLive.metByAll }));
    }
  }
  if (orcidAll?.totalInstitutions) {
    items.push(tr("find.orcid", { n: num(orcidAll.uniqueProfiles), pairs: num(orcidAll.totalProfiles),
      inst: num(orcidAll.totalInstitutions), pct: pct0(orcidAll.avgOverall), empty: pct0(orcidAll.avgEmpty) }));
    const bl = orcidAll.byLink;
    if (orcidStaff?.totalInstitutions && bl?.current && bl["undated-recent"]) {
      items.push(tr("find.staff", { share: pct0(share(orcidAll.linkCounts, STAFF)), staff: pct0(orcidStaff.avgOverall),
        all: pct0(orcidAll.avgOverall), dated: pct0(bl.current.avgOverall), undated: pct0(bl["undated-recent"].avgOverall),
        year: orcidAll.undatedRecentSince }));
    }
    const low = [...CATS].sort((a, b) => orcidAll.categoryAverages[a] - orcidAll.categoryAverages[b]).slice(0, 2);
    const e = orcidAll.employmentIds?.elsewhere;
    if (e) {
      const n = Object.values(e).reduce((a, b) => a + b, 0);
      const other = (e.RINGGOLD || 0) + (e.GRID || 0) + (e.FUNDREF || 0) + (e.LEI || 0);
      const by = orcidAll.employmentIds.byYear || {};
      const early = { n: 0, ror: 0 }, late = { n: 0, ror: 0 };
      for (const [y, m] of Object.entries(by)) {
        const g = Number(y) <= 2021 ? early : Number(y) >= 2023 ? late : null;
        if (g) { g.n += Object.values(m).reduce((a, b) => a + b, 0); g.ror += m.ROR || 0; }
      }
      if (n) items.push(tr("find.ids", { n: num(n), ror: pct0((e.ROR || 0) / n), other: pct0(other / n), none: pct0((e.NONE || 0) / n),
        early: pct0(early.n ? early.ror / early.n : 0), late: pct0(late.n ? late.ror / late.n : 0) }));
    }
    items.push(tr("find.cats", { low: list(low.map((k) => `${t(`cat.${k}`).toLowerCase()} (${pct0(orcidAll.categoryAverages[k])})`)) }));
  }
  if (!items.length) return null;
  return (
    <>
      <h2>{t("find.title")}</h2>
      <ul className="findings">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </>
  );
}

// FAIR read two ways, side by side, one row per principle.
export function FairTable({ repoOv }) {
  const { t } = useI18n();
  const { pct0 } = useFormat();
  const live = repoOv.fairLive;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <Th>{t("fair.principle")}</Th>
            {live && <Th r tip={t("fair.col.sampled.tip")}>{t("fair.col.sampled")}</Th>}
            <Th r tip={t("fair.col.fields.tip")}>{t("fair.col.fields")}</Th>
          </tr>
        </thead>
        <tbody>
          {FAIR_LETTERS.map((l) => (
            <tr key={l}>
              <td>{FAIR_NAMES[l]}</td>
              {live && <td className="mono r" data-tip={t(`fair.sampled.${l}`)}>{pct0(live[l])}</td>}
              <td className="mono r" data-tip={t(`fair.fields.${l}`)}>{pct0(repoOv.fairAverages[FAIR_NAMES[l]])}</td>
            </tr>
          ))}
          {live && (
            <tr>
              <td><b>{t("fair.overall")}</b></td>
              <td className="mono r"><b>{pct0(live.overallPercent / 100)}</b></td>
              <td className="mono r muted">{t("app.na")}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function Overview({ c, repoOv, orcidAll, orcidStaff }) {
  const { t, tr } = useI18n();
  const { pct, pct0, num } = useFormat();
  const tot = repoOv?.totals;
  return (
    <div>
      {repoOv === undefined || orcidAll === undefined
        ? <p className="muted">{t("app.loading")}</p>
        : <MainResults c={c} repoOv={repoOv} orcidAll={orcidAll} orcidStaff={orcidStaff} />}

      <h2>{t("ov.repos.title")}</h2>
      <Note>{tr("ov.repos.note", { in: c.in })}</Note>
      {repoOv && (
        <>
          <div className="stat-grid">
            <Stat value={num(tot.repositories)} label={t("ov.repos.count")} sub={t("ov.repos.members", { n: num(tot.providers) })}
              tip={t("ov.repos.count.tip", { n: num(tot.withDois) })} />
            <Stat value={num(tot.totalDois)} label={t("ov.repos.dois")} tip={t("ov.repos.dois.tip")} />
            <Stat value={pct(repoOv.avgCompleteness)} label={t("ov.repos.avg")} sub={t("ov.repos.weighted", { pct: pct(repoOv.doiWeightedCompleteness) })}
              tip={t("ov.repos.avg.tip", { name: repoOv.largest?.name, share: pct0((repoOv.largest?.dois || 0) / (tot.totalDois || 1)) })} />
            <Stat value={`${tot.alive + tot.protected}/${tot.repositories}`} label={t("ov.repos.alive")} sub={t("ov.repos.noUrl", { n: num(tot.noUrl) })}
              tip={t("ov.repos.alive.tip", { protected: num(tot.protected) })} />
          </div>
          <h3>{t("ov.fields.title")}</h3>
          <Note>{t("ov.fields.note")}</Note>
          <div className="bar-rows">
            {[...FIELDS].sort((a, b) => repoOv.fieldAverages[b] - repoOv.fieldAverages[a]).map((k) => (
              <Bar key={k} label={t(`field.${k}`)} value={repoOv.fieldAverages[k]} color="var(--color-accent)" tip={t(`field.${k}.def`)} />
            ))}
          </div>
          <h3>{t("ov.fair.title")}</h3>
          <Note>{tr("ov.fair.note", { met: repoOv.fairLive?.metByAll ?? "" })}</Note>
          <FairTable repoOv={repoOv} />
        </>
      )}

      <hr />
      <h2>{t("ov.orcid.title")}</h2>
      <Note>{tr("ov.orcid.note", { in: c.in })}</Note>
      {orcidAll && orcidAll.totalInstitutions > 0 ? (
        <div className="with-radar">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><Th />
                <Th r tip={t("view.all.hint")}>{t("view.all")}</Th>
                <Th r tip={t("view.staff.hint", { year: orcidAll.undatedRecentSince })}>{t("view.staff")}</Th></tr>
            </thead>
            <tbody>
              {[
                ["ov.orcid.institutions", null, (o) => num(o.totalInstitutions)],
                ["ov.orcid.profiles", "ov.orcid.profiles.tip", (o) => num(o.uniqueProfiles)],
                ["ov.orcid.avg", "ov.orcid.avg.tip", (o) => pct(o.avgOverall)],
                ["ov.orcid.empty", "ov.orcid.empty.tip", (o) => pct(o.avgEmpty)],
                ["ov.orcid.rich", "ov.orcid.rich.tip", (o) => pct(o.avgRich)],
                ...CATS.map((k) => [`cat.${k}`, `cat.${k}.def`, (o) => pct0(o.categoryAverages[k])]),
              ].map(([key, tip, f]) => (
                <tr key={key}>
                  <td data-tip={tip ? t(tip) : undefined}>{t(key)}</td>
                  <td className="mono r">{f(orcidAll)}</td>
                  <td className="mono r">{orcidStaff ? f(orcidStaff) : t("app.na")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <Radar label={t("radar.views.label")}
            axes={CATS.map((k) => ({ key: k, label: t(`cat.${k}`) }))}
            series={[
              { label: t("view.all"), color: "var(--f-F)", values: orcidAll.categoryAverages },
              ...(orcidStaff ? [{ label: t("view.staff"), color: "var(--f-R)", values: orcidStaff.categoryAverages }] : []),
            ]} />
          <p className="muted note">{t("radar.views.note")}</p>
        </div>
        </div>
      ) : (
        <p className="muted">{t(orcidAll === undefined ? "app.loading" : "ov.orcid.pending")}</p>
      )}
    </div>
  );
}
