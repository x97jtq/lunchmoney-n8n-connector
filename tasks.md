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
- [x] `[REL, IMPL]` Scaffold the package with `npm create @n8n/node`.
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

- [x] `[PCA]` Read Postman instructions before using Postman MCP.
- [x] `[PCA]` Confirm workspace `lunchmoney` is accessible.
- [x] `[PCA]` Confirm collection `Lunch Money API - v2` is accessible.
- [x] `[PCA]` Confirm OpenAPI spec `Lunch Money API - v2` is accessible.
- [x] `[PCA]` Fetch the lightweight collection map.
- [x] `[PCA]` Fetch targeted request details for every endpoint.
- [x] `[PCA, DOCS]` Create `docs/lunchmoney-endpoint-matrix.md`.
- [x] `[PCA, ARCH]` Record each endpoint's resource, operation, method, path, auth, params, body, response, and pagination behavior.
- [x] `[PCA, SEC, ARCH]` Classify every endpoint as read-only, write, bulk write, destructive, binary/file, or custom-call candidate.
- [x] `[PCA, PL]` Mark each endpoint as `v1`, `v1.1`, or `deferred`.
- [x] `[PCA, TEST, SEC]` Identify which endpoints can be tested safely against Postman's static mock server.
- [x] `[PCA, ARCH]` Identify gaps where Postman request details differ from public docs or existing client libraries.

Exit criteria:

- [x] `[PCA, REV]` Every request in the Postman collection is represented in the endpoint matrix.
- [x] `[SEC, REV]` Destructive endpoints are clearly marked.
- [x] `[ARCH, REV]` No implementation requires guessing method/path/parameter names.

## Sprint 2: API Readiness and Risk Report

Goal: assess how agent- and connector-friendly the LunchMoney V2 contract is.

- [x] `[ARA]` Apply the `postman-api-readiness` 8-pillar framework to the LunchMoney V2 spec/collection.
- [x] `[ARA, DOCS]` Create `docs/lunchmoney-api-readiness.md`.
- [x] `[ARA]` Score metadata: operation IDs, summaries, descriptions, tags.
- [x] `[ARA]` Score errors: 4xx, 5xx, 429, schemas, retry guidance.
- [x] `[ARA]` Score introspection: parameter types, required fields, enums, examples.
- [x] `[ARA]` Score naming: path style, method semantics, naming consistency.
- [x] `[ARA]` Score predictability: response schemas, envelopes, pagination, dates, nullability.
- [x] `[ARA]` Score documentation: auth, rate limits, overview, links, contact.
- [x] `[ARA]` Score performance: rate-limit headers, cache headers, bulk support, async patterns.
- [x] `[ARA]` Score discoverability: OpenAPI version, server URLs, versioning, health checks.
- [x] `[ARA, ARCH, SEC]` List the top connector-impacting gaps.
- [x] `[ARA, ARCH, SEC]` Add a connector mitigation for each high-impact gap.

Exit criteria:

- [x] `[ARA, REV]` Readiness score is documented.
- [x] `[ARA, ARCH, REV]` Connector implementation risks are documented.
- [x] `[ARA, REV]` The report distinguishes LunchMoney API limitations from connector responsibilities.

## Sprint 3: Credentials and Core HTTP Layer

Goal: implement safe authentication and shared request behavior.

- [x] `[IMPL, ARCH]` Create `LunchMoneyApi.credentials.ts`.
- [x] `[IMPL, SEC]` Add required secret `apiKey` field.
- [x] `[IMPL, ARCH]` Add advanced `baseUrl` field defaulting to `https://api.lunchmoney.dev/v2`.
- [x] `[IMPL, ARCH]` Implement bearer auth using n8n credential helpers.
- [x] `[IMPL, TEST]` Add credential test using `GET /me`.
- [x] `[IMPL, ARCH]` Create shared request helper.
- [x] `[IMPL, ARCH]` Create shared pagination helper.
- [x] `[IMPL, SEC]` Create shared API error normalization helper.
- [x] `[IMPL, SEC]` Ensure errors redact `Authorization` and request bodies by default.
- [x] `[TEST, IMPL]` Add unit tests for credential field shape.
- [x] `[TEST, IMPL, SEC]` Add unit tests for auth header behavior through mocks.
- [x] `[TEST, SEC]` Add unit tests for safe error redaction.

