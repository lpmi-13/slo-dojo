# Implementation Plan

This project is a fixed three-defect SLO workshop. It intentionally deviates from a randomized dojo model: every reset creates the same service, same data shape, same workload, and same three SLO breaches.

## Constraints

- Do not create independent scenario variants.
- Do not split learner materials into one document per scenario plus a separate final dojo.
- Keep the same three things wrong every setup.
- Provide feedback only when each SLO breach alert clears, and when all SLOs are resolved.
- Keep the root causes authentic rather than hardcoded failure subsets.

## Fixed Defects

1. Homepage p95 latency breach.
   The homepage uses inefficient page-load logic over realistic relational data.

2. Login success breach.
   Login uses suboptimal email matching logic, so normal email-case variation creates failed logins.

3. Search p95 latency breach.
   Product search runs against a read-heavy table without the supporting search index.

## Implementation Phases

1. Build route-level metrics and fixed app journeys.
2. Seed deterministic relational data at database initialization.
3. Generate stable background workload for homepage, login, and search.
4. Define Prometheus SLO alerts and one all-resolved success alert.
5. Provision a Grafana dashboard around SLO state, not hints.
6. Add a checker that reports only breached/resolved SLO state.
7. Keep documentation focused on the workshop contract and operations.
