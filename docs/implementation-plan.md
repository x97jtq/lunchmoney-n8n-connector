# LunchMoney V2 n8n Community Connector Plan

## Summary

Build a production-quality n8n community node package for the LunchMoney V2 API. The package target is `n8n-nodes-lunchmoney`, suitable for private use first and structured for eventual public npm release and n8n community-node verification.

The Postman MCP and installed Postman skills change the plan in one important way: Postman becomes the contract and readiness layer before connector coding. The LunchMoney Postman workspace already contains a V2 collection and OpenAPI 3.0 spec, so development should start by extracting an endpoint matrix, checking API-readiness gaps, and using Postman's mock/test capabilities before touching real LunchMoney data.

Known Postman source:

- Workspace: `lunchmoney`
- Workspace ID: `acff8446-9359-47f2-ad75-cca30e00c4ed`
- Collection: `Lunch Money API - v2`
- Collection UID: `20003406-32183fec-84c3-4cc5-a741-e7fa74702ef6`
- Spec: `Lunch Money API - v2`
- Spec ID: `477f3074-d947-4d31-bb4d-985003471532`
- API base URL: `https://api.lunchmoney.dev/v2`
- Auth: Bearer token, represented in Postman as `{{bearerToken}}`
- API state: V2 is labeled open alpha in the Postman collection description

## Goals

1. Provide a plug-and-play n8n LunchMoney connector for common personal finance workflows.
2. Keep your production financial data protected during development.
3. Use the Postman collection/spec as the source of truth for endpoint behavior.
4. Build toward public community-node quality from the start.
5. Avoid runtime dependencies that could block n8n verification.
6. Keep the connector easy to debug, safe for destructive actions, and pleasant for n8n users.

## Non-Goals

- Do not build only a workflow template as the long-term solution.
- Do not wrap `lunch-money-js-v2` as a runtime dependency in the n8n node.
- Do not run live production LunchMoney API calls during development unless explicitly approved.
- Do not publish documentation, npm packages, mocks, or workflows publicly without explicit approval.
- Do not store real LunchMoney data in test fixtures, committed files, screenshots, logs, or example workflow JSON.

## Data Protection Model

Development uses three strict environments.

### 1. Mock Environment

Purpose: default development and automated tests.

- Uses the static mock server documented in the Postman collection.
- Uses a fake bearer token string that satisfies the mock token requirement.
- Contains only fake fixture data.
- Safe for local unit tests, connector UI tests, and CI.
- No real LunchMoney token is used.
- No real transaction, account, category, tag, budget, merchant, or attachment data is used.

### 2. Test Budget Environment

Purpose: limited live integration checks.

- Uses a dedicated LunchMoney test budget, not your real budget.
- Contains synthetic accounts, categories, tags, budgets, and transactions.
- Uses a dedicated LunchMoney API token scoped to that test budget if LunchMoney supports budget-level token separation.
- Used only for local opt-in integration tests.
- Never used in public CI.

### 3. Production Environment

Purpose: your real LunchMoney use after the connector is stable.

- Uses your real LunchMoney token stored only in n8n credentials.
- No production calls are made by automated tests.
- No destructive operation runs without explicit user confirmation.
- No production response bodies are copied into logs, code, fixtures, issue reports, docs, or chat unless manually redacted.

## Secret Handling Rules

- LunchMoney API tokens live only in n8n credentials or Postman secret environment variables.
- Real tokens must never appear in `package.json`, `.env.example`, README examples, workflow JSON, test snapshots, request examples, or issue templates.
- Public examples use placeholder values such as `lm_test_token_example`.
- Error handling must redact request headers and never display `Authorization`.
- Debug output may include method, endpoint path, HTTP status, and a safe error message.
- Debug output must not include full transaction request bodies by default.
- Local integration tests are gated by environment variables such as `LUNCHMONEY_TEST_TOKEN` and `LUNCHMONEY_TEST_BASE_URL`.
- CI must skip live tests unless an explicit private workflow is created later.

## Source of Truth

Use sources in this order:

1. Postman workspace `lunchmoney`
2. Postman OpenAPI 3.0 spec `Lunch Money API - v2`
3. Postman collection `Lunch Money API - v2`
4. Public LunchMoney V2 docs
5. Existing clients only as reference material:
   - `lunch-money/lunch-money-js-v2`
   - `juftin/lunchmoney-clients`
   - `Cidan/lunchmoney-go`