Exit criteria:

- [x] `[TEST, REV]` Credential test works against mock/test base URL.
- [x] `[SEC, REV]` Core helper can make authenticated requests without exposing secrets.
- [x] `[TEST, REV]` Unit tests cover auth and error redaction.

## Sprint 4: Minimal Node Skeleton

Goal: create a usable n8n node shell with the first safe operation.

- [x] `[IMPL, ARCH]` Create `LunchMoney.node.ts`.
- [x] `[IMPL, ARCH]` Add resource selector.
- [x] `[IMPL, ARCH]` Add operation selector.
- [x] `[IMPL, TEST]` Add `User > Get current user`.
- [x] `[IMPL, ARCH]` Wire node execution through the shared request helper.
- [x] `[IMPL, ARCH]` Return n8n items in standard shape.
- [x] `[TEST, IMPL]` Add unit test for `User > Get current user`.
- [x] `[DOCS, SEC]` Add README section for credential setup.
- [x] `[DOCS, TEST]` Add local n8n smoke-test instructions.

Exit criteria:

- [x] `[TEST, REV]` Node appears in local n8n.
- [x] `[TEST, REV]` Credential can be selected.
- [x] `[TEST, REV]` `User > Get current user` runs against mock/test environment.

## Sprint 5: Read-Only Reference Resources

Goal: implement low-risk read operations that are useful in most workflows.

- [x] `[IMPL, TEST]` Implement `Categories > Get many`.
- [x] `[IMPL, TEST]` Implement `Categories > Get`.
- [x] `[IMPL, TEST]` Implement `Tags > Get many`.
- [x] `[IMPL, TEST]` Implement `Tags > Get`.
- [x] `[IMPL, TEST]` Implement `Manual Accounts > Get many`.
- [x] `[IMPL, TEST]` Implement `Manual Accounts > Get`.
- [x] `[IMPL, TEST]` Implement `Plaid Accounts > Get many`.
- [x] `[IMPL, TEST]` Implement `Plaid Accounts > Get`.
- [x] `[IMPL, TEST]` Implement `Recurring Items > Get many`.
- [x] `[IMPL, TEST]` Implement `Recurring Items > Get`.
- [x] `[IMPL, TEST]` Implement `Budgets > Get settings`.
- [x] `[IMPL, TEST]` Implement `Summary > Get`.
- [x] `[IMPL, ARCH]` Add `Return All` and `Limit` where list endpoints support them.
- [x] `[TEST, IMPL]` Add unit tests for each operation's request construction.
- [x] `[TEST, SEC]` Add fake response fixtures for each resource.

Exit criteria:

- [x] `[TEST, REV]` All read-only reference operations pass unit tests.
- [x] `[ARCH, REV]` List operations output one item per entity where possible.
- [x] `[SEC, REV]` No test fixture contains real account or transaction data.

## Sprint 6: Transactions Read Support

Goal: implement transaction reads carefully because this is the highest-value and highest-sensitivity data path.

- [x] `[IMPL, TEST]` Implement `Transactions > Get many`.
- [x] `[IMPL, TEST]` Implement `Transactions > Get`.
- [x] `[IMPL, PCA, ARCH]` Add supported transaction filters from the Postman contract.
- [x] `[IMPL, ARCH, TEST]` Add pagination behavior for transaction list.
- [x] `[IMPL, ARCH]` Add `Return All` and `Limit`.
- [x] `[TEST, SEC]` Add fake transaction fixtures.
- [x] `[TEST, IMPL]` Add tests for date filters.
- [x] `[TEST, IMPL]` Add tests for pagination.
- [x] `[TEST, IMPL]` Add tests for one-item-per-transaction output.
- [x] `[DOCS, SEC]` Add README warning that transaction outputs may contain sensitive financial data.

