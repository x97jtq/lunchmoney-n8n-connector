# LunchMoney n8n Connector Tasks

This backlog turns `docs/implementation-plan.md` into sprint-sized work. Each sprint is intended to be a focused, reviewable slice that can be completed independently and verified before moving on.

## Role Legend

- `PL`: Project Lead
- `PCA`: Postman Contract Analyst
- `ARA`: API Readiness Auditor
- `ARCH`: n8n Node Architect
- `SEC`: Security and Privacy Engineer
- `IMPL`: Connector Implementer
- `TEST`: Test Engineer
- `DOCS`: Documentation and Examples Engineer
- `REL`: Release Engineer
- `REV`: Code Reviewer

## Sprint 0: Project Setup and Repo Hygiene

Goal: create a clean, verification-friendly foundation with no real financial data or secrets.

- [x] `[REL, PL]` Clone or initialize `x97jtq/lunchmoney-n8n-connector` locally.
- [ ] `[REL, IMPL]` Scaffold the package with `npm create @n8n/node`.
- [x] `[REL]` Set package name to `n8n-nodes-lunchmoney`.
- [x] `[REL]` Confirm package keyword includes `n8n-community-node-package`.
- [x] `[REL, ARCH]` Confirm `package.json` includes the `n8n` attribute for nodes and credentials.
- [x] `[DOCS]` Add `docs/` directory.
- [x] `[DOCS, PL]` Move/copy `lunchmoney-n8n-connector-plan.md` to `docs/implementation-plan.md`.
- [x] `[PL]` Add `tasks.md` to the repo root.
- [x] `[SEC, REL]` Add or verify `.gitignore` covers `.env`, logs, build output, local n8n data, and test artifacts.
- [x] `[DOCS, SEC]` Add `README.md` skeleton with project purpose, status, and safety warning.
- [x] `[PL, REL]` Add `LICENSE`.
- [x] `[SEC, TEST]` Add `.env.example` with placeholders only.
- [x] `[REL, TEST]` Add initial GitHub Actions workflow for install, lint, typecheck, tests, and build.
- [x] `[SEC, REV]` Run an initial secret scan for `PMAK`, `Bearer`, `Authorization`, `apiKey`, and real-looking tokens.

Exit criteria:

- [x] `[REL, REV]` Repo builds from a fresh install.
- [x] `[SEC, REV]` No real LunchMoney or Postman data is committed.
- [x] `[REL, TEST]` CI exists, even if tests are minimal.
- [x] `[REL, PL]` Initial commit is pushed to GitHub.

## Sprint 1: Postman Contract Extraction

Goal: convert the Postman LunchMoney V2 collection/spec into an implementation contract.

- [ ] `[PCA]` Read Postman instructions before using Postman MCP.
- [ ] `[PCA]` Confirm workspace `lunchmoney` is accessible.
- [ ] `[PCA]` Confirm collection `Lunch Money API - v2` is accessible.
- [ ] `[PCA]` Confirm OpenAPI spec `Lunch Money API - v2` is accessible.
- [ ] `[PCA]` Fetch the lightweight collection map.
- [ ] `[PCA]` Fetch targeted request details for every endpoint.
- [ ] `[PCA, DOCS]` Create `docs/lunchmoney-endpoint-matrix.md`.
- [ ] `[PCA, ARCH]` Record each endpoint's resource, operation, method, path, auth, params, body, response, and pagination behavior.
- [ ] `[PCA, SEC, ARCH]` Classify every endpoint as read-only, write, bulk write, destructive, binary/file, or custom-call candidate.
- [ ] `[PCA, PL]` Mark each endpoint as `v1`, `v1.1`, or `deferred`.
- [ ] `[PCA, TEST, SEC]` Identify which endpoints can be tested safely against Postman's static mock server.
- [ ] `[PCA, ARCH]` Identify gaps where Postman request details differ from public docs or existing client libraries.

Exit criteria:

- [ ] `[PCA, REV]` Every request in the Postman collection is represented in the endpoint matrix.
- [ ] `[SEC, REV]` Destructive endpoints are clearly marked.
- [ ] `[ARCH, REV]` No implementation requires guessing method/path/parameter names.