The existing clients are useful for understanding common abstractions and edge cases, but they should not drive the connector API if they disagree with the Postman/OpenAPI contract.

## Postman Workflow

### Contract Extraction

Create an endpoint matrix from the Postman collection and spec before coding operations.

For each endpoint capture:

- Resource group
- Operation name
- HTTP method
- Path
- Path parameters
- Query parameters
- Request body shape
- Response body shape
- Pagination behavior
- Auth requirement
- Error responses
- Whether the operation is read-only, write, bulk, or destructive
- Whether the operation is safe for mock tests
- Whether it needs binary/file handling
- Whether it should be included in v1, v1.1, or deferred

Use targeted Postman reads:

- `getWorkspace` for inventory
- `getCollection` default lightweight map for folder/request tree
- `getCollectionRequest` for specific endpoint details
- Avoid `getCollection(model=full)` unless needed, because large full payloads can overflow.

### API Readiness Analysis

Run the `postman-api-readiness` framework against the LunchMoney V2 spec/collection and record findings.

The analysis should score:

- Metadata: operation IDs, summaries, descriptions, tags
- Errors: 4xx, 5xx, 429, error schemas, retry guidance
- Introspection: parameter types, required fields, enums, examples
- Naming: path style, method semantics, naming consistency
- Predictability: response schemas, envelopes, pagination, date formats, nullability
- Documentation: auth docs, rate limits, overview, links, contact
- Performance: rate limit headers, cache headers, bulk support, async patterns
- Discoverability: OpenAPI version, server URLs, versioning, health checks

Connector work does not need to fix LunchMoney's public API, but readiness gaps should influence the n8n node:

- Missing error schemas become defensive error normalization in the connector.
- Missing examples become fake local fixtures.
- Missing pagination docs become explicit implementation notes and tests.
- Missing rate-limit detail becomes conservative retry behavior.
- Alpha API instability becomes a README compatibility note.

### Mock and Test Assets

Use Postman to support connector development:

- Prefer the existing static mock server if available.
- If missing examples block useful mocks, add synthetic examples only after approval.
- Keep Postman variables split by environment:
  - mock bearer token: fake/default
  - test bearer token: secret
  - prod bearer token: secret and never used by connector development tests
- Do not publish Postman documentation publicly without approval.
- Do not run the full Postman collection against production without approval.

## n8n Connector Architecture

### Package

- Package name: `n8n-nodes-lunchmoney`
- Node package type: n8n community node
- Primary node: `LunchMoney`
- Credential type: `LunchMoneyApi`
- Language: TypeScript
- Runtime dependencies: none unless n8n verification policy allows them and there is a strong reason
- Development dependencies: normal n8n community-node tooling, TypeScript, linting, test tooling

### Credential

Create `LunchMoneyApi.credentials.ts`.

Fields:

- `apiKey`
  - Required
  - Password/secret field
  - Used as bearer token
- `baseUrl`
  - Advanced option
  - Default: `https://api.lunchmoney.dev/v2`
  - Allows mock/test URLs during development

Credential behavior:

- Send `Authorization: Bearer <apiKey>`.
- Credential test calls `GET /me`.
- Credential test reports only safe status and message.
- The credential UI should warn that V2 is open alpha if that remains true.

### Shared Helpers

Create a small internal helper layer rather than a large client SDK.

Required helpers:

- `lunchMoneyApiRequest(method, endpoint, qs, body, options)`
- `lunchMoneyApiRequestAllItems(propertyName, method, endpoint, qs, body)`
- `normalizeLunchMoneyError(error)`
- `buildQueryFromFields(fields)`
- `validateDestructiveConfirmation(operation, confirmed)`
- `splitArrayResponse(response, propertyName)`

Expected request behavior:

- Use n8n's authenticated HTTP helper.
- Respect n8n proxy/timeout behavior.
- Throw `NodeApiError` for API failures.
- Throw `NodeOperationError` for invalid node configuration.
- Avoid logging request bodies unless a debug option is explicitly added later.
- Preserve raw API fields in output.

### Node UX

Implement one action node with resource and operation selectors.

Resource groups for v1:

- User
- Summary
- Categories
- Manual Accounts
- Plaid Accounts
- Transactions
- Tags
- Recurring Items
- Budgets
- Custom API Call

General n8n UX rules:

- Use clear resource and operation names.
- Use `Get Many` for list operations.
- Use `Return All` and `Limit` for list operations.
- Use fixed collection fields for structured body inputs.
- Use JSON body fallback only where endpoint flexibility demands it.
- Output one n8n item per returned entity where possible.
- Preserve full raw entity fields.
- Add operation descriptions that warn when operations mutate data.

### Safety UI for Writes

All write operations are allowed only when configured intentionally.

For destructive operations, add:

- Required boolean: `confirmDestructiveOperation`
- Display description: user is intentionally deleting/updating LunchMoney data
- Optional max item count guard for bulk operations

Destructive operations:

- Delete category or category group
- Delete manual account
- Delete transaction
- Bulk delete transactions
- Delete transaction group
- Unsplit transaction
- Delete attachment
- Delete tag
- Delete budget

Bulk write operations:

- Insert one or more transactions
- Update multiple transactions
- Bulk delete transactions

Bulk safeguards:

- Fail if item ID list is empty.
- Fail if item ID list contains duplicates.
- Fail above a conservative default max, for example 100, unless a user raises the limit in an advanced option.
- Return a summary of requested IDs and API response.

## Operation Coverage

### V1 Must Have

User:

- Get current user

Summary:

- Get summary

Categories:

- Get all categories
- Get a single category
- Create category or category group
- Update category or category group
- Delete category or category group

Manual Accounts:

- Get all manual accounts
- Get a single manual account
- Create manual account
- Update manual account
- Delete manual account

Plaid Accounts:

- Get all Plaid accounts
- Get a single Plaid account
- Trigger fetch from Plaid

Transactions:

- Get all transactions
- Get a single transaction
- Insert one or more transactions
- Update transaction
- Update multiple transactions
- Delete transaction
- Bulk delete transactions

Tags:

- Get all tags
- Get a single tag
- Create tag
- Update tag
- Delete tag

Recurring Items:

- Get all recurring items
- Get a single recurring item

Budgets:

- Get budget settings
- Upsert budget
- Delete budget

Custom API Call:

- Method
- Endpoint path
- Query parameters
- JSON body
- Uses the LunchMoney credential and base URL

### V1.1 or Later

Transaction advanced operations:

- Create transaction group
- Delete transaction group
- Split transaction
- Unsplit transaction

Attachments:

- Attach file to transaction
- Get URL to download file attachment
- Delete file attachment

Reason to defer attachments:

- Binary handling needs extra n8n UX and tests.
- It increases data-protection risk because files may contain receipts or financial documents.
- It should be built after basic read/write behavior is stable.

## Development Phases

### Phase 0: Repository and Tooling

Deliverables:

- Scaffold `n8n-nodes-lunchmoney`.
- Add TypeScript config.
- Add linting and formatting.
- Add unit test framework.
- Add npm package metadata for n8n community-node discovery.
- Add README skeleton.
- Add `.env.example` with fake values only.
- Add GitHub Actions for lint, typecheck, tests, and build.

Acceptance criteria:

- Package builds locally.
- Lint/typecheck/test scripts exist.
- No real token or personal data appears in repo.

### Phase 1: Postman Contract Extraction

Deliverables:

- `docs/lunchmoney-endpoint-matrix.md`
- Endpoint list grouped by resource.
- Read/write/destructive classification.
- Pagination notes.
- Error/response notes.
- Operation priority labels: v1, v1.1, deferred.

Acceptance criteria:

- Every request in the Postman collection appears in the matrix.
- Every destructive operation is explicitly marked.
- Every endpoint has enough method/path/parameter information to implement without guessing.

### Phase 2: API Readiness Report

Deliverables:

- `docs/lunchmoney-api-readiness.md`
- 8-pillar score based on the Postman/OpenAPI skill framework.
- Top readiness gaps that affect connector implementation.
- Connector mitigations for each high-impact gap.

Acceptance criteria:

- Report identifies whether the spec is agent-ready.
- Report distinguishes API problems from connector mitigations.
- Report does not include real user data.

### Phase 3: Credential and Core Request Helper

Deliverables:

