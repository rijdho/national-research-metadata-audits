// The figures on the site are computed from data/<country>/*.json when the page is shown, so no
// figure is typed into the text. What can still go wrong is that the files disagree with each
// other, or that a text carries a number of its own. These checks fail before a push could
// publish either.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const COUNTRIES = readdirSync(join(ROOT, "data"));
const read = (c, f) => JSON.parse(readFileSync(join(ROOT, "data", c, f), "utf8"));
const sum = (a) => a.reduce((x, y) => x + y, 0);
const total = (m) => sum(Object.values(m || {}));

for (const c of COUNTRIES) {
  const all = read(c, "orcid-overview.json");
  const staff = read(c, "orcid-overview-staff.json");
  const insts = read(c, "orcid-institutions.json");
  const instsStaff = read(c, "orcid-institutions-staff.json");
  const repoOv = read(c, "repos-overview.json");
  const repos = read(c, "repos.json");

  test(`${c}: every profile-institution pair is in exactly one link class, type and institution`, () => {
    assert.equal(total(all.linkCounts), all.totalProfiles);
    assert.equal(sum(Object.values(all.byType).map((t) => t.totalProfiles)), all.totalProfiles);
    assert.equal(sum(insts.map((r) => r.totalProfiles)), all.totalProfiles);
    assert.equal(sum(Object.values(all.byType).map((t) => t.count)), all.totalInstitutions);
    for (const [k, v] of Object.entries(all.byLink)) assert.equal(v.profiles, all.linkCounts[k], k);
  });

  test(`${c}: current staff is "employed there now" plus "no dates, added recently"`, () => {
    assert.equal(staff.totalProfiles, all.linkCounts.current + all.linkCounts["undated-recent"]);
    assert.equal(sum(instsStaff.map((r) => r.totalProfiles)), staff.totalProfiles);
  });

  test(`${c}: distinct profiles are no more than pairs, and staff no more than all`, () => {
    assert.ok(all.uniqueProfiles <= all.totalProfiles);
    assert.ok(staff.uniqueProfiles <= all.uniqueProfiles);
  });

  test(`${c}: employer identifiers by year add up to the totals`, () => {
    for (const ids of [all.employmentIds, staff.employmentIds]) {
      const byYear = {};
      for (const m of Object.values(ids.byYear)) for (const [k, v] of Object.entries(m)) byYear[k] = (byYear[k] || 0) + v;
      // An entry without a creation date has no year; there should be none or very few.
      for (const [k, v] of Object.entries(ids.elsewhere)) {
        assert.ok((byYear[k] || 0) <= v && (byYear[k] || 0) >= v * 0.999, `${k}: ${byYear[k]} of ${v}`);
      }
      assert.ok(total(ids.here) + total(ids.elsewhere) > 0);
    }
    for (const k of Object.keys(staff.employmentIds.elsewhere)) {
      assert.ok(staff.employmentIds.elsewhere[k] <= all.employmentIds.elsewhere[k], k);
    }
  });

  test(`${c}: repository totals match the repository list`, () => {
    const t = repoOv.totals;
    assert.equal(t.repositories, repos.length);
    assert.equal(t.totalDois, sum(repos.map((r) => r.doiCount || 0)));
    assert.equal(t.withDois, repos.filter((r) => r.doiCount > 0).length);
    assert.equal(t.alive + t.protected + t.dead + t.noUrl, t.repositories);
    assert.equal(t.measuredRepos, repos.filter((r) => r.completeness != null).length);
    assert.equal(repoOv.largest.dois, Math.max(...repos.map((r) => r.doiCount || 0)));
  });

  test(`${c}: every repository with DOIs is measured, and none without`, () => {
    for (const r of repos) assert.equal(r.completeness != null, r.doiCount > 0, r.id);
  });

  test(`${c}: FAIR records scored are no more than requested, and at most 10`, () => {
    for (const r of repos.filter((r) => r.fairLive)) {
      assert.ok(r.fairLive.sampled <= r.fairLive.requested && r.fairLive.requested <= 10, r.id);
    }
    assert.equal(repoOv.fairLive.repos, repos.filter((r) => r.fairLive).length);
  });

  test(`${c}: the definitions the texts state match the data`, () => {
    assert.equal(Object.keys(repoOv.fieldAverages).length, 12, "12 metadata fields");
    assert.equal(Object.keys(all.fieldAverages).length, 12, "12 checks");
    assert.equal(Object.keys(all.categoryAverages).length, 6, "6 categories");
    assert.equal(Object.keys(repoOv.fairLive.checks).length, 14, "14 FAIR criteria");
    assert.equal(all.undatedRecentSince, Math.max(...Object.keys(all.employmentIds.byYear).map(Number)) - 2,
      "recent = the harvest year and the two before");
  });
}

// Numbers a text may carry: definitions checked above or fixed by the code (the periods of the
// identifier table, the FAIR criterion codes, the 0/0.5/1 scale, the cited year, the CC BY 4.0 licence). Any other
// figure in a catalogue is typed by hand and fails here; it belongs in the data.
const ALLOWED = new Set(["0", "0.5", "0,5", "4.0", "1", "2", "3", "4", "5", "6", "7", "10", "12", "14", "60", "100",
  "2021", "2022", "2023", "2026"]);
test("no catalogue string carries a figure of its own", async () => {
  // Every catalogue present (English only since 2026-10-20; a translation added later is checked too).
  const langs = readdirSync(join(ROOT, "web", "src", "i18n")).filter((f) => /^[a-z]{2}\.js$/.test(f)).map((f) => f.slice(0, 2));
  assert.ok(langs.includes("en"));
  for (const lang of langs) {
    const { default: cat } = await import(join(ROOT, "web", "src", "i18n", `${lang}.js`));
    for (const [k, v] of Object.entries(cat)) {
      const text = String(v).replace(/\{[^}]*\}/g, "").replace(/https?:\/\/\S+/g, "").replace(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/g, "").replace(/\b[FAIR]\d(\.\d)?\b/g, "");
      for (const n of text.match(/\d+(?:[.,]\d+)?/g) || []) assert.ok(ALLOWED.has(n), `${lang} ${k}: ${n}`);
    }
  }
});
