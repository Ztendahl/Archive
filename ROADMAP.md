0) Scope & Goals

Goal: A private, cross-platform family-tree app with an archive for attaching scans, photos, books, and heirlooms to people and events. Works offline, exports/imports cleanly, and scales to a few thousand records.

Non-goals (V1): Public collaboration, cloud sync, OCR, AI features, and full GEDCOM round-trip.

1) Current Baseline (foundation locked)

Web bundling: Expo 54 using webpack for web. sql.js is loaded via a webpack-emitted WASM asset (no binaries in repo).

DB: SQLite across platforms; web uses sql.js, RN/Node use native/sqlite adapters.

Migrations: Baseline migration exists for core entities (people, parent_child, unions, files, media, entity_media, heirlooms, sources, citations).

File storage: Adapter interface defined (content-addressed by hash; dedupe).

Validation: Person create/update requires at least one name; timestamps managed on write.

Tests: Vitest unit tests; Playwright E2E (isolate from Vitest globals).

2) Phase 0 — Foundations to Finish (Do Now)

 Web SQLite WASM handling: keep using webpack-emitted asset; no committed binaries.

 Migrations fidelity: table and index names match repository expectations; no DDL in runtime initializers.

 FileStore adapters: decide per platform storage targets (Web: OPFS preferred; RN: app docs dir; Node: configurable root).

 Validation guards: enforce “at least one name” and trim empty → null; capture created_at/updated_at.

 Test runners isolation: Vitest globals not injected into Playwright; E2E in tests/e2e.

 CI pipeline: build with webpack, serve dist, run Playwright; cache node_modules.

Exit criteria: typecheck, unit tests, and E2E green locally and in CI.

3) Core Domain Model & Invariants
Entities

People — names, partial dates, notes, tags, timestamps.

Parent–Child Links — role per link: bio | adoptive | step | guardian | foster, optional start/end, certainty.

Unions — partnerships/marriages linking exactly two people; dates, notes.

Files — content-addressed by hash; size, mime, original name, uri (platform path/handle).

Media — semantic wrapper around a file: kind, caption, taken_at.

Entity–Media — attach media to any entity (person/union/heirloom/source) with optional role.

Heirlooms — name, description, provenance, location, current keeper (person), timestamps.

Sources & Citations — bibliographic description; citations attach to any entity with locator and optional quote.

Invariants

IDs are stable (UUIDs).

A child has ≤ 2 bio parents. No graph cycles.

A person cannot be both bio and adoptive parent of the same child.

step is time-bound and typically derived from unions (see §6).

Files are deduplicated by hash; the same file may be attached multiple times.

Deleting an entity does not leave dangling attachments or links (cascade or detach by policy).

4) V1 — Must-Have Features
4.1 People Management (CRUD + Search)

Create/edit person (names, partial dates, notes, tags).

Search by last name/tag/text; list view with sort.

Person detail shows parents, children, unions, media, sources.

Acceptance: Can create “Anna Stendahl,” link relations, search and find her, and see attached media.

4.2 Relationship Editor

Add/remove parent–child links with role, dates, certainty.

Add/remove unions.

Quick actions on person detail: “Add parent,” “Add child,” “Add partner.”

Acceptance: All three relationship types editable from person detail; invalid actions blocked with clear messages.

4.3 Tree Visualization

Pan/zoom canvas; expand/collapse generations.

Select a person node to open detail sidebar.

Layout: parents above, children below; multiple partners shown horizontally.

Acceptance: With ~200 people, tree remains responsive; selection opens detail instantly.

4.4 Archive Intake → Media → Attachment

Import files (drag-drop on web; picker on mobile/desktop).

Hash + store once; create media record (kind, caption, taken_at).

Attach media to entities with optional role (e.g., portrait, birth-record).

Gallery on person/heirloom detail with open/original.

Acceptance: Dropping the same file twice does not duplicate storage; a scan can be attached to multiple people; portraits visible on cards.

4.5 Heirlooms (Light)