## Sprint 2: API Readiness and Risk Report

Goal: assess how agent- and connector-friendly the LunchMoney V2 contract is.

- [ ] `[ARA]` Apply the `postman-api-readiness` 8-pillar framework to the LunchMoney V2 spec/collection.
- [ ] `[ARA, DOCS]` Create `docs/lunchmoney-api-readiness.md`.
- [ ] `[ARA]` Score metadata: operation IDs, summaries, descriptions, tags.
- [ ] `[ARA]` Score errors: 4xx, 5xx, 429, schemas, retry guidance.
- [ ] `[ARA]` Score introspection: parameter types, required fields, enums, examples.
- [ ] `[ARA]` Score naming: path style, method semantics, naming consistency.
- [ ] `[ARA]` Score predictability: response schemas, envelopes, pagination, dates, nullability.
- [ ] `[ARA]` Score documentation: auth, rate limits, overview, links, contact.
- [ ] `[ARA]` Score performance: rate-limit headers, cache headers, bulk support, async patterns.
- [ ] `[ARA]` Score discoverability: OpenAPI version, server URLs, versioning, health checks.
- [ ] `[ARA, ARCH, SEC]` List the top connector-impacting gaps.
- [ ] `[ARA, ARCH, SEC]` Add a connector mitigation for each high-impact gap.

Exit criteria:

- [ ] `[ARA, REV]` Readiness score is documented.
- [ ] `[ARA, ARCH, REV]` Connector implementation risks are documented.
- [ ] `[ARA, REV]` The report distinguishes LunchMoney API limitations from connector responsibilities.

## Sprint 3: Credentials and Core HTTP Layer

Goal: implement safe authentication and shared request behavior.

- [ ] `[IMPL, ARCH]` Create `LunchMoneyApi.credentials.ts`.
- [ ] `[IMPL, SEC]` Add required secret `apiKey` field.
- [ ] `[IMPL, ARCH]` Add advanced `baseUrl` field defaulting to `https://api.lunchmoney.dev/v2`.
- [ ] `[IMPL, ARCH]` Implement bearer auth using n8n credential helpers.
- [ ] `[IMPL, TEST]` Add credential test using `GET /me`.
- [ ] `[IMPL, ARCH]` Create shared request helper.
- [ ] `[IMPL, ARCH]` Create shared pagination helper.
- [ ] `[IMPL, SEC]` Create shared API error normalization helper.
- [ ] `[IMPL, SEC]` Ensure errors redact `Authorization` and request bodies by default.
- [ ] `[TEST, IMPL]` Add unit tests for credential field shape.
- [ ] `[TEST, IMPL, SEC]` Add unit tests for auth header behavior through mocks.
- [ ] `[TEST, SEC]` Add unit tests for safe error redaction.

Exit criteria:

- [ ] `[TEST, REV]` Credential test works against mock/test base URL.
- [ ] `[SEC, REV]` Core helper can make authenticated requests without exposing secrets.
- [ ] `[TEST, REV]` Unit tests cover auth and error redaction.

## Sprint 4: Minimal Node Skeleton

Goal: create a usable n8n node shell with the first safe operation.

- [ ] `[IMPL, ARCH]` Create `LunchMoney.node.ts`.
- [ ] `[IMPL, ARCH]` Add resource selector.
- [ ] `[IMPL, ARCH]` Add operation selector.
- [ ] `[IMPL, TEST]` Add `User > Get current user`.
- [ ] `[IMPL, ARCH]` Wire node execution through the shared request helper.
- [ ] `[IMPL, ARCH]` Return n8n items in standard shape.
- [ ] `[TEST, IMPL]` Add unit test for `User > Get current user`.
- [ ] `[DOCS, SEC]` Add README section for credential setup.
- [ ] `[DOCS, TEST]` Add local n8n smoke-test instructions.

Exit criteria:

- [ ] `[TEST, REV]` Node appears in local n8n.
- [ ] `[TEST, REV]` Credential can be selected.
- [ ] `[TEST, REV]` `User > Get current user` runs against mock/test environment.