- `LunchMoneyApi.credentials.ts`
- Shared request helper
- Credential test via `GET /me`
- Mock base URL support through advanced credential field

Acceptance criteria:

- Credential fields are marked secret where appropriate.
- Credential test works against mock/test endpoint.
- Authorization header is never printed.
- Helper maps common API errors into useful n8n errors.

### Phase 4: Read-Only Operations

Implement first:

- User: Get current user
- Categories: Get all, Get single
- Manual Accounts: Get all, Get single
- Plaid Accounts: Get all, Get single
- Tags: Get all, Get single
- Recurring Items: Get all, Get single
- Summary: Get
- Budgets: Get settings
- Transactions: Get all, Get single

Acceptance criteria:

- Each operation has unit tests using fake responses.
- List operations support `Return All` and `Limit` where applicable.
- Transactions list handles pagination or documented pagination behavior.
- Output is one n8n item per entity where possible.

### Phase 5: Safe Write Operations

Implement:

- Create category
- Update category
- Create manual account
- Update manual account
- Trigger Plaid fetch
- Insert transaction(s)
- Update transaction
- Update multiple transactions
- Create tag
- Update tag
- Upsert budget

Acceptance criteria:

- All write operations have fake unit tests.
- Body construction is deterministic.
- Required fields are enforced by node validation.
- Bulk write operations validate input list shape and duplicate IDs.

### Phase 6: Destructive Operations

Implement:

- Delete category
- Delete manual account
- Delete transaction
- Bulk delete transactions
- Delete tag
- Delete budget

Acceptance criteria:

- Every destructive operation requires `confirmDestructiveOperation`.
- Bulk delete requires non-empty IDs and max-count guard.
- Unit tests verify operation fails without confirmation.
- README documents risk clearly.

### Phase 7: Advanced Transaction Operations

Implement:

- Create transaction group
- Delete transaction group
- Split transaction
- Unsplit transaction

Acceptance criteria:

- Operation semantics are verified against Postman contract.
- Unit tests cover happy path and invalid input.
- Split/unsplit outputs are documented.

### Phase 8: Attachments

Implement only after previous phases are stable:

- Attach file to transaction
- Get attachment download URL
- Delete attachment

Acceptance criteria:

- Binary data handling works in n8n.
- Tests use synthetic files only.
- No receipt or real financial document fixtures are committed.
- Delete attachment requires destructive confirmation.

### Phase 9: Custom API Call

Implement:

- Method selector
- Endpoint path
- Query parameter collection
- JSON body input
- Optional raw response mode if useful

Acceptance criteria:

- Uses LunchMoney credential.
- Blocks full URL input by default to avoid accidental external calls.
- Allows only paths under the configured base URL.
- Provides clear error messages.

### Phase 10: Local n8n Smoke Testing

Deliverables:

- Local install instructions.
- Example workflows using fake/mock data.
- Smoke test checklist.

Smoke tests:

- Install package into local n8n.
- Create mock credential.
- Run `Get current user`.
- Run categories/tags/account list operations.
- Run transactions list with fake data.
- Verify output item shapes.
- Verify destructive operations refuse to run without confirmation.

Acceptance criteria:

- All read-only smoke tests pass against mock or test budget.
- No production token used.
- No workflow activated automatically.

### Phase 11: Documentation and Examples

Deliverables:

- README
- Credential setup guide
- Supported operations table
- Data safety section
- Mock/test/prod environment guidance
- Example workflows
- Troubleshooting section
- Known alpha API limitations

Example workflows:

- Monthly transaction export
- Uncategorized transaction monitor
- Category/tag sync
- Budget summary report
- New transaction ingest from another system

Acceptance criteria:

- Examples use fake data.
- Docs explain mock/test/prod separation.
- Docs warn that LunchMoney V2 is alpha if still true.
- Docs explain destructive operation confirmations.

### Phase 12: Release Preparation

Deliverables:

- `npm pack` verification.
- Package metadata reviewed.
- License selected.
- Changelog.
- GitHub Actions release workflow with provenance.
- npm pre-release `0.1.0-alpha.0`.

Acceptance criteria:

- Build passes.
- Lint passes.
- Unit tests pass.
- Package installs in clean local n8n.
- No secrets or real data in package tarball.

### Phase 13: Public Release and Verification