CRUD heirlooms with description, provenance, location, current keeper.

Attach media; compact gallery.

Acceptance: “Grandfather’s watch” exists, linked to current keeper, with photo and story.

4.6 Sources & Citations (Light)

Create source with bibliographic fields.

Cite sources on any entity with locator and optional quote.

“Evidence” tab lists citations.

Acceptance: Can cite a church book on a birth event and see it on the person’s Evidence tab.

4.7 Data Entry Quality

Partial/unknown dates accepted (e.g., “1880s”, “1880-05”, “bef 1900”, “circa”).

At least one name required; trimming/normalizing applied.

Duplicate person hint on create (same full name ± birth year).

Acceptance: Empty names rejected; potential duplicates surfaced as a non-blocking hint.

4.8 Backup / Export / Import

Export ZIP: DB + media directory (or JSON + files).

Import is additive with ID stability and file dedupe by hash.

Acceptance: Export on machine A, import on machine B → identical data, no duplicate files.

4.9 Tests (Behavioral)

Unit: repo methods (people CRUD, links with roles, media attach/dedupe).

Integration: create person → add parent → attach media → reload and verify.

E2E: start app, build a small family, attach a file, reload and verify persistence.

Acceptance: All layers cover the above flows with real migrations.

5) V1.1 — Nice-to-Have

Merge wizard for duplicate people (field-by-field keep/replace/concat; relationships and attachments merged).

Undo/redo (bounded local history).

Place normalization for Swedish records (parish/härad/län/country) while storing free-text.

Timeline view per person (events, unions, media “taken_at,” citations).

Minimal GEDCOM export (INDI, FAM, SOUR), one-way.

6) Extended Family: Step/Adoptive/Guardian/Foster & Siblings
6.1 Parent–Child Link Roles

Role per link: bio | adoptive | step | guardian | foster.

Max two bio parents per child; unlimited others.

Each link: start/end, notes, certainty (proven | likely | uncertain).

Contradictions blocked (e.g., same person both bio and adoptive for the child).

Acceptance: Can record adoptive/step/guardian/foster with dates and certainty; third bio is rejected.

6.2 Step-Parent Definition

Primary approach: derived from unions. A step-parent is a partner of a child’s bio or adoptive parent with overlapping dates, where the partner is not already a bio/adoptive parent of the child.

Optional: support explicit step links for edge cases; derivation rules stay authoritative in UI.

Acceptance: Adding a partner to a biological parent shows that partner as step-parent during the overlap.

6.3 Sibling Classification (Derived)

Full siblings: share two bio or two adoptive parents.

Half siblings: share exactly one bio or adoptive parent.

Step-siblings: share no bio/adoptive parents; there exists a union between one parent of A and one parent of B with overlapping dates.

Optional peers: foster/guardian overlap.

Acceptance: Person detail lists siblings grouped and labeled Full/Half/Step with an explanatory reason on hover/tap.

6.4 Editing Flows

“Add parent” form includes Role, Start/End, Certainty; default role = bio.

Quick action to change role on an existing link with audit note.

When adding a partner to a parent, optional prompt: “Mark as step-parent of X?”

Blocking rule: cannot exceed two bio parents.

Acceptance: Switching roles (e.g., bio→adoptive) updates UI and relationships without re-entry; constraints enforced inline.

6.5 Display Rules

Grouping: on person page, show parent groups — Biological (max 2), Adoptive, Step (with active range), Guardian/Foster (with ranges).

Tree edges: visually differentiate by role (legend toggle).

Siblings tab: sections for Full, Half, Step (and optional foster/guardian peers) with reason text.

Acceptance: Roles and time ranges are visible at a glance; sibling categories explain why they apply.

6.6 Data Quality & Conflicts

Duplicate-parent guard for bio.

Non-blocking contradiction warnings (e.g., implausible bio given dates/unions).

Certainty policy: choose whether uncertain counts toward sibling derivation; document and apply consistently.

Acceptance: Inconsistent entries yield clear warnings; sibling classification adheres to the chosen certainty policy.