## Sprint 5: Read-Only Reference Resources

Goal: implement low-risk read operations that are useful in most workflows.

- [ ] `[IMPL, TEST]` Implement `Categories > Get many`.
- [ ] `[IMPL, TEST]` Implement `Categories > Get`.
- [ ] `[IMPL, TEST]` Implement `Tags > Get many`.
- [ ] `[IMPL, TEST]` Implement `Tags > Get`.
- [ ] `[IMPL, TEST]` Implement `Manual Accounts > Get many`.
- [ ] `[IMPL, TEST]` Implement `Manual Accounts > Get`.
- [ ] `[IMPL, TEST]` Implement `Plaid Accounts > Get many`.
- [ ] `[IMPL, TEST]` Implement `Plaid Accounts > Get`.
- [ ] `[IMPL, TEST]` Implement `Recurring Items > Get many`.
- [ ] `[IMPL, TEST]` Implement `Recurring Items > Get`.
- [ ] `[IMPL, TEST]` Implement `Budgets > Get settings`.
- [ ] `[IMPL, TEST]` Implement `Summary > Get`.
- [ ] `[IMPL, ARCH]` Add `Return All` and `Limit` where list endpoints support them.
- [ ] `[TEST, IMPL]` Add unit tests for each operation's request construction.
- [ ] `[TEST, SEC]` Add fake response fixtures for each resource.

Exit criteria:

- [ ] `[TEST, REV]` All read-only reference operations pass unit tests.
- [ ] `[ARCH, REV]` List operations output one item per entity where possible.
- [ ] `[SEC, REV]` No test fixture contains real account or transaction data.

## Sprint 6: Transactions Read Support

Goal: implement transaction reads carefully because this is the highest-value and highest-sensitivity data path.

- [ ] `[IMPL, TEST]` Implement `Transactions > Get many`.
- [ ] `[IMPL, TEST]` Implement `Transactions > Get`.
- [ ] `[IMPL, PCA, ARCH]` Add supported transaction filters from the Postman contract.
- [ ] `[IMPL, ARCH, TEST]` Add pagination behavior for transaction list.
- [ ] `[IMPL, ARCH]` Add `Return All` and `Limit`.
- [ ] `[TEST, SEC]` Add fake transaction fixtures.
- [ ] `[TEST, IMPL]` Add tests for date filters.
- [ ] `[TEST, IMPL]` Add tests for pagination.
- [ ] `[TEST, IMPL]` Add tests for one-item-per-transaction output.
- [ ] `[DOCS, SEC]` Add README warning that transaction outputs may contain sensitive financial data.

Exit criteria:

- [ ] `[TEST, REV]` Transaction reads work against mock/test environment.
- [ ] `[TEST, REV]` Pagination and limit behavior are covered by tests.
- [ ] `[SEC, REV]` No real transaction data appears in fixtures, docs, or logs.

## Sprint 7: Safe Create and Update Operations

Goal: add non-destructive write operations with deterministic request bodies.

- [ ] `[IMPL, TEST]` Implement `Categories > Create`.
- [ ] `[IMPL, TEST]` Implement `Categories > Update`.
- [ ] `[IMPL, TEST]` Implement `Manual Accounts > Create`.
- [ ] `[IMPL, TEST]` Implement `Manual Accounts > Update`.
- [ ] `[IMPL, TEST]` Implement `Plaid Accounts > Trigger fetch`.
- [ ] `[IMPL, TEST]` Implement `Tags > Create`.
- [ ] `[IMPL, TEST]` Implement `Tags > Update`.
- [ ] `[IMPL, TEST]` Implement `Budgets > Upsert`.
- [ ] `[IMPL, TEST, SEC]` Implement `Transactions > Insert one or more`.
- [ ] `[IMPL, TEST, SEC]` Implement `Transactions > Update`.
- [ ] `[IMPL, TEST, SEC]` Implement `Transactions > Update many`.
- [ ] `[IMPL, ARCH, TEST]` Add validation for required fields.
- [ ] `[IMPL, TEST, SEC]` Add duplicate ID checks where applicable.
- [ ] `[IMPL, SEC, TEST]` Add conservative bulk item limit for multi-transaction writes.
- [ ] `[TEST, IMPL]` Add unit tests for each request body.
- [ ] `[TEST, IMPL]` Add unit tests for invalid input.

