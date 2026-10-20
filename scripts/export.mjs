// Publish the aggregated results of the private pipelines.
//
// The pipelines run on the maintainer's computer and write their output to _private/<country>/out/.
// This script is the only way anything reaches data/<country>/, the published dataset: it copies
// the fields named in SCHEMA below and nothing else. A field the pipelines add later is left out
// (and listed) until it is named here; a value of the wrong type stops the export.
// It then writes two CSV tables per country for analysis.
//
// Usage: node scripts/export.mjs            (both countries)
//        node scripts/export.mjs austria
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const COUNTRIES = ["austria", "netherlands"];

// ── What may be published ──────────────────────────────────────────────────────
// Leaves: "num", "str", "num?" / "str?" (may be null), "strs" (array of strings).
// { key: spec } names the keys allowed; { "*": spec } is a map with any keys; [spec] an array.
const FIELDS12 = { "*": "num" };
const CATS = { "*": "num" };
const LINKS = { "*": "num" };
// Employment entries by the registry that identifies their organisation (ROR, RINGGOLD, GRID,
// FUNDREF, LEI, NONE = name only), at the institution itself and elsewhere; those elsewhere
// also by the year the entry was added to ORCID.
const IDS = { here: { "*": "num" }, elsewhere: { "*": "num" }, byYear: { "*": { "*": "num" } } };
const ORCID_OVERVIEW = {
  generatedAt: "str", fetchedFrom: "str", fetchedTo: "str", view: "str", totalInstitutions: "num", totalProfiles: "num", uniqueProfiles: "num",
  avgOverall: "num", avgEmpty: "num", avgRich: "num", avgSelfAdded: "num",
  fieldAverages: FIELDS12, categoryAverages: CATS, linkCounts: LINKS, undatedRecentSince: "num",
  employmentIds: IDS,
  byLink: { "*": { profiles: "num", avgOverall: "num" } },
  byType: { "*": { label: "str", color: "str", count: "num", totalProfiles: "num", avgOverall: "num",
    avgEmpty: "num", avgRich: "num", categoryAverages: CATS, linkCounts: LINKS, employmentIds: IDS } },
};
const ORCID_INSTITUTIONS = [{
  id: "str", name: "str", ror: "str", type: "str", totalProfiles: "num", avgOverall: "num",
  emptyProfilesPct: "num", richProfilesPct: "num", selfAddedPct: "num", categoryAverages: CATS, linkCounts: LINKS,
}];
const ORCID_FIELDS = { "*": { "*": "num" } };
const TIMELINE = { "*": "num" };

export const SCHEMA = {
  "orcid-overview.json": ORCID_OVERVIEW,
  "orcid-overview-staff.json": ORCID_OVERVIEW,
  "orcid-institutions.json": ORCID_INSTITUTIONS,
  "orcid-institutions-staff.json": ORCID_INSTITUTIONS,
  "orcid-fields.json": ORCID_FIELDS,
  "orcid-fields-staff.json": ORCID_FIELDS,
  "orcid-timeline.json": TIMELINE,
  "orcid-timeline-staff.json": TIMELINE,
  "repos-overview.json": {
    generatedAt: "str",
    // When each part was read: repository list, homepage checks, DOI field counts, FAIR samples.
    dates: { listed: "str", checked: "str", counted: "str", fair: "str" },
    totals: { "*": "num" },
    largest: { name: "str", dois: "num" },
    avgCompleteness: "num", doiWeightedCompleteness: "num",
    fieldAverages: FIELDS12, useCaseAverages: { "*": "num" }, fairAverages: { "*": "num" },
    fairLive: { repos: "num", overallPercent: "num", F: "num", A: "num", I: "num", R: "num",
      checks: { "*": "num" }, metByAll: "num" },
    softwareBreakdown: [{ id: "str", count: "num" }],
  },
  "repos-institutions.json": [{
    id: "str", name: "str", rorId: "str?", memberType: "str?", repoCount: "num", dois: "num",
    avgCompleteness: "num?", software: "strs",
  }],
  // Platform label only: how a platform was identified (softwareSource) and its internal class stay private.
  "repos-software.json": [{ id: "str", repos: "num", dois: "num", meanCompleteness: "num?", byField: FIELDS12 }],
  "repos.json": [{
    id: "str", name: "str", providerId: "str", providerName: "str", rorId: "str?", memberType: "str?",
    url: "str?", clientType: "str?", repositoryType: "strs", software: "str?", status: "str",
    doiCount: "num?", completeness: "num?", byUseCase: { "*": "num" }, byField: FIELDS12,
    fair: { "*": "num" },
    fairLive: { overallPercent: "num", fair: { F: "num", A: "num", I: "num", R: "num" }, requested: "num", sampled: "num",
      checks: { "*": "num" } },
  }],
};