Exit criteria:

- [x] `[TEST, REV]` Transaction reads work against mock/test environment.
- [x] `[TEST, REV]` Pagination and limit behavior are covered by tests.
- [x] `[SEC, REV]` No real transaction data appears in fixtures, docs, or logs.

## Sprint 7: Safe Create and Update Operations

Goal: add non-destructive write operations with deterministic request bodies.

- [x] `[IMPL, TEST]` Implement `Categories > Create`.
- [x] `[IMPL, TEST]` Implement `Categories > Update`.
- [x] `[IMPL, TEST]` Implement `Manual Accounts > Create`.
- [x] `[IMPL, TEST]` Implement `Manual Accounts > Update`.
- [x] `[IMPL, TEST]` Implement `Plaid Accounts > Trigger fetch`.
- [x] `[IMPL, TEST]` Implement `Tags > Create`.
- [x] `[IMPL, TEST]` Implement `Tags > Update`.
- [x] `[IMPL, TEST]` Implement `Budgets > Upsert`.
- [x] `[IMPL, TEST, SEC]` Implement `Transactions > Insert one or more`.
- [x] `[IMPL, TEST, SEC]` Implement `Transactions > Update`.
- [x] `[IMPL, TEST, SEC]` Implement `Transactions > Update many`.
- [x] `[IMPL, ARCH, TEST]` Add validation for required fields.
- [x] `[IMPL, TEST, SEC]` Add duplicate ID checks where applicable.
- [x] `[IMPL, SEC, TEST]` Add conservative bulk item limit for multi-transaction writes.
- [x] `[TEST, IMPL]` Add unit tests for each request body.
- [x] `[TEST, IMPL]` Add unit tests for invalid input.

Exit criteria:

- [x] `[TEST, REV]` Write operations produce contract-correct requests.
- [x] `[TEST, REV]` Invalid inputs fail before API calls.
- [x] `[SEC, REV]` Bulk operations have guards.
- [x] `[SEC, REV]` No live production writes are performed.

## Sprint 8: Destructive Operations and Guardrails

Goal: add delete/destructive behavior only with explicit user intent.

- [x] `[IMPL, SEC, ARCH]` Add reusable `confirmDestructiveOperation` field helper.
- [x] `[IMPL, TEST, SEC]` Implement `Categories > Delete`.
- [x] `[IMPL, TEST, SEC]` Implement `Manual Accounts > Delete`.
- [x] `[IMPL, TEST, SEC]` Implement `Tags > Delete`.
- [x] `[IMPL, TEST, SEC]` Implement `Budgets > Delete`.
- [x] `[IMPL, TEST, SEC]` Implement `Transactions > Delete`.
- [x] `[IMPL, TEST, SEC]` Implement `Transactions > Bulk delete`.
- [x] `[IMPL, TEST, SEC]` Add empty-list guard for bulk delete.
- [x] `[IMPL, TEST, SEC]` Add duplicate ID guard for bulk delete.
- [x] `[IMPL, TEST, SEC]` Add max-count guard for bulk delete.
- [x] `[TEST, SEC]` Add tests proving destructive operations fail without confirmation.
- [x] `[TEST, SEC]` Add tests proving destructive operations pass with confirmation.
- [x] `[DOCS, SEC]` Add README destructive-operation safety section.

Exit criteria:

- [x] `[SEC, REV]` Every destructive operation requires explicit confirmation.
- [x] `[TEST, REV]` Bulk delete cannot run with empty or malformed input.
- [x] `[TEST, REV]` Tests cover both refused and allowed paths.

## Sprint 9: Advanced Transaction Operations

Goal: add transaction grouping and split support after core behavior is stable.

- [x] `[IMPL, TEST]` Implement `Transactions > Create group`.
- [x] `[IMPL, TEST, SEC]` Implement `Transactions > Delete group`.
- [x] `[IMPL, TEST]` Implement `Transactions > Split`.
- [x] `[IMPL, TEST, SEC]` Implement `Transactions > Unsplit`.
- [x] `[PCA, IMPL, TEST]` Confirm request/response behavior against Postman contract.
- [x] `[IMPL, TEST]` Add required-field validation.
- [x] `[IMPL, SEC]` Add destructive confirmation where appropriate.
- [x] `[TEST, SEC]` Add fake fixtures and unit tests.
- [x] `[DOCS, ARCH]` Document output shapes.