Exit criteria:

- [ ] `[TEST, REV]` Write operations produce contract-correct requests.
- [ ] `[TEST, REV]` Invalid inputs fail before API calls.
- [ ] `[SEC, REV]` Bulk operations have guards.
- [ ] `[SEC, REV]` No live production writes are performed.

## Sprint 8: Destructive Operations and Guardrails

Goal: add delete/destructive behavior only with explicit user intent.

- [ ] `[IMPL, SEC, ARCH]` Add reusable `confirmDestructiveOperation` field helper.
- [ ] `[IMPL, TEST, SEC]` Implement `Categories > Delete`.
- [ ] `[IMPL, TEST, SEC]` Implement `Manual Accounts > Delete`.
- [ ] `[IMPL, TEST, SEC]` Implement `Tags > Delete`.
- [ ] `[IMPL, TEST, SEC]` Implement `Budgets > Delete`.
- [ ] `[IMPL, TEST, SEC]` Implement `Transactions > Delete`.
- [ ] `[IMPL, TEST, SEC]` Implement `Transactions > Bulk delete`.
- [ ] `[IMPL, TEST, SEC]` Add empty-list guard for bulk delete.
- [ ] `[IMPL, TEST, SEC]` Add duplicate ID guard for bulk delete.
- [ ] `[IMPL, TEST, SEC]` Add max-count guard for bulk delete.
- [ ] `[TEST, SEC]` Add tests proving destructive operations fail without confirmation.
- [ ] `[TEST, SEC]` Add tests proving destructive operations pass with confirmation.
- [ ] `[DOCS, SEC]` Add README destructive-operation safety section.

Exit criteria:

- [ ] `[SEC, REV]` Every destructive operation requires explicit confirmation.
- [ ] `[TEST, REV]` Bulk delete cannot run with empty or malformed input.
- [ ] `[TEST, REV]` Tests cover both refused and allowed paths.

## Sprint 9: Advanced Transaction Operations

Goal: add transaction grouping and split support after core behavior is stable.

- [ ] `[IMPL, TEST]` Implement `Transactions > Create group`.
- [ ] `[IMPL, TEST, SEC]` Implement `Transactions > Delete group`.
- [ ] `[IMPL, TEST]` Implement `Transactions > Split`.
- [ ] `[IMPL, TEST, SEC]` Implement `Transactions > Unsplit`.
- [ ] `[PCA, IMPL, TEST]` Confirm request/response behavior against Postman contract.
- [ ] `[IMPL, TEST]` Add required-field validation.
- [ ] `[IMPL, SEC]` Add destructive confirmation where appropriate.
- [ ] `[TEST, SEC]` Add fake fixtures and unit tests.
- [ ] `[DOCS, ARCH]` Document output shapes.

Exit criteria:

- [ ] `[TEST, REV]` Advanced transaction operations pass unit tests.
- [ ] `[DOCS, REV]` Split/group behavior is documented.
- [ ] `[SEC, REV]` Destructive/irreversible paths are guarded.

## Sprint 10: Attachments

Goal: support transaction file attachments only after core financial operations are stable.

- [ ] `[PCA, ARCH]` Re-check Postman contract for attachment upload and download URL behavior.
- [ ] `[IMPL, TEST]` Implement `Transactions > Attach file`.
- [ ] `[IMPL, TEST]` Implement `Transactions > Get attachment URL`.
- [ ] `[IMPL, TEST, SEC]` Implement `Transactions > Delete attachment`.
- [ ] `[IMPL, ARCH, TEST]` Add n8n binary-data handling.
- [ ] `[TEST, SEC]` Add synthetic file fixtures only.
- [ ] `[TEST, IMPL]` Add tests for binary input validation.
- [ ] `[IMPL, SEC]` Add destructive confirmation for attachment delete.
- [ ] `[DOCS, SEC]` Add README notes warning against committing receipts or real financial files.

