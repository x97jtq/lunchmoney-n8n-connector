# LunchMoney V2 API Readiness Report

Status: pending analysis.

This report will use the Postman API-readiness framework to evaluate whether the LunchMoney V2 API contract is easy for agents and automation tools to discover, call, parse, and recover from.

Source of truth:

- Postman workspace: `lunchmoney`
- Collection UID: `20003406-32183fec-84c3-4cc5-a741-e7fa74702ef6`
- Spec ID: `477f3074-d947-4d31-bb4d-985003471532`

## Overall Score

Pending.

## Pillar Scores

| Pillar | Score | Notes |
| --- | ---: | --- |
| Metadata | Pending | operation IDs, summaries, descriptions, tags |
| Errors | Pending | 4xx, 5xx, 429, schemas, retry guidance |
| Introspection | Pending | parameter types, required fields, enums, examples |
| Naming | Pending | paths, method semantics, naming consistency |
| Predictability | Pending | response schemas, envelopes, pagination, dates, nullability |
| Documentation | Pending | auth, rate limits, overview, links, contact |
| Performance | Pending | rate-limit headers, cache headers, bulk support, async patterns |
| Discoverability | Pending | OpenAPI version, server URLs, versioning, health checks |

## Top Connector Risks

Pending analysis.

Expected risk areas to verify:

- V2 API is labeled open alpha.
- Error schema consistency may affect `NodeApiError` quality.
- Pagination behavior must be explicit for transaction reads.
- Rate-limit behavior must be understood before adding retries.
- Idempotency behavior must be understood before retrying writes.

## Connector Mitigations

Pending analysis.

Likely mitigations:

- Normalize API errors in a shared helper.
- Avoid retrying non-idempotent writes by default.
- Add explicit pagination tests for transactions.
- Keep `Custom API Call` available for alpha API changes.
- Add README compatibility notes for V2 alpha behavior.

