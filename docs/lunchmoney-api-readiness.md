# LunchMoney V2 API Readiness Report

Audit date: 2026-06-17

Source of truth:

- Postman workspace: `lunchmoney`
- Collection: `Lunch Money API - v2`
- Collection UID: `20003406-32183fec-84c3-4cc5-a741-e7fa74702ef6`
- OpenAPI spec: `Lunch Money API - v2`
- Spec ID: `477f3074-d947-4d31-bb4d-985003471532`
- API base URL: `https://api.lunchmoney.dev/v2`
- Static mock base URL: `https://mock.lunchmoney.dev/v2`
- Auth: Bearer token

No live LunchMoney API calls were run for this audit. The analysis used Postman MCP read-only access to the OpenAPI definition and collection metadata, plus the sanitized endpoint matrix in `docs/lunchmoney-endpoint-matrix.md`.

## Overall Score

Overall readiness score: **80/100**

Verdict: **agent-ready only with connector guardrails**.

The LunchMoney V2 contract is much stronger than a typical alpha API: it has OpenAPI 3.0.2, operation IDs, rich descriptions, schemas, examples, auth documentation, server URLs, and a static mock server. The score is held back by alpha stability risk, incomplete operational headers, uneven response envelopes, action-style endpoints, and error payloads that are helpful to humans but not fully machine-stable.

For this n8n connector, the API is usable as a source of truth, but the implementation must treat the contract as versioned and potentially changing. The connector should normalize errors, avoid automatic write retries, prefer mock/test environments, and keep high-risk data paths opt-in.

## Pillar Scores

| Pillar | Score | Assessment |
| --- | ---: | --- |
| Metadata | 96 | Strong operation IDs, summaries, descriptions, and tags across the API. Tags are described and resource-grouped. |
| Errors | 74 | Common 400, 401, 429, and 500 examples exist, with helpful messages. Weaknesses: no stable error-code field, some empty 404 bodies, and Retry-After guidance is described but not modeled as a response header. |
| Introspection | 88 | Request bodies, required fields, parameter descriptions, formats, enums, size limits, and examples are generally strong. Collection query examples are strings, so connector code should rely on the OpenAPI schema and explicit local validation. |
| Naming | 82 | Resource names and methods are mostly predictable. Path style uses snake_case instead of kebab-case, and action endpoints such as `/plaid_accounts/fetch`, `/transactions/group`, and `/transactions/split/{id}` reduce pure REST predictability. |
| Predictability | 78 | Response schemas and examples are generally available. Risks remain around varied envelopes, only one explicitly paginated list endpoint, status-code ambiguities noted in the endpoint matrix, and optional fields whose presence depends on include flags. |
| Documentation | 86 | The spec includes overview text, Bearer token setup, mock-server guidance, migration links, rate-limit links, support contact, license, and terms. Cookie auth appears beside Bearer auth and should be ignored by this connector unless explicitly needed later. |
| Performance | 52 | 429 behavior is documented and transaction bulk endpoints exist. Missing pieces: modeled rate-limit headers, cache headers, compression guidance, partial-response support, and broad async patterns beyond Plaid fetch. |
| Discoverability | 86 | OpenAPI 3.0.2, production and mock servers, versioned URL path, contact info, and external docs are present. No health endpoint or CORS documentation was found. |

## 8-Pillar Findings

### Metadata

Score: **96/100**

The OpenAPI spec is well-labeled for agent and connector use. Operations have stable operation IDs such as `getMe` and `groupTransactions`, resource tags are defined, and endpoint descriptions explain side effects for sensitive operations such as Plaid fetch and transaction grouping.

Connector impact is low. Use operation IDs and tags to drive internal naming, but do not expose every operation at once. Keep connector release planning based on `docs/lunchmoney-endpoint-matrix.md`, not just on spec completeness.

### Errors

Score: **74/100**

The contract defines useful error responses for common failures. The collection samples show validation errors, unauthorized errors, 429 rate-limit errors, 500 server errors, and endpoint-specific errors such as `425 Too Early` for Plaid fetch.

The main weakness is machine readability. Error bodies generally include `message` and an `errors` array with `errMsg`, and some validation errors include fields such as `invalid_property` or item indexes. There does not appear to be one stable error-code enum across endpoints, and some not-found examples have no JSON body.