6.7 Search & Filters

Person search filters for presence of step/adoptive/guardian/foster roles; sibling category filters.

Tree filter to hide non-biological edges.

Acceptance: Can find “people with step-parents” and toggle non-biological links in the tree.

6.8 Backup / Interchange

Export preserves role, date ranges, certainty on parent–child links.

GEDCOM mapping later: PEDI and family units for step; documented now, implemented in V2.

Acceptance: Round-trip keeps roles and intervals intact.

6.9 Tests

Attempting a third bio parent is rejected with a clear message.

Partner added to bio parent yields step-parent status during the overlap.

Sibling categories reflect derived logic across edge cases.

Role changes update classification and UI groupings.

Acceptance: All scenarios pass.

7) UX & Navigation (Minimum surface)

People List (search, sort) → Person Detail with tabs: Summary, Relations, Media, Evidence.

Tree View with node selection opening a side panel for the selected person.

Global Archive Browser with filters by type, entity link, year.

Add menu: Parent, Child, Partner, Media, Heirloom, Source.

Settings: Backup/Export/Import; optional performance toggles.

8) Data Quality Decisions

Partial dates: choose a single internal representation and stick to it (e.g., ISO-like strings with qualifiers such as YYYY, YYYY-MM, ~YYYY, <=YYYY).

Place fields: store free-text plus optional normalized components (parish/härad/län/country) for Swedish records.

Name normalization: trim; empty → null; diacritics preserved.

9) Performance & Scale Targets

Target dataset: 5k people, 20k media on mid-range devices.

Indexes: (last_name, first_name), birth_date; media by file_id; entity_media composite keys.

Web: durable writes trigger persist; multi-tab: shallow requery or version clock refresh.

Node/RN: WAL (where supported); reasonable synchronous level for durability.

Acceptance: List and detail operations remain responsive under target; tree remains interactive at ~200 nodes visible.

10) Backup & Import/Export

Export ZIP with DB and file tree (or JSON + files).

Import: additive; preserves IDs; dedupes files by hash; reports conflicts (IDs present, different payload).

Report: summary of created/updated/skipped entities and files.

Acceptance: Export/import between two machines yields identical, de-duplicated data.

11) Security & Privacy (Later)

Local encryption at rest (password-based for web/desktop; device keystore for mobile).

Redaction/export filters (exclude private notes/media).

Optional passphrase-locked backup file.

12) Open Policies to Decide (before V1 freeze)

Deletion: hard delete vs soft delete for people/unions; how attachments are handled (cascade vs detach).

Parent count: enforce max two bio parents; allow unlimited adoptive/guardian/step.

Certainty & sibling derivation: whether uncertain counts toward sibling categories.

File storage roots: confirm per platform paths/quotas (Web OPFS limits, RN app dir).

Merge semantics: default field conflict resolution (keep/replace/concat) and audit notes.

13) Milestones & Checklists
M0 — Foundations

 Webpack build emits sql.js WASM; no binary in repo.

 Migrations match repository fields and indexes.

 FileStore adapter targets decided per platform.

 Validation guards in place.

 Tests isolated; CI green.

M1 — People, Relations, Tree (Basic)

 People CRUD + search.

 Parent/child editor with roles; unions.

 Tree view (pan/zoom; select → detail).

M2 — Archive & Attachments

 File intake; media creation; entity attachments.

 Person and heirloom galleries.

M3 — Evidence & Heirlooms

 Sources + citations; Evidence tab.

 Heirlooms CRUD + media.

M4 — Extended Family Roles

 Step/adoptive/guardian/foster roles with dates and certainty.

 Derived sibling classification; UI groupings.

M5 — Backup/Import

 Export ZIP; Import additive; dedupe by hash.

 Report and verification.

14) Success Criteria (V1)

End-to-end flow: create a small family, add parents/partner, attach scans, cite a source, visualize in tree, export and re-import on another device—all without manual fixes.

Data remains consistent under enforced invariants and role rules.

Performance remains acceptable for target sizes.