Deliverables:

- npm `0.1.0`.
- GitHub release.
- n8n Creator Portal submission.
- Verification checklist.

Acceptance criteria:

- Public package has no runtime dependencies that violate n8n requirements.
- README is complete.
- Credential behavior is safe.
- Public examples are fake.
- Verification submission contains no real data.

## Testing Strategy

### Unit Tests

Cover:

- Request method/path/query/body generation
- Credential header behavior through mocked helpers
- Pagination
- Error normalization
- Required field validation
- Destructive confirmation failures
- Bulk operation guardrails
- Custom API call path validation

### Fixture Rules

- Use fake user IDs, account IDs, category IDs, tag IDs, transaction IDs.
- Use fake merchant names.
- Use fake amounts.
- Use fake dates.
- Do not use real bank names unless they are generic examples.
- Do not use real LunchMoney response bodies from your account.

### Mock Tests

Use:

- Postman static mock server where available
- Local mocked HTTP responses where Postman examples are incomplete

Mock tests must be safe to run repeatedly.

### Live Integration Tests

Live tests are local-only and opt-in.

Required env vars:

- `LUNCHMONEY_TEST_TOKEN`
- `LUNCHMONEY_TEST_BASE_URL`
- `LUNCHMONEY_TEST_BUDGET_NOTE` or equivalent documentation marker

Rules:

- Never run live tests in public CI.
- Never run against production budget by default.
- Live destructive tests must create their own synthetic entity and delete only that entity.
- If a synthetic cleanup fails, report the entity ID and stop.

### n8n Workflow Validation

For example workflows:

- Inspect node schemas before configuring.
- Validate node configs where tooling is available.
- Validate full workflows before import/deploy.
- Create workflows inactive by default.
- Do not activate or execute workflows without explicit confirmation.

## Security and Privacy Checklist

Before every commit:

- Search for `PMAK`, `Bearer`, `Authorization`, `apiKey`, real token prefixes, and known personal strings.
- Check test fixtures for real merchant/account/transaction data.
- Check README and screenshots for tokens or financial data.
- Check workflow JSON for credential IDs or real values.
- Confirm `.env` is ignored.
- Confirm `.env.example` contains placeholders only.

Before every npm publish:

- Run `npm pack`.
- Inspect package contents.
- Confirm no local artifacts, screenshots, logs, or environment files are included.
- Confirm examples are fake.
- Confirm package can install cleanly.

Before any production use:

- Run read-only operations first.
- Confirm output shape.
- Confirm no unexpected pagination behavior.
- Confirm write operation against test budget.
- Confirm destructive operation guardrails.
- Create backup/export if LunchMoney provides one.

## Implementation Defaults

- Use one n8n node with resource/operation selectors.
- Use n8n credential storage for API keys.
- Use Postman/OpenAPI contract over third-party client implementations.
- Use mock environment for development by default.
- Use fake data in all committed tests and examples.
- Use conservative retries only where safe.
- Do not retry non-idempotent writes by default unless the API provides idempotency guidance.
- Preserve raw LunchMoney fields in output.
- Return one item per entity for list operations.
- Defer attachments until core operations are stable.
- Defer public publishing until package and docs pass the privacy checklist.

## Open Questions

1. Does LunchMoney provide a true separate test budget or sandbox, or should we create a dedicated real budget with synthetic data?
2. Does the V2 API provide rate-limit headers and retry guidance beyond the Postman docs?
3. Does the V2 API provide idempotency keys for transaction insert/update operations?
4. Are API tokens budget-scoped or account-wide?
5. Should the first private release include writes, or should `0.1.0-alpha.0` be read-only plus custom API call?
6. Should the connector expose advanced raw JSON body fields for power users, or keep the UI fully structured?

## Recommended First Build Slice

Build the smallest useful safe version:

1. Package scaffold.
2. Postman endpoint matrix.
3. API-readiness report.
4. Credential type with mock/test base URL.
5. `User > Get current user`.
6. `Categories > Get many`.
7. `Tags > Get many`.
8. `Transactions > Get many`.
9. Unit tests and mock smoke tests.
10. README with data-protection workflow.

This gives a functioning connector skeleton, proves auth and list behavior, exercises the highest-value read operations, and avoids production data mutation while the alpha API contract is still being validated.
