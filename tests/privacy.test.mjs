// What this repository publishes is the aggregated output of private pipelines. These checks fail
// before a push could publish anything else.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { SCHEMA, pick, MIN_PROFILES } from "../scripts/export.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const tracked = () => execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { cwd: ROOT, encoding: "utf8" })
  .split("\n").filter(Boolean);

test("nothing private is tracked or about to be", () => {
  const bad = tracked().filter((f) => /^(_private|_ref)\//.test(f) || f === "CLAUDE.md" || /records\.jsonl|profiles\.json$/.test(f));
  assert.deepEqual(bad, []);
});

test("the only scripts are the published ones", () => {
  const scripts = tracked().filter((f) => /\.(mjs|js|jsx|sh|py)$/.test(f) && !f.startsWith("web/"));
  assert.deepEqual(scripts.sort(), ["scripts/export.mjs", "scripts/numbers.mjs", "tests/claims.test.mjs", "tests/privacy.test.mjs"]);
});

test("published data holds only the fields the export allows", () => {
  for (const country of readdirSync(join(ROOT, "data"))) {
    for (const [file, spec] of Object.entries(SCHEMA)) {
      const value = JSON.parse(readFileSync(join(ROOT, "data", country, file), "utf8"));
      const dropped = new Set();
      // Suppressed institutions carry nulls and a flag the schema does not list; check the rest.
      const rows = file.startsWith("orcid-institutions") ? value.filter((r) => !r.suppressed).map(({ suppressed, ...r }) => r) : value;
      pick(rows, spec, file, dropped);
      assert.deepEqual([...dropped], [], `${country}/${file} has fields outside the schema`);
    }
  }
});

test(`no institution with fewer than ${MIN_PROFILES} profiles shows figures`, () => {
  for (const country of readdirSync(join(ROOT, "data"))) {
    for (const file of ["orcid-institutions.json", "orcid-institutions-staff.json"]) {
      const rows = JSON.parse(readFileSync(join(ROOT, "data", country, file), "utf8"));
      for (const r of rows.filter((r) => r.totalProfiles < MIN_PROFILES)) {
        assert.equal(r.suppressed, true, `${country}/${file} ${r.id}`);
        assert.equal(r.avgOverall, null, `${country}/${file} ${r.id}`);
        assert.equal(r.linkCounts, null, `${country}/${file} ${r.id}`);
      }
    }
  }
});

test("no hidden group of 1 to 4 profiles can be worked out by subtraction", () => {
  for (const country of readdirSync(join(ROOT, "data"))) {
    const read = (f) => JSON.parse(readFileSync(join(ROOT, "data", country, f), "utf8"));
    const all = read("orcid-institutions.json"), staff = read("orcid-institutions-staff.json");
    const allById = new Map(all.map((r) => [r.id, r]));
    for (const r of staff.filter((r) => !r.suppressed)) {
      const a = allById.get(r.id);
      assert.ok(a && !a.suppressed, `${country} ${r.id}: staff shown while all is hidden`);
      const other = a.totalProfiles - r.totalProfiles;
      assert.ok(other === 0 || other >= MIN_PROFILES, `${country} ${r.id}: ${other} profiles outside staff`);
    }
    for (const [view, rows] of [["all", all], ["staff", staff]]) {
      for (const type of new Set(rows.map((r) => r.type))) {
        const hidden = rows.filter((r) => r.type === type && r.suppressed).reduce((s, r) => s + r.totalProfiles, 0);
        assert.ok(hidden === 0 || hidden >= MIN_PROFILES, `${country} ${view} ${type}: ${hidden} hidden profiles`);
      }
    }
  }
});

test("no method detail in the site's code", () => {
  // Names of the software-detection signals stay private, also as leftover CSS classes.
  const files = tracked().filter((f) => f.startsWith("web/src/") && /\.(css|jsx?|html)$/.test(f) && !f.includes("/house/"));
  for (const f of files) {
    const s = readFileSync(join(ROOT, f), "utf8");
    assert.ok(!/inferred-siblings|host-map|html-detect|url-pattern|name-desc|oai-pmh|re3data-name|doi-sample|softwareSource/.test(s), f);
  }
});

test("no method detail in the published data", () => {
  for (const country of readdirSync(join(ROOT, "data"))) {
    for (const f of readdirSync(join(ROOT, "data", country))) {
      const s = readFileSync(join(ROOT, "data", country, f), "utf8");
      assert.ok(!/softwareSource|softwareClass|workers\.dev|fair-engine/.test(s), `${country}/${f}`);
    }
  }
});