Exit criteria:

- [ ] `[TEST, REV]` Attachment operations work with synthetic files.
- [ ] `[SEC, REV]` No real receipt/document data is used.
- [ ] `[DOCS, REV]` Binary behavior is documented.

## Sprint 11: Custom API Call

Goal: provide a safe escape hatch for V2 alpha changes without encouraging unsafe arbitrary HTTP calls.

- [ ] `[IMPL, ARCH, SEC]` Implement `Custom API Call`.
- [ ] `[IMPL, ARCH]` Add method selector.
- [ ] `[IMPL, ARCH]` Add endpoint path field.
- [ ] `[IMPL, ARCH]` Add query parameter collection.
- [ ] `[IMPL, ARCH]` Add JSON body input.
- [ ] `[IMPL, SEC]` Use LunchMoney credential and configured base URL.
- [ ] `[IMPL, SEC]` Block full external URLs by default.
- [ ] `[IMPL, SEC, TEST]` Validate endpoint path starts with `/`.
- [ ] `[TEST, SEC]` Add tests for safe path validation.
- [ ] `[TEST, SEC]` Add tests that external URLs are rejected.
- [ ] `[DOCS, SEC]` Document appropriate use cases.

Exit criteria:

- [ ] `[TEST, REV]` Custom call can hit LunchMoney paths.
- [ ] `[SEC, REV]` Custom call cannot silently send credentials to arbitrary external hosts.
- [ ] `[TEST, REV]` Tests cover path safety.

## Sprint 12: Local n8n Smoke Testing

Goal: verify the connector in a real n8n install without production data.

- [ ] `[TEST, REL]` Install package in a clean local n8n environment.
- [ ] `[TEST, SEC]` Create mock credential.
- [ ] `[TEST]` Run `User > Get current user`.
- [ ] `[TEST]` Run category/tag/account list operations.
- [ ] `[TEST, SEC]` Run transaction list against mock/test data.
- [ ] `[TEST, ARCH]` Confirm output shapes in n8n UI.
- [ ] `[TEST, SEC]` Confirm destructive operations refuse to run without confirmation.
- [ ] `[DOCS, TEST]` Create smoke-test notes in `docs/local-smoke-test.md`.
- [ ] `[TEST, PL]` Record any n8n UX issues as follow-up tasks.

Exit criteria:

- [ ] `[TEST, REV]` Local n8n can load the node.
- [ ] `[TEST, REV]` Read operations work in the UI.
- [ ] `[SEC, REV]` Destructive safeguards are visible and effective.

## Sprint 13: Example Workflows and Documentation

Goal: make the connector understandable and useful to users.

- [ ] `[DOCS, REL]` Expand README installation instructions.
- [ ] `[DOCS, SEC]` Add credential setup guide.
- [ ] `[DOCS, ARCH]` Add supported operations table.
- [ ] `[DOCS, SEC]` Add mock/test/prod environment guidance.
- [ ] `[DOCS, PCA]` Add alpha API compatibility note.
- [ ] `[DOCS, SEC]` Add privacy and data-protection guidance.
- [ ] `[DOCS, TEST]` Add troubleshooting section.
- [ ] `[DOCS, TEST, SEC]` Create example workflow: monthly transaction export.
- [ ] `[DOCS, TEST, SEC]` Create example workflow: uncategorized transaction monitor.
- [ ] `[DOCS, TEST]` Create example workflow: category/tag sync.
- [ ] `[DOCS, TEST]` Create example workflow: budget summary report.
- [ ] `[DOCS, TEST, SEC]` Create example workflow: new transaction ingest.
- [ ] `[TEST, DOCS]` Validate example workflows with n8n validation tooling where available.

Exit criteria:

- [ ] `[DOCS, REV]` README is useful without reading source code.
- [ ] `[SEC, REV]` Example workflows use fake data only.
- [ ] `[SEC, REV]` Workflows are inactive by default.
- [ ] `[DOCS, REV]` Docs explain destructive operation behavior.