Connector mitigation:

- Implement a shared API error normalizer that extracts `message`, `errors[*].errMsg`, `invalid_property`, indexes, and HTTP status.
- Redact Authorization headers, request bodies, signed URLs, filenames, and financial records from thrown errors.
- Treat missing or non-JSON error bodies as valid API behavior and produce a sanitized n8n `NodeApiError`.
- Do not retry writes automatically on 429, 425, or 5xx unless the operation is explicitly known to be idempotent.

### Introspection

Score: **88/100**

The OpenAPI schema is detailed: request bodies mark required fields, schemas include property types, enums are used for constrained values, formats are present for dates and timestamps, and examples exist for many request and response bodies. The transaction insert endpoint, for example, documents the 1-500 transaction limit and returns both inserted records and skipped duplicates.

Connector impact is moderate. The n8n UI should not trust free-form input for constrained fields just because the API can reject it. Validation belongs in the connector for required fields, dates, item counts, enum values, and destructive confirmations.

Connector mitigation:

- Convert enums into n8n option fields wherever practical.
- Add local validation for required body fields, max batch sizes, file size/type, date-pair rules, and ID arrays.
- Keep advanced JSON input only where the API shape is too flexible for static fields.

### Naming

Score: **82/100**

Most paths are predictable nouns under resource names: `/transactions`, `/categories/{id}`, `/manual_accounts/{id}`, and `/budgets/settings`. The API consistently uses snake_case for paths and properties.

The main naming concern is action-style paths such as `/plaid_accounts/fetch`, `/transactions/group`, and `/transactions/split/{id}`. These are understandable, but agents cannot infer safe behavior from HTTP method and noun alone.

Connector mitigation:

- Use human-safe n8n operation names such as `Trigger Fetch`, `Create Group`, `Split`, and `Unsplit`.
- Classify operations by behavior: read, write, bulk write, destructive, binary/file.
- Require explicit confirmation for destructive or state-restructuring operations even when the HTTP method is not `DELETE`.

### Predictability

Score: **78/100**

The API has good schema and example coverage, but response shapes vary by resource. Some list endpoints use envelopes such as `{ categories: [...] }`, transaction lists use `{ transactions: [...], has_more: boolean }`, some successful operations return an object directly, and `204` operations return no body. Optional transaction fields depend on include flags, especially metadata, files, children, split parents, and group children.

The endpoint matrix also records contract ambiguities: `GET /categories/{id}` has a saved `201` response, `PUT /transactions/{id}` has a saved `201` response, and recurring item examples have label/shape inconsistencies.

Connector mitigation:

- Normalize list outputs to one n8n item per entity where possible.
- Keep raw response preservation available under an advanced option when envelope details matter.
- Implement pagination only where explicit: `GET /transactions` with `limit`, `offset`, and `has_more`.
- Add contract tests around known ambiguous endpoints before exposing them broadly.
- Default sensitive include flags to `false`.

### Documentation

Score: **86/100**

The spec description includes the API overview, alpha warning, mock-server guidance, developer portal, getting-started guide, overview, changelog, migration guide, rate-limit page, support contact, terms, and license. Bearer auth is documented and the collection uses a Bearer token variable.

The only connector-relevant ambiguity is that the spec includes both Bearer security and cookie auth. The n8n connector should use Bearer only.

Connector mitigation:

- Document that the connector targets LunchMoney V2 open alpha.
- Document mock/test-budget guidance prominently.
- Keep credential setup focused on Bearer tokens only.
- Link users to LunchMoney's current V2 docs and changelog rather than copying large reference material into this repo.

### Performance

Score: **52/100**

This is the weakest pillar. Rate-limit behavior is documented at a high level, and 429 examples say to retry after the `retry-after` header. The spec does not appear to model `Retry-After` or rate-limit headers in response headers. Cache headers, compression support, partial responses, and general async conventions are not documented. Bulk support exists for transactions, but not broadly.

Connector mitigation:

- Add conservative client-side throttling options only if needed after mock-safe tests and explicit live-test confirmation.
- Respect `Retry-After` if present, but do not require it to exist.
- Avoid automatic retries for create, update, delete, split, unsplit, group, attachment, and budget mutations.
- Add user-configurable `Return All` and `Limit` only for explicitly paginated endpoints.
- Keep transaction bulk write/delete limits below or equal to the documented 500-item API limit.

### Discoverability

Score: **86/100**

The API is easy to find and connect to from the contract. It uses OpenAPI 3.0.2, declares production and static mock server URLs, includes versioning in the URL path, and provides contact and external docs. The mock server is a major safety feature for connector development.

Missing discoverability items are not blockers for this connector: there is no health-check endpoint, no CORS documentation, and no separate staging server beyond the static mock server.

Connector mitigation:

- Default `baseUrl` to production but clearly mark the field as advanced.
- Keep mock/test environment guidance in README and smoke-test docs.
- Never infer service health by making live data calls without explicit confirmation.

## Top Connector Risks

| Risk | Severity | Why It Matters | Connector Mitigation |
| --- | --- | --- | --- |
| V2 is open alpha | High | Contract drift can silently break request fields, response parsing, or status-code assumptions. | Pin behavior to the Postman spec version used for implementation, add contract tests, and document compatibility with V2 alpha. |
| Error payloads are not fully machine-stable | High | n8n users need actionable errors, but raw API errors may omit stable codes or bodies. | Centralize error normalization, sanitize aggressively, and handle missing/non-JSON bodies. |
| Production and mock servers share the same contract | High | A user can accidentally run sensitive reads or writes against real financial data. | Keep `baseUrl` visible but advanced, prefer mock/test docs, never run live calls during development without explicit confirmation, and guard writes/destructive actions. |
| Transaction data is highly sensitive | High | Transaction outputs can include payees, balances, notes, metadata, files, and signed URLs. | Default optional include flags to `false`, avoid logging response bodies, use fake fixtures only, and redact signed URLs and filenames in errors. |
| Writes and destructive operations are not safely retryable by default | High | Retrying create/update/delete operations can duplicate or alter financial data. | Do not auto-retry mutations; require explicit destructive confirmations and item-count guards. |
| Pagination is explicit only for transactions | Medium | A generic pagination helper could over-fetch or miss records on unpaginated endpoints. | Implement pagination per endpoint, not globally. Only `GET /transactions` gets offset/has_more looping. |
| Response envelopes vary by endpoint | Medium | A generic parser can return awkward or incorrect n8n item shapes. | Define per-operation output adapters and tests. Preserve raw response under an advanced option if useful. |
| Attachment URLs and receipt files are sensitive | Medium | Signed URLs and files can leak private financial documents. | Defer attachments until core operations are stable; use n8n binary data, synthetic files, size/type checks, and redaction. |

## Implementation Recommendations

1. Build the connector around a shared HTTP helper that handles Bearer auth, base URL validation, sanitized errors, and JSON parsing.
2. Add a separate shared pagination helper only for endpoints that explicitly expose pagination.
3. Default all transaction include flags that expand sensitive output to `false`.
4. Require explicit confirmation fields for deletes, bulk deletes, transaction grouping changes, split/unsplit, attachment delete, and risky fetch/write operations.
5. Use static mock responses and synthetic fixtures for tests; do not use production data.
6. Add fixture tests for known contract ambiguities before exposing those operations as stable.
7. Treat `Retry-After` as opportunistic: honor it when present, but do not assume headers are modeled or returned.
8. Expose a `Custom API Call` later as an alpha-compatibility escape hatch, with full external URL blocking and path validation.

## Readiness Checklist Mapping

| Check Area | Result |
| --- | --- |
| Metadata: operation IDs, summaries, descriptions, tags | Pass |
| Errors: 4xx, 5xx, 429, schemas, retry guidance | Partial |
| Introspection: parameter types, required fields, enums, examples | Pass |
| Naming: path style, method semantics, naming consistency | Partial |
| Predictability: response schemas, envelopes, pagination, dates, nullability | Partial |
| Documentation: auth, rate limits, overview, links, contact | Pass |
| Performance: rate-limit headers, cache headers, bulk support, async patterns | Partial |
| Discoverability: OpenAPI version, server URLs, versioning, health checks | Partial |

