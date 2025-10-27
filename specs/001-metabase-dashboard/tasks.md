# Tasks: Sample Metabase Dashboard for Sales Metrics

**Input**: Design documents from `/specs/001-metabase-dashboard/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested; focus is on visual validation and SQL sanity checks outlined in quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish shared workspace and documentation scaffolding required by all stories.

- [X] T001 Scaffold feature asset directories in `data/seeds/sales_dashboard/`, `metabase/dashboards/sales-insights/`, and `docs/dashboards/`
- [X] T002 Draft UI-first design guidelines section header in `docs/dashboards/sales-insights.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create schema, seed script shells, and base dashboard layout needed by every story.

- [X] T003 Author PostgreSQL table definitions for orders, quotations, customers, and salespeople in `data/seeds/sales_dashboard/01_schema.sql` compatible with the connection target defined in `database.txt`
- [X] T004 Create scaffolded order seeding script with placeholder data blocks in `data/seeds/sales_dashboard/02_seed_sales_orders.sql`, referencing credentials from `database.txt`
- [X] T005 Create scaffolded quotation seeding script with placeholder data blocks in `data/seeds/sales_dashboard/03_seed_sales_quotations.sql`, referencing credentials from `database.txt`
- [X] T006 Outline validation query sections (daily metrics, pipeline, conversion) in `data/seeds/sales_dashboard/04_validation.sql` including instructions to execute using `database.txt`
- [X] T007 Build base Metabase dashboard layout shell with three empty categories in `metabase/dashboards/sales-insights/dashboard.json`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Review Daily Sales Health (Priority: P1) 🎯 MVP

**Goal**: Present prior-day order and revenue trends with responsive filters for the sales manager.

**Independent Test**: Using the dashboard alone, a sales manager identifies yesterday’s order count and revenue, plus trailing 7-day comparison, within 90 seconds.

### Tests for User Story 1

Tests not requested in the specification.

- ### Implementation for User Story 1

- [X] T008 [US1] Populate 90-day mock sales orders with realistic categories and metrics in `data/seeds/sales_dashboard/02_seed_sales_orders.sql`, loading data into the database defined by `database.txt`
- [X] T009 [P] [US1] Add daily order and revenue validation queries in `data/seeds/sales_dashboard/04_validation.sql` with run commands referencing `database.txt`
- [X] T010 [P] [US1] Create Metabase card bundle for daily KPIs and trend charts in `metabase/dashboards/sales-insights/daily-sales-health.json`
- [X] T011 [US1] Integrate daily sales cards into dashboard structure in `metabase/dashboards/sales-insights/dashboard.json`
- [X] T012 [P] [US1] Document daily sales interpretation guidance in `docs/dashboards/sales-insights.md`, noting reliance on the connection in `database.txt`

**Checkpoint**: User Story 1 is independently testable and forms the MVP.

---

## Phase 4: User Story 2 - Monitor Quotation Pipeline (Priority: P2)

**Goal**: Provide quotation volume and value by status so marketing can gauge pipeline health.

**Independent Test**: Marketing lead filters the quotation view to current month and states total open value plus top customer segments without additional tools.

### Tests for User Story 2

Tests not requested in the specification.

- ### Implementation for User Story 2

- [X] T013 [US2] Seed quotation records across statuses and segments in `data/seeds/sales_dashboard/03_seed_sales_quotations.sql` using the database connection in `database.txt`
- [X] T014 [P] [US2] Add quotation status validation queries in `data/seeds/sales_dashboard/04_validation.sql` with execution steps referencing `database.txt`
- [X] T015 [P] [US2] Create Metabase card bundle for pipeline status and segment breakdowns in `metabase/dashboards/sales-insights/quotation-pipeline.json`
- [X] T016 [US2] Integrate pipeline cards into dashboard layout in `metabase/dashboards/sales-insights/dashboard.json`
- [X] T017 [P] [US2] Extend documentation with pipeline insight guidance in `docs/dashboards/sales-insights.md`, including database usage notes from `database.txt`

**Checkpoint**: User Stories 1 & 2 operate independently with their own test criteria.

---