## Sprint 14: Release Hardening

Goal: prepare for a private alpha and later public npm release.

- [ ] `[REL, TEST]` Run full lint.
- [ ] `[REL, TEST]` Run full typecheck.
- [ ] `[REL, TEST]` Run full unit test suite.
- [ ] `[TEST, REL]` Run local n8n smoke test.
- [ ] `[SEC, REV]` Run secret scan.
- [ ] `[REL]` Run `npm pack`.
- [ ] `[REL, SEC]` Inspect package tarball contents.
- [ ] `[SEC, REL]` Confirm no `.env`, logs, screenshots, real fixtures, or credentials are included.
- [ ] `[REL, ARCH]` Confirm runtime dependencies are absent or justified.
- [ ] `[REL, DOCS]` Add changelog.
- [ ] `[REL]` Add npm provenance publish workflow.
- [ ] `[REL, PL]` Configure npm trusted publisher or token-based publish secret.

Exit criteria:

- [ ] `[REL, SEC, REV]` Package is safe to publish as alpha.
- [ ] `[REL, SEC, REV]` Package tarball contains only intended files.
- [ ] `[REL, REV]` GitHub Actions can build the package.

## Sprint 15: Alpha Release and Verification Prep

Goal: publish safely and prepare for n8n verification.

- [ ] `[REL, PL]` Publish `0.1.0-alpha.0` via GitHub Actions.
- [ ] `[TEST, REL]` Install alpha package in clean n8n instance.
- [ ] `[TEST]` Run read-only smoke tests.
- [ ] `[TEST, SEC]` Run safe write tests against test budget only.
- [ ] `[PL, TEST]` Collect release issues.
- [ ] `[IMPL, TEST, PL]` Fix alpha blockers.
- [ ] `[REL, PL]` Publish `0.1.0` when stable.
- [ ] `[REL, ARCH]` Review n8n technical guidelines.
- [ ] `[REL, DOCS]` Review n8n UX guidelines.
- [ ] `[REL, DOCS, PL]` Prepare Creator Portal submission notes.

Exit criteria:

- [ ] `[REL, REV]` Alpha package installs from npm.
- [ ] `[TEST, REV]` Real users can configure credentials and run safe read operations.
- [ ] `[REL, PL, REV]` Verification blockers are known or resolved.

## Always-On Safety Tasks

Run these throughout the project, not only at release time.

- [ ] `[SEC, REV]` Never commit real LunchMoney tokens.
- [ ] `[SEC, REV]` Never commit Postman API keys.
- [ ] `[SEC, REV]` Never commit real transaction/account/category/tag/budget data.
- [ ] `[SEC, REV]` Never commit real receipt or attachment files.
- [ ] `[DOCS, TEST, SEC]` Keep all examples synthetic.
- [ ] `[TEST, SEC]` Keep live integration tests local-only and opt-in.
- [ ] `[SEC, PL]` Do not run production API calls without explicit confirmation.
- [ ] `[SEC, PL]` Do not activate n8n workflows without explicit confirmation.
- [ ] `[REL, PL]` Do not publish npm packages without explicit confirmation.
- [ ] `[PCA, SEC, PL]` Do not publish Postman documentation or mocks without explicit confirmation.

## Recommended First Execution Slice

Start here before expanding scope:

- [ ] `[PL]` Complete Sprint 0.
- [ ] `[PCA]` Complete Sprint 1.
- [ ] `[ARA]` Complete Sprint 2.
- [ ] `[IMPL, ARCH, SEC, TEST]` Complete Sprint 3.
- [ ] `[IMPL, ARCH, TEST, DOCS]` Complete Sprint 4.
- [ ] `[IMPL, TEST, SEC]` Implement only `Categories > Get many`, `Tags > Get many`, and `Transactions > Get many` from Sprints 5 and 6.
- [ ] `[TEST, SEC]` Run local mock-only smoke test.
- [ ] `[ARCH, REV, PL]` Review the connector UX before adding writes.
