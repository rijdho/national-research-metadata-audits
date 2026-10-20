# National research metadata audits

How complete is the metadata that a country's research system puts into the open infrastructure?
For each country, this project covers every repository that the country's DataCite members
register (and measures those with DOIs), and every ORCID profile whose public affiliation to one of
the country's education and research organisations in ROR carries that organisation's ROR id, and shows the result as a dashboard. Austria and the Netherlands are covered.

🔗 **Live:** https://rijdho.github.io/national-research-metadata-audits/

Available in **English**. The texts sit in one catalogue (`web/src/i18n/en.js`), so a translation is one more file.

Part of the [Metaudits](https://rijdho.github.io/metaudits-home/) family.

## What it measures

- **Repositories.** Every repository registered at DataCite by a member organisation based in the
  country. Completeness is the share of 12 DataCite metadata fields that are filled, counted over
  **all** DOIs of each repository, not a sample. Two FAIR scores: the first 10 DOIs that the DataCite
  API lists for each repository (not a random sample) checked against 14 FAIR criteria, the same set
  as [FAIR Metadata Check](https://rijdho.github.io/fair-repo-audit/); and FAIR read from the fields
  the repository fills in across all its DOIs. Seven of the 14 criteria are met by every repository,
  because DataCite provides them for any record, so the first score starts high. Each repository
  carries the software platform it runs on, where it could be identified.
- **Researchers.** Every organisation of the country that [ROR](https://ror.org) types as education or
  facility (plus, in the Netherlands, the seven university medical centres, which ROR types as
  healthcare), and every ORCID profile whose public affiliation to one of them carries its ROR id. Institution types are
  ROR's own: its education type does not separate universities from universities of applied
  sciences, and it also covers research schools, academies and secondary schools. Completeness is
  a weighted score of 12 checks in 6 categories: identity, employment, education, works, funding and
  peer review. The search does not decide the employment checks (a profile found through an
  employment at the institution already has that employment, with its ROR id, so "has an
  employment" would say nothing), but the link classes below partly do: a profile linked through a
  dated employment passes the start-date check, and nearly all profiles found through their
  education pass the education check. The site says so where the checks are shown.

A profile affiliated with several institutions is counted under each. The site gives the number of
distinct profiles, and counts profile-institution pairs in the institution figures and averages.

ORCID finds a profile through an affiliation of any kind that carries the institution's ROR id, so
the counts include former staff and graduates. Affiliations that name the institution without its
ROR id (by name only, or with another identifier such as Ringgold) are not found; few entries added
before 2022 carry one, so people whose affiliation was added earlier are under-counted. Each figure therefore exists in two views: **all affiliated profiles**, and **current
staff**, the profiles whose employment at the institution is ongoing (see `link_*` below).

## Data

The aggregated results are in [`data/`](data/), one folder per country, under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The dashboard also offers them for download
(the **Data** tab of each country).

### `institutions.csv`

One row per institution and view.

| Column | Meaning |
|---|---|
| `id`, `name`, `ror` | the institution and its ROR id |
| `type` | the type ROR gives the institution: `education`, `facility` or `healthcare` (only the Dutch university medical centres, added one by one) |
| `view` | `all`: every affiliated profile; `staff`: current staff only |
| `profiles` | ORCID profiles counted in this view |
| `completeness` | mean profile completeness, 0 to 1 |
| `empty_share` | share of profiles that list no works |
| `rich_share` | share of profiles with at least five works, an education entry and a funding entry |
| `self_added_works_share` | share of the profiles' works that the researchers added themselves rather than a connected service |
| `suppressed` | `true` when the figures are left empty: the institution has fewer than 5 profiles in this view, or showing them would let a group of fewer than 5 be worked out by subtraction (see below) |
| `category_*` | mean score of each of the six categories, 0 to 1. `employment` has two checks: an employment with a start date, and every other employment entry identified by a ROR id (only for profiles that have other entries) |
| `link_*` | profiles by their strongest link to the institution (the same in both views) |

The `link_*` columns, strongest first. Current staff is the first two.

| Column | The profile's strongest affiliation with the institution |
|---|---|
| `link_current` | employment with a start date and no end date, or an end on or after the day the data were collected |
| `link_undated_recent` | employment without dates, added to ORCID in the year the data were collected or the two before |
| `link_undated_old` | employment without dates, added earlier |
| `link_past` | employment that ended before the data were collected (ORCID gives the end as year, month and day; an end in the year of collection without a month counts as past) |
| `link_education` | education or qualification only |
| `link_other` | invited position, distinction, membership or service only |
| `link_none` | no public affiliation with the institution's ROR id |

### `repositories.csv`

One row per repository.

| Column | Meaning |
|---|---|
| `id`, `name` | the DataCite repository (client) id and name |
| `provider_id`, `provider_name`, `ror` | the DataCite member that registers it, and the member's ROR id |
| `software` | the repository platform, where identified |
| `status` | whether the homepage responded when checked: `alive`, `protected` (refused the automated request, for instance with a bot check), `dead`, `no-url` |
| `dois` | DOIs registered, counted at the same time as the fields |
| `completeness` | share of the 12 fields filled, over all DOIs, 0 to 1 |
| `field_*` | share of the DOIs that fill each of the 12 fields |
| `fair_findable` | share of DOIs with a title, a description and subjects (mean of the three), 0 to 1 |
| `fair_accessible` | 1 if the homepage answered (`alive` or `protected`), else 0 |
| `fair_interoperable` | related identifiers, alternate identifiers, container (mean of the three), 0 to 1 |
| `fair_reusable` | creators, creator ORCID iD, contributors, funding, version, geolocations (mean of the six), 0 to 1 |
| `fair_sampled_overall` | score of the first 10 DOIs on the 14 FAIR criteria, 0 to 100 |
| `fair_sampled_F` … `fair_sampled_R` | the same by principle: share of its criteria met, 0 to 1 |
| `fair_requested_dois` | DOIs DataCite returned for the check: the first 10, or fewer when the repository has fewer |
| `fair_sampled_dois` | of those, the DOIs the assessment could read and score |

### JSON files

The files the dashboard reads, with the same figures: national and per-type figures
(`orcid-overview*.json`), institutions (`orcid-institutions*.json`), the 12 checks per type
(`orcid-fields*.json`), profiles by year of creation (`orcid-timeline*.json`), each with a `-staff`
twin for the current-staff view; and repositories (`repos.json`), the national repository figures
(`repos-overview.json`), platforms (`repos-software.json`) and member organisations
(`repos-institutions.json`).

`orcid-overview*.json` also holds `employmentIds`: employment entries by the registry that
identifies the organisation (`ROR`, `RINGGOLD`, `GRID`, `FUNDREF`, `LEI`, `NONE` = name only),
split into `here` (naming the institution by its ROR id, which is how ORCID's search found the
profile) and `elsewhere` (every other entry), with `byYear` giving the `elsewhere` entries by the year
they were added to ORCID. It also holds `uniqueProfiles` (distinct profiles) and `byLink` (completeness
by link class).

### What is not published

Data on individual ORCID profiles. Institutions with fewer than 5 profiles are listed without
figures, so that no person's profile can be read from them; their profiles are included in the
national and per-type figures. Two more rules keep a small group from being worked out by
subtraction: the current-staff figures of an institution are left empty when 1 to 4 of its profiles
are outside current staff, and when the hidden institutions of a type hold 1 to 4 profiles, the
smallest shown institutions of that type are hidden too. To request profile-level data for research, contact the author through
[rijdho.github.io](https://rijdho.github.io).

## How it is updated

Data collection and scoring run on the maintainer's computer and are not part of this repository. Their
output passes through [`scripts/export.mjs`](scripts/export.mjs), which publishes only the fields it
names, blanks small institutions and writes the CSV tables. `npm test` checks that nothing else is
published (`tests/privacy.test.mjs`) and that the published files agree with each other and the
texts carry no figure of their own (`tests/claims.test.mjs`). [`NUMBERS.md`](NUMBERS.md) lists the
national figures the site shows; it is regenerated before each update, so its git history shows what changed.
GitHub Pages rebuilds the site from `data/` on every push to `main`.

```bash
npm run export      # maintainer only: needs the private pipeline output
npm run numbers     # NUMBERS.md: the national figures the site shows
npm test            # allowed fields, no small groups, no private files, figures consistent
cd web && npm ci && npm test && npm run dev
```

## Sources

[DataCite](https://datacite.org) (members, repositories, DOI metadata),
[re3data](https://www.re3data.org) and the repositories' own pages (software platforms),
[ROR](https://ror.org) (research institutions) and the [ORCID Public API](https://info.orcid.org/documentation/features/public-api/)
(researcher profiles).

## License

Code under the [MIT License](LICENSE); the data in `data/` and the texts under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Inter (the font) under the SIL Open Font
License 1.1. See [`NOTICE`](NOTICE).
