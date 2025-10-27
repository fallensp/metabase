# Implementation Plan: Sample Metabase Dashboard for Sales Metrics

**Branch**: `001-metabase-dashboard` | **Date**: 2025-10-27 | **Spec**: [spec.md](../spec.md)
**Input**: Feature specification from `/specs/001-metabase-dashboard/spec.md`

## Summary

Deliver a Metabase dashboard that highlights sales and product insights using polished, UI-first visuals backed by seeded mock data reflecting metrics from `Data_visualization_metrics_20251021.xlsx`. Work includes preparing representative sales order and quotation datasets, configuring at least three insight categories (daily sales health, quotation pipeline, quote-to-order conversion), and ensuring stakeholders can explore data through responsive filters.

## Technical Context

**Language/Version**: SQL scripts + Metabase configuration (UI-driven)  
**Primary Dependencies**: Metabase dashboards; spreadsheet `Data_visualization_metrics_20251021.xlsx` as metric source  
**Storage**: PostgreSQL analytics database (assumed Metabase data source)  
**Testing**: Metabase dashboard validation checklist + SQL sanity queries  
**Target Platform**: Internal Metabase workspace (web)  
**Project Type**: Analytics/dashboard documentation and data seeding  
**Performance Goals**: Dashboard tiles refresh within 5 seconds for seeded dataset  
**Constraints**: Mock data must look credible and visually balanced; emphasize UI polish over exhaustive data coverage  
**Scale/Scope**: Seed ~90 days of sales and quotation records across top product categories with 3 insight tabs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution file is currently a placeholder without defined principles; no enforceable gates detected. Flagging for governance follow-up but proceeding for this feature. Post Phase 1 review: conditions unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
data/
└── seeds/
    └── sales_dashboard/          # SQL + CSV fixtures for mock data

metabase/
└── dashboards/
    └── sales-insights/          # Exported Metabase dashboard + card configs

docs/
└── dashboards/
    └── sales-insights.md        # Visual guidelines & UI-first walkthrough
```

**Structure Decision**: Store data generation assets under `data/seeds/sales_dashboard` and capture Metabase exports under `metabase/dashboards/sales-insights`, with supporting documentation in `docs/dashboards/sales-insights.md`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