Exit criteria:

- [x] `[TEST, REV]` Advanced transaction operations pass unit tests.
- [x] `[DOCS, REV]` Split/group behavior is documented.
- [x] `[SEC, REV]` Destructive/irreversible paths are guarded.

## Sprint 10: Attachments

Goal: support transaction file attachments only after core financial operations are stable.

- [x] `[PCA, ARCH]` Re-check Postman contract for attachment upload and download URL behavior.
- [x] `[IMPL, TEST]` Implement `Transactions > Attach file`.
- [x] `[IMPL, TEST]` Implement `Transactions > Get attachment URL`.
- [x] `[IMPL, TEST, SEC]` Implement `Transactions > Delete attachment`.
- [x] `[IMPL, ARCH, TEST]` Add n8n binary-data handling.
- [x] `[TEST, SEC]` Add synthetic file fixtures only.
- [x] `[TEST, IMPL]` Add tests for binary input validation.
- [x] `[IMPL, SEC]` Add destructive confirmation for attachment delete.
- [x] `[DOCS, SEC]` Add README notes warning against committing receipts or real financial files.

Exit criteria:

- [x] `[TEST, REV]` Attachment operations work with synthetic files.
- [x] `[SEC, REV]` No real receipt/document data is used.
- [x] `[DOCS, REV]` Binary behavior is documented.

## Sprint 11: Custom API Call

Goal: provide a safe escape hatch for V2 alpha changes without encouraging unsafe arbitrary HTTP calls.

- [x] `[IMPL, ARCH, SEC]` Implement `Custom API Call`.
- [x] `[IMPL, ARCH]` Add method selector.
- [x] `[IMPL, ARCH]` Add endpoint path field.
- [x] `[IMPL, ARCH]` Add query parameter collection.
- [x] `[IMPL, ARCH]` Add JSON body input.
- [x] `[IMPL, SEC]` Use LunchMoney credential and configured base URL.
- [x] `[IMPL, SEC]` Block full external URLs by default.
- [x] `[IMPL, SEC, TEST]` Validate endpoint path starts with `/`.
- [x] `[TEST, SEC]` Add tests for safe path validation.
- [x] `[TEST, SEC]` Add tests that external URLs are rejected.
- [x] `[DOCS, SEC]` Document appropriate use cases.

Exit criteria:

- [x] `[TEST, REV]` Custom call can hit LunchMoney paths.
- [x] `[SEC, REV]` Custom call cannot silently send credentials to arbitrary external hosts.
- [x] `[TEST, REV]` Tests cover path safety.

## Sprint 12: Local n8n Smoke Testing

Goal: verify the connector in a real n8n install without production data.

- [x] `[TEST, REL]` Install package in a clean local n8n environment.
- [x] `[TEST, SEC]` Create mock credential.
- [x] `[TEST]` Run `User > Get current user`.
- [x] `[TEST]` Run category/tag/account list operations.
- [x] `[TEST, SEC]` Run transaction list against mock/test data.
- [x] `[TEST, ARCH]` Confirm output shapes in n8n UI.
- [x] `[TEST, SEC]` Confirm destructive operations refuse to run without confirmation.
- [x] `[DOCS, TEST]` Create smoke-test notes in `docs/local-smoke-test.md`.
- [x] `[TEST, PL]` Record any n8n UX issues as follow-up tasks.

Follow-up tasks:

- [x] `[TEST, ARCH, PL]` Re-run stored execution output inspection in the n8n UI when browser automation is available.
- [x] `[DOCS, UX, PL]` Document the `<N8N_USER_FOLDER>/.n8n/nodes` community-package install path.
- [x] `[TEST, UX, PL]` Review missing accessible labels on LunchMoney credential fields in n8n.

Exit criteria:

- [x] `[TEST, REV]` Local n8n can load the node.
- [x] `[TEST, REV]` Read operations work in the UI.
- [x] `[SEC, REV]` Destructive safeguards are visible and effective.

## Sprint 13: Example Workflows and Documentation

Goal: make the connector understandable and useful to users.

- [x] `[DOCS, REL]` Expand README installation instructions.
- [x] `[DOCS, SEC]` Add credential setup guide.
- [x] `[DOCS, ARCH]` Add supported operations table.
- [x] `[DOCS, SEC]` Add mock/test/prod environment guidance.
- [x] `[DOCS, PCA]` Add alpha API compatibility note.
- [x] `[DOCS, SEC]` Add privacy and data-protection guidance.
- [x] `[DOCS, TEST]` Add troubleshooting section.
- [x] `[DOCS, TEST, SEC]` Create example workflow: monthly transaction export.
- [x] `[DOCS, TEST, SEC]` Create example workflow: uncategorized transaction monitor.
- [x] `[DOCS, TEST]` Create example workflow: category/tag sync.
- [x] `[DOCS, TEST]` Create example workflow: budget summary report.
- [x] `[DOCS, TEST, SEC]` Create example workflow: new transaction ingest.
- [x] `[TEST, DOCS]` Validate example workflows with n8n validation tooling where available.

Exit criteria:

- [x] `[DOCS, REV]` README is useful without reading source code.
- [x] `[SEC, REV]` Example workflows use fake data only.
- [x] `[SEC, REV]` Workflows are inactive by default.
- [x] `[DOCS, REV]` Docs explain destructive operation behavior.

## Sprint 14: Release Hardening

Goal: prepare for a private alpha and later public npm release.

- [x] `[REL, TEST]` Run full lint.
- [x] `[REL, TEST]` Run full typecheck.
- [x] `[REL, TEST]` Run full unit test suite.
- [x] `[TEST, REL]` Run local n8n smoke test.
- [x] `[SEC, REV]` Run secret scan.
- [x] `[REL]` Run `npm pack`.
- [x] `[REL, SEC]` Inspect package tarball contents.
- [x] `[SEC, REL]` Confirm no `.env`, logs, screenshots, real fixtures, or credentials are included.
- [x] `[REL, ARCH]` Confirm runtime dependencies are absent or justified.
- [x] `[REL, DOCS]` Add changelog.
- [x] `[REL]` Add npm provenance publish workflow.

Exit criteria:

- [x] `[REL, SEC, REV]` Package is safe to publish as alpha.
- [x] `[REL, SEC, REV]` Package tarball contains only intended files.
- [x] `[REL, REV]` GitHub Actions can build the package.

## Sprint 15: Alpha Release and Verification Prep

Goal: publish safely and prepare for n8n verification.

- [ ] `[REL, PL]` Configure temporary `NPM_TOKEN` GitHub Actions secret for the initial publish.
- [ ] `[REL, PL]` Publish `0.1.0-alpha.0` via GitHub Actions.
- [ ] `[REL, PL]` Configure npm trusted publisher after the package exists on npm.
- [ ] `[REL, PL]` Remove the GitHub Actions `NPM_TOKEN` secret and revoke the temporary npm token.
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

- [x] `[SEC, REV]` Never commit real LunchMoney tokens.
- [x] `[SEC, REV]` Never commit Postman API keys.
- [x] `[SEC, REV]` Never commit real transaction/account/category/tag/budget data.
- [x] `[SEC, REV]` Never commit real receipt or attachment files.
- [x] `[DOCS, TEST, SEC]` Keep all examples synthetic.
- [x] `[TEST, SEC]` Keep live integration tests local-only and opt-in.
- [x] `[SEC, PL]` Do not run production API calls without explicit confirmation.
- [x] `[SEC, PL]` Do not activate n8n workflows without explicit confirmation.
- [x] `[REL, PL]` Do not publish npm packages without explicit confirmation.
- [x] `[PCA, SEC, PL]` Do not publish Postman documentation or mocks without explicit confirmation.

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