// ── Copy by schema ─────────────────────────────────────────────────────────────
export function pick(value, spec, path, dropped) {
  if (typeof spec === "string") {
    const optional = spec.endsWith("?");
    const kind = spec.replace("?", "");
    if (value == null) {
      if (optional) return null;
      throw new Error(`${path}: missing (${spec})`);
    }
    if (kind === "num" && typeof value === "number" && Number.isFinite(value)) return value;
    if (kind === "str" && typeof value === "string") return value;
    if (kind === "strs" && Array.isArray(value) && value.every((v) => typeof v === "string")) return value;
    throw new Error(`${path}: expected ${spec}, got ${JSON.stringify(value).slice(0, 60)}`);
  }
  if (Array.isArray(spec)) {
    if (!Array.isArray(value)) throw new Error(`${path}: expected an array`);
    return value.map((v, i) => pick(v, spec[0], `${path}[${i}]`, dropped));
  }
  if (value == null) return null; // an optional nested object (a repository with no FAIR sample)
  if (typeof value !== "object" || Array.isArray(value)) throw new Error(`${path}: expected an object`);
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    const s = spec[k] ?? spec["*"];
    if (s === undefined) { dropped.add(`${path.replace(/\[\d+\]/g, "[]")}.${k}`); continue; }
    out[k] = pick(v, s, `${path}.${k}`, dropped);
  }
  for (const k of Object.keys(spec)) {
    if (k !== "*" && !(k in value) && !String(spec[k]).endsWith("?")) throw new Error(`${path}.${k}: missing`);
  }
  return out;
}

// ── Small institutions ─────────────────────────────────────────────────────────
// With fewer than MIN_PROFILES profiles, an institution's averages and link counts would describe
// identifiable people, so they are blanked and the row is marked suppressed. Its profiles still
// count in the national and per-type figures, which the pipelines compute before this step.
// Two further rules close the ways a hidden group could be worked out by subtraction (found in a
// review on 2026-10-19):
//   - between views: when an institution's profiles outside current staff are 1 to 4, the staff
//     row is blanked, since all x n_all - staff x n_staff would give their average;
//   - within a type: when the blanked rows of a type hold 1 to 4 profiles, the smallest shown rows
//     of that type are blanked too, since the per-type figure minus the shown rows would give them.
export const MIN_PROFILES = 5;
const SMALL = ["avgOverall", "emptyProfilesPct", "richProfilesPct", "selfAddedPct", "categoryAverages", "linkCounts"];
const blank = (r) => ({ ...r, ...Object.fromEntries(SMALL.map((k) => [k, null])), suppressed: true });

function complementByType(rows) {
  const out = rows.map((r) => ({ ...r }));
  for (const type of new Set(out.map((r) => r.type))) {
    const group = out.filter((r) => r.type === type);
    for (;;) {
      const hidden = group.filter((r) => r.suppressed).reduce((a, r) => a + r.totalProfiles, 0);
      if (hidden === 0 || hidden >= MIN_PROFILES) break;
      const shown = group.filter((r) => !r.suppressed).sort((a, b) => a.totalProfiles - b.totalProfiles);
      if (!shown.length) break;
      Object.assign(shown[0], blank(shown[0]));
    }
  }
  return out;
}

