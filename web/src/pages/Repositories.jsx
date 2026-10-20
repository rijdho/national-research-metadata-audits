import { useState } from "react";
import { useI18n } from "../i18n/index.jsx";
import { Bar, Note, Th, dcUrl, extUrl, useFormat } from "../lib.jsx";

export default function Repositories({ repoOv, repos, software }) {
  const { t, tr } = useI18n();
  const { pct, pct0, num } = useFormat();
  const [q, setQ] = useState("");
  if (repos === undefined) return <p className="muted">{t("app.loading")}</p>;
  if (!repos) return null;
  const needle = q.toLowerCase();
  const rows = repos.filter((r) => !q || (r.name || "").toLowerCase().includes(needle) || (r.providerName || "").toLowerCase().includes(needle));
  const label = (id) => (id === "(unidentified)" ? t("repos.unidentified") : id);
  return (
    <div>
      <h2>{t("repos.platforms.title")}</h2>
      <Note>{t("repos.platforms.note")}</Note>
      <div className="bar-rows">
        {(software || []).filter((s) => s.repos >= 1 && s.meanCompleteness != null).slice(0, 12).map((s) => (
          <Bar key={s.id} label={`${label(s.id)} (n=${s.repos})`} value={s.meanCompleteness} color="var(--color-accent)"
            tip={t("repos.platforms.tip", { name: label(s.id), n: s.repos, dois: num(s.dois), pct: pct(s.meanCompleteness) })} />
        ))}
      </div>
      {repoOv && (
        <>
          <h2>{t("repos.useCase.title")}</h2>
          <Note>{tr("repos.useCase.note")}</Note>
          <div className="bar-rows">
            {Object.entries(repoOv.useCaseAverages).map(([k, v]) => (
              <Bar key={k} label={t(`usecase.${k}`)} value={v} color="var(--color-accent)" tip={t(`usecase.${k}.def`)} />
            ))}
          </div>
        </>
      )}
      <h2>{t("repos.all.title", { n: repos.length })}</h2>
      <Note>{tr("repos.all.note")}</Note>
      <div className="filters">
        <input placeholder={t("repos.filter")} aria-label={t("repos.filter")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <Th>{t("th.repository")}</Th>
              <Th tip={t("th.institution.tip")}>{t("th.institution")}</Th>
              <Th tip={t("th.software.tip")}>{t("th.software")}</Th>
              <Th r>{t("th.dois")}</Th>
              <Th tip={t("th.status.tip")}>{t("th.status")}</Th>
              <Th r tip={t("th.complete.repo.tip")}>{t("th.complete")}</Th>
              <Th r tip={t("th.fair.tip")}>{t("th.fair")}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <a href={extUrl(r.url) || dcUrl(r.id)} target="_blank" rel="noreferrer">{r.name}</a>
                  {r.url && <a href={dcUrl(r.id)} target="_blank" rel="noreferrer" className="muted dc" data-tip={t("repos.dcTitle")}>↗DC</a>}
                </td>
                <td className="muted">{r.providerName}</td>
                <td>{r.software || <span className="muted">{t("app.na")}</span>}</td>
                <td className="mono r">{num(r.doiCount)}</td>
                <td><span className={`badge ${r.status === "alive" ? "hi" : r.status === "dead" ? "lo" : r.status === "protected" ? "mid" : ""}`}
                  data-tip={t(`status.${r.status}.tip`)}>{t(`status.${r.status}`)}</span></td>
                <td className="mono r">{pct0(r.completeness)}</td>
                <td className="mono r">{r.fairLive == null ? t("app.na") : pct0(r.fairLive.overallPercent / 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