## Phase 5: User Story 3 - Track Quote-to-Order Conversion (Priority: P3)

**Goal**: Reveal conversion rates from quotation to order across product categories for leadership decisions.

**Independent Test**: Commercial director selects a product category and states conversion percentage and value using the dashboard alone.

### Tests for User Story 3

Tests not requested in the specification.

- ### Implementation for User Story 3

- [X] T018 [US3] Link orders to source quotations and extend category metrics in `data/seeds/sales_dashboard/02_seed_sales_orders.sql`, ensuring inserts target the database specified in `database.txt`
- [X] T019 [P] [US3] Add conversion rate validation queries in `data/seeds/sales_dashboard/04_validation.sql` with instructions to run against the `database.txt` connection
- [X] T020 [P] [US3] Create Metabase card bundle for quote-to-order conversion visuals in `metabase/dashboards/sales-insights/quote-to-order-conversion.json`
- [X] T021 [US3] Integrate conversion cards into dashboard layout in `metabase/dashboards/sales-insights/dashboard.json`
- [X] T022 [P] [US3] Expand documentation with conversion analysis tips in `docs/dashboards/sales-insights.md`, referencing the live connection in `database.txt`

**Checkpoint**: All three user stories are independently functional and validated.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize documentation and cross-story guidance for handoff.

- [X] T023 Update implementation steps and filter expectations in `specs/001-metabase-dashboard/quickstart.md` to emphasize using `database.txt`
- [X] T024 [P] Capture dataset overview and usage notes in `data/seeds/sales_dashboard/README.md`, documenting how to apply credentials from `database.txt`

---

## Dependencies & Execution Order

1. **Setup (Phase 1)** → 2. **Foundational (Phase 2)** → 3. **User Story 1 (Phase 3)** → 4. **User Story 2 (Phase 4)** → 5. **User Story 3 (Phase 5)** → 6. **Polish (Phase 6)**
2. User Story phases can begin only after Phase 2 completion; within each story, data seeding tasks precede validation, which precedes dashboard integration and documentation.
3. Polish phase runs after all target user stories are complete.

### User Story Dependency Graph

```
US1 (P1)
  ↓
US2 (P2)
  ↓
US3 (P3)
```

### Parallel Opportunities

- After T008, tasks T009, T010, and T012 can proceed in parallel (validation, card creation, documentation).
- After T013, tasks T014, T015, and T017 can proceed in parallel.
- After T018, tasks T019, T020, and T022 can proceed in parallel.
- Polish tasks T023 and T024 can run concurrently once all user stories close.

### Parallel Execution Examples

#### User Story 1
```bash
# In parallel after seeding orders (T008):
Run T009 (validation queries) and T010 (Metabase cards) simultaneously.
```

#### User Story 2
```bash
# In parallel after seeding quotations (T013):
Run T014 (validation queries) while crafting T015 (Metabase cards).
```

#### User Story 3
```bash
# In parallel after linking orders to quotations (T018):
Execute T019 (conversion validation) and T020 (conversion cards) concurrently.
```

---

## Implementation Strategy

### MVP First (User Story 1)
1. Complete Phases 1 and 2 to establish schema, scripts, and dashboard skeleton.
2. Deliver Phase 3 tasks to achieve a functioning daily sales health view.
3. Validate against SQL checks (T009) before continuing.

### Incremental Delivery
1. Ship MVP (US1) once validated.
2. Layer in User Story 2 for pipeline visibility, validate via T014 and dashboard review.
3. Add User Story 3 to complete conversion analytics, then run comprehensive validations.

### Parallel Team Strategy
- One contributor focuses on data seeding (T008, T013, T018) while teammates handle validation/documentation ([P] tasks) per story.
- Dashboard integration tasks (T011, T016, T021) coordinate layout sequencing to avoid conflicts.
- Polish activities can be handled by any teammate once core stories stabilize.

---

## Notes

- Maintain UI-first polish when exporting Metabase cards; ensure consistent color palette across JSON bundles.
- Keep seed data deterministic for repeatable demos.
- Re-run validation queries after any dataset update to guarantee metric accuracy.