export function suppressSmall(all, staff) {
  const a = complementByType(all.map((r) => (r.totalProfiles >= MIN_PROFILES ? { ...r, suppressed: false } : blank(r))));
  const allById = new Map(a.map((r) => [r.id, r]));
  const s = staff.map((r) => {
    const other = (allById.get(r.id)?.totalProfiles ?? 0) - r.totalProfiles;
    const hide = r.totalProfiles < MIN_PROFILES || allById.get(r.id)?.suppressed || (other > 0 && other < MIN_PROFILES);
    return hide ? blank(r) : { ...r, suppressed: false };
  });
  return [a, complementByType(s)];
}

// ── CSV ────────────────────────────────────────────────────────────────────────
const cell = (v) => {
  if (v == null) return "";
  const s = typeof v === "number" ? String(Math.round(v * 1e6) / 1e6) : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (header, rows) => [header, ...rows].map((r) => r.map(cell).join(",")).join("\n") + "\n";

function institutionsCsv(all, staff) {
  const full = all.find((r) => !r.suppressed);
  const cats = Object.keys(full.categoryAverages);
  const links = Object.keys(full.linkCounts);
  const header = ["id", "name", "ror", "type", "view", "profiles", "completeness", "empty_share", "rich_share",
    "self_added_works_share", "suppressed", ...cats.map((c) => `category_${c}`), ...links.map((l) => `link_${l.replace("-", "_")}`)];
  const row = (r, view) => [r.id, r.name, r.ror, r.type, view, r.totalProfiles, r.avgOverall, r.emptyProfilesPct,
    r.richProfilesPct, r.selfAddedPct, r.suppressed, ...cats.map((c) => r.categoryAverages?.[c]), ...links.map((l) => r.linkCounts?.[l])];
  return csv(header, [...all.map((r) => row(r, "all")), ...staff.map((r) => row(r, "staff"))]);
}

function repositoriesCsv(repos) {
  const fields = Object.keys(repos.find((r) => r.byField).byField);
  const header = ["id", "name", "provider_id", "provider_name", "ror", "software", "status", "dois", "completeness",
    ...fields.map((f) => `field_${f}`), "fair_findable", "fair_accessible", "fair_interoperable", "fair_reusable",
    "fair_sampled_overall", "fair_sampled_F", "fair_sampled_A", "fair_sampled_I", "fair_sampled_R", "fair_requested_dois", "fair_sampled_dois"];
  return csv(header, repos.map((r) => [r.id, r.name, r.providerId, r.providerName, r.rorId, r.software, r.status,
    r.doiCount, r.completeness, ...fields.map((f) => r.byField?.[f]), r.fair?.Findable, r.fair?.Accessible,
    r.fair?.Interoperable, r.fair?.Reusable, r.fairLive?.overallPercent, r.fairLive?.fair.F, r.fairLive?.fair.A,
    r.fairLive?.fair.I, r.fairLive?.fair.R, r.fairLive?.requested, r.fairLive?.sampled]));
}

// ── Run ────────────────────────────────────────────────────────────────────────
function exportCountry(country) {
  const src = join(ROOT, "_private", country, "out");
  const dst = join(ROOT, "data", country);
  if (!existsSync(src)) throw new Error(`${src} not found: run the private pipelines first`);
  mkdirSync(dst, { recursive: true });
  const dropped = new Set();
  const out = {};
  for (const [file, spec] of Object.entries(SCHEMA)) {
    out[file] = pick(JSON.parse(readFileSync(join(src, file), "utf8")), spec, file, dropped);
  }
  [out["orcid-institutions.json"], out["orcid-institutions-staff.json"]] =
    suppressSmall(out["orcid-institutions.json"], out["orcid-institutions-staff.json"]);
  for (const file of Object.keys(SCHEMA)) writeFileSync(join(dst, file), JSON.stringify(out[file], null, 2) + "\n");
  writeFileSync(join(dst, "institutions.csv"),
    institutionsCsv(out["orcid-institutions.json"], out["orcid-institutions-staff.json"]));
  writeFileSync(join(dst, "repositories.csv"), repositoriesCsv(out["repos.json"]));
  console.log(`${country}: ${Object.keys(SCHEMA).length} JSON files and 2 CSV tables written to data/${country}/`);
  if (dropped.size) console.log(`  left out (not in SCHEMA): ${[...dropped].sort().join(", ")}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const c of process.argv[2] ? [process.argv[2]] : COUNTRIES) exportCountry(c);
}
