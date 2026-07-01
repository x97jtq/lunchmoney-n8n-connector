# n8n-nodes-lunchmoney

An n8n community node for the LunchMoney V2 API.

Status: alpha. The connector is not ready for unattended production use.

## Goals

- Provide a plug-and-play n8n node for LunchMoney V2.
- Build against the Postman LunchMoney V2 collection and OpenAPI spec.
- Protect production financial data during development.
- Use mock and test-budget data before any production use.
- Prepare the package for eventual public npm release and n8n community-node verification.

## Safety

Do not use a production LunchMoney token during development. Use the Postman mock server or a dedicated LunchMoney test budget with synthetic data.

Never commit:

- LunchMoney API tokens
- Postman API keys
- Real transactions
- Real account names
- Real category/tag/budget data
- Receipt or attachment files
- n8n credential IDs

## Transaction Data Warning

Transaction outputs can contain sensitive financial data, including merchant names, notes, amounts, dates, categories, tags, account references, and metadata returned by LunchMoney. Treat all transaction node output as private financial data.

Do not store real transaction output in fixtures, screenshots, examples, logs, exported workflows, issue reports, or documentation. Use mock responses or synthetic test-budget data when developing, testing, or reporting bugs.

## Attachment and Receipt File Safety

Receipt images, invoices, statements, and other transaction attachments can expose merchants, locations, account details, tax information, medical expenses, or other private financial context. Do not commit real receipt files or real financial documents to this repository, even temporarily.

Use synthetic files only for fixtures, examples, workflow exports, screenshots, smoke tests, and issue reports. Before staging or packaging a release, verify that no real receipts, statements, exported attachments, screenshots, or downloaded financial files are present in the repo or package contents.

## Destructive Operation Safety

Destructive operations can permanently remove or alter LunchMoney data. Examples include delete, bulk delete, unlink, merge, overwrite, and any update that cannot be cleanly reversed from the LunchMoney UI.

The connector requires **Confirm Destructive Operation** for category, tag, manual-account, and budget deletes and for transaction **Delete**, **Bulk Delete**, **Delete Group**, **Unsplit**, and **Delete Attachment**. If confirmation is disabled, the node stops with an error before sending the LunchMoney API request. Custom API Call uses a separate **Confirm Custom Write Operation** guard for `POST`, `PUT`, `PATCH`, and `DELETE`.

Confirmation is a last-step guard, not an undo feature. Once enabled, it remains part of the saved node configuration until disabled. Create, insert, update, upsert, split, group, attachment upload, and Plaid fetch operations can also change data but are not classified as destructive by this guard; review them with the same environment and payload checks.

Before adding, testing, documenting, or running a destructive operation:

- Use a mock server or a dedicated test budget with synthetic data.
- Confirm the workflow is inactive unless you are intentionally running a manual test.
- Confirm the credential points to the expected mock or test environment.
- Require an explicit confirmation field or equivalent guardrail in the node before the operation can run.
- Use fake IDs and fake payloads in examples, fixtures, logs, and issue reports.
- Do not run destructive operations against production data without explicit user confirmation for that specific run.

If a destructive operation fails, do not retry automatically until the target environment, request payload, and affected records have been reviewed.

## Custom API Call Safety

Custom API Call is a narrow escape hatch for LunchMoney V2 endpoints that are available in the API contract but not yet exposed as first-class node operations. Appropriate use cases include testing a new LunchMoney V2 alpha endpoint against a mock server, validating a documented query parameter before the connector adds a dedicated field, or unblocking a workflow while a typed operation is being planned.

Use only LunchMoney-relative endpoint paths such as `/me` or `/transactions`. Full URLs such as `https://example.invalid/path`, protocol-relative URLs such as `//example.invalid/path`, and paths without a leading `/` are rejected so the LunchMoney credential cannot be sent to arbitrary external hosts. Custom API Call requests using `POST`, `PUT`, `PATCH`, or `DELETE` require the custom write confirmation guard before they run.

Do not use Custom API Call to bypass destructive-operation guardrails, send credentials to third-party services, probe undocumented production endpoints, or store real financial payloads in workflow exports, logs, fixtures, screenshots, or issue reports. Prefer first-class operations whenever they exist because they include stronger validation, typed fields, and documented safety behavior.

## Output Shapes

All LunchMoney node operations return standard n8n items. Each item uses `json` output only. Attachment upload consumes n8n binary input from the configured binary property, but this connector does not currently emit downloaded binary data.

The connector preserves LunchMoney response field names and nesting. It does not rename snake_case fields, coerce IDs, flatten nested objects, or redact successful API responses. Treat transaction, account, budget, category, tag, and receipt-related fields as sensitive.

| Operation type | n8n output shape | Notes |
| --- | --- | --- |
| User `Get Current User` | One item containing the `/me` response object. | Output fields come directly from LunchMoney. |
| Single-record reads | One item containing the requested object or response envelope. | Applies to `Get` operations for categories, tags, manual accounts, Plaid accounts, recurring items, and transactions, plus budget settings and summary reads. |
| List reads | One item per returned object. | `Get Many` operations unwrap the relevant LunchMoney array, such as `categories`, `tags`, `manual_accounts`, `plaid_accounts`, `recurring_items`, or `transactions`. |
| Limited list reads | Up to `Limit` items. | When `Return All` is disabled, the node returns only the first page or first returned array slice up to `Limit`. |
| Return-all transaction reads | One item per transaction across fetched pages. | Transaction pagination follows LunchMoney's `has_more`, `limit`, and `offset` response behavior. |
| Create, update, upsert, fetch, group, split, and insert operations | One item containing the full LunchMoney response object. | Bulk operations return the API response envelope as-is; the connector does not synthesize success counters. |
| Delete, bulk delete, delete group, unsplit, and budget delete operations | One item containing the full LunchMoney response object. | Destructive operations require the confirmation guard before running. The success body is whatever LunchMoney returns. |
| Attachment upload | One item containing the LunchMoney attachment metadata response. | Reads the configured n8n binary property, sends it as multipart form-data field `file`, and optionally sends `notes`. Use synthetic files only in tests and examples. |
| Attachment URL read | One item containing the signed URL response envelope. | Signed URLs are sensitive. Do not log, persist, or commit returned attachment URLs. |
| Attachment delete | One item containing the full LunchMoney response object. | Requires the destructive confirmation guard before running. |

Errors are returned as n8n node errors. Error details redact authorization headers and avoid including request bodies by default.

## Development Sources

- Postman workspace: `lunchmoney`
- Collection UID: `20003406-32183fec-84c3-4cc5-a741-e7fa74702ef6`
- Spec ID: `477f3074-d947-4d31-bb4d-985003471532`
- API base URL: `https://api.lunchmoney.dev/v2`
- Auth: Bearer token

## Alpha API Compatibility

This package targets the LunchMoney V2 alpha API contract represented by the Postman collection and OpenAPI spec listed above. Alpha endpoints, request fields, response fields, and pagination behavior may change without a stable-version deprecation window. A connector release that works with one V2 alpha revision may require changes for a later revision.

Pin the connector version in production-like environments, test upgrades against mock or synthetic data, and review release notes before upgrading. Custom API Call does not guarantee compatibility with undocumented endpoints.

## Supported Operations

| Resource | Operations | Safety notes |
| --- | --- | --- |
| User | Get Current User | Read-only. |
| Category | Create, Delete, Get Many, Get, Update | Delete requires destructive confirmation. |
| Tag | Create, Delete, Get Many, Get, Update | Delete requires destructive confirmation. |
| Manual Account | Create, Delete, Get Many, Get, Update | Delete requires destructive confirmation. Account data is sensitive. |
| Plaid Account | Get Many, Get, Trigger Fetch | Fetch can initiate synchronization with a linked provider. |
| Recurring Item | Get Many, Get | Read-only. |
| Budget | Get Settings, Delete, Upsert | Delete requires destructive confirmation. |
| Summary | Get | Read-only; output can reveal financial totals. |
| Transaction | Get Many, Bulk Delete, Attach File, Create Group, Delete Group, Get, Get Attachment URL, Delete, Delete Attachment, Insert One or More, Split, Unsplit, Update, Update Many | Delete, bulk delete, delete group, unsplit, and delete attachment require destructive confirmation. Other writes can still alter financial data. |
| Custom API Call | Custom API Call | Relative LunchMoney paths only. `POST`, `PUT`, `PATCH`, and `DELETE` require write confirmation. |

## Environment Separation

Use separate n8n credentials and user folders for each environment. Never change only the credential name while leaving the same token or base URL underneath.

| Environment | Data and credential | Base URL | Intended use |
| --- | --- | --- | --- |
| Mock | Fake token and generated data only | Postman mock server URL | Documentation, examples, development, and automated tests. |
| Test | Dedicated LunchMoney test budget containing synthetic records only | `https://api.lunchmoney.dev/v2` | Manual integration and smoke tests after mock testing passes. This is a live API environment even though the data is synthetic. |
| Production | Production bearer token and real financial data | `https://api.lunchmoney.dev/v2` | Explicitly approved production workflows only. Do not use for connector development or examples. |

Before every manual execution, verify the selected credential, Base URL, workflow activation state, and target records. Never reuse exported execution data when moving a workflow between environments.

## Privacy and Data Protection

- Apply least privilege operationally: give workflow and n8n administration access only to people who need the financial data.
- Keep n8n encryption keys, user folders, database backups, execution logs, and credentials out of source control and shared support bundles.
- Disable or shorten successful execution-data retention for workflows handling real financial data, subject to your audit requirements.
- Redact transaction details, account identifiers, signed attachment URLs, credential names and IDs, and request payloads before sharing logs or bug reports.
- Do not pin real node output, embed it in workflow JSON, or use it in screenshots and examples.
- Send exports only to approved encrypted storage with appropriate retention and access controls.
- Rotate a LunchMoney token immediately if it may have appeared in a workflow export, log, terminal history, screenshot, issue, or commit.
- Review downstream nodes separately. This connector cannot protect data after another node sends, stores, or logs it.

## Project Docs

- [Implementation Plan](docs/implementation-plan.md)
- [Endpoint Matrix](docs/lunchmoney-endpoint-matrix.md)
- [API Readiness Report](docs/lunchmoney-api-readiness.md)
- [Task Backlog](tasks.md)

## Installation

This package is currently alpha. Do not install it into a production n8n instance until the exact release and LunchMoney V2 alpha compatibility have been reviewed.

### n8n Community Nodes UI

After the package is published to npm, an n8n administrator can install `n8n-nodes-lunchmoney` from **Settings > Community Nodes**. Follow the n8n instance's community-node policy, pin an approved version where supported, restart n8n if prompted, and confirm the **LunchMoney** node appears before importing examples.

### npm in the n8n user folder

For self-hosted n8n, install the package in `<N8N_USER_FOLDER>/.n8n/nodes` and restart n8n:

```powershell
$n8nUserFolder = "C:\path\to\disposable-n8n-user-folder"
$communityNodesFolder = Join-Path $n8nUserFolder ".n8n\nodes"
New-Item -ItemType Directory -Force $communityNodesFolder | Out-Null
Push-Location $communityNodesFolder
npm init -y
npm install n8n-nodes-lunchmoney@0.1.0-alpha.0 --save-exact
Pop-Location
```

Replace `<N8N_USER_FOLDER>` with the actual parent directory configured for n8n. For containers, install the package in the persistent user-folder volume and ensure the n8n process can read it.

### local repository tarball

For development, build a tarball with `npm ci` and `npm pack`, then install that tarball into a disposable user folder as shown in [Local n8n Smoke Test](#local-n8n-smoke-test). Do not use `npm link` for release verification because it does not reproduce packaged contents.

## Quick Start

1. Install the package using one of the methods above and restart n8n.
2. Create a **LunchMoney API** credential using a fake token and mock Base URL as described below.
3. Import an inactive workflow from [`examples/workflows`](examples/workflows), or create a workflow with **Manual Trigger** followed by **LunchMoney**.
4. Start with **User > Get Current User** or another read-only operation.
5. Confirm the workflow is inactive and the selected credential points to the mock environment.
6. Execute manually and verify that all returned data is synthetic before adding downstream nodes.

For operation names and output behavior, use [Supported Operations](#supported-operations) and [Output Shapes](#output-shapes). For failures, use [Troubleshooting](#troubleshooting); source-code inspection is not required for normal installation and use.

## Credential Setup

The node uses an n8n credential named `LunchMoney API`.

Credential fields:

- `API Key`: LunchMoney bearer token. During development, use only a fake token accepted by a mock server or a token for a dedicated test budget that contains synthetic data.
- `Base URL (Advanced)`: Defaults to `https://api.lunchmoney.dev/v2`. Override this for Postman mock servers or other dedicated test environments.

Safety rules:

- Do not paste a production LunchMoney token into local development n8n unless you have explicitly decided to run a live production test.
- Do not save real account names, transaction details, category/tag/budget names, receipt files, credential IDs, or exported workflow files in this repo.
- Treat n8n's local user folder as sensitive because it can contain encrypted credentials and execution data.
- Keep mock, test, and production credentials separate. Name them clearly, for example `LunchMoney Mock`, `LunchMoney Test Budget`, and `LunchMoney Production`.

To create a credential in n8n:

1. Open **Credentials**.
2. Create a new **LunchMoney API** credential.
3. Enter a fake/mock API key for mock testing.
4. Set **Base URL (Advanced)** to the mock server URL when testing against Postman mock data.
5. Use **Test credential** only after confirming the base URL points to a mock or test environment. The test request calls `GET /me`.

Never include credentials in an exported workflow. The example workflows intentionally contain no credential assignment; select a mock credential after import and inspect every node before execution.

## Example Workflows

Import examples from [`examples/workflows`](examples/workflows). Every workflow is inactive, contains no credential ID, and uses fixed fake values. Importing a workflow does not make it safe to execute: select a mock credential, inspect all expressions and destinations, and keep the workflow inactive until the target environment is confirmed.

| Example | File | Purpose |
| --- | --- | --- |
| Monthly transaction export | [`monthly-transaction-export.json`](examples/workflows/monthly-transaction-export.json) | Reads a fixed synthetic month and prepares CSV-shaped rows without sending them to external storage. |
| Uncategorized transaction monitor | [`uncategorized-transaction-monitor.json`](examples/workflows/uncategorized-transaction-monitor.json) | Reads transactions and filters records with no category. |
| Category/tag sync | [`category-tag-sync.json`](examples/workflows/category-tag-sync.json) | Reads category and tag reference data and combines it into a normalized stream; it performs no writes. |
| Budget summary report | [`budget-summary-report.json`](examples/workflows/budget-summary-report.json) | Reads the summary endpoint and prepares a compact report object. |
| New transaction ingest | [`new-transaction-ingest.json`](examples/workflows/new-transaction-ingest.json) | Builds one fake transaction for mock ingestion. The LunchMoney write node is disabled as an additional guard. |

Examples stop at transformed n8n output rather than email, cloud storage, or database nodes so users must make an explicit data-destination decision.

## Local n8n Smoke Test

Run this smoke test with mock or synthetic data only. Do not run it against a real LunchMoney budget unless you explicitly intend to make a live API call.

### Community-package install path

For a manual local installation, install the package inside `<N8N_USER_FOLDER>/.n8n/nodes`. `N8N_USER_FOLDER` is the parent directory that n8n uses for its `.n8n` data directory; it is not the `.n8n` directory itself. Create the `nodes` directory and initialize it as an npm project if it does not already exist:

```text
<N8N_USER_FOLDER>/.n8n/nodes
```

Keep local smoke-test packages and credentials in a disposable `N8N_USER_FOLDER`. Do not reuse a production n8n user folder or install this development package into a production n8n instance.

From the repository root:

```powershell
npm ci
npm pack
New-Item -ItemType Directory -Force local-n8n\.n8n\nodes | Out-Null
Push-Location local-n8n\.n8n\nodes
npm init -y
npm install ..\..\..\n8n-nodes-lunchmoney-0.1.0-alpha.0.tgz
Pop-Location
```

Start n8n with a disposable local user folder:

```powershell
$env:N8N_USER_FOLDER = "$(Get-Location)\local-n8n"
$env:N8N_PORT = "5679"
$env:N8N_SECURE_COOKIE = "false"
npx n8n start
```

Then verify the node manually:

1. Open `http://localhost:5679`.
2. Confirm the workflow is inactive.
3. Create a `LunchMoney API` credential using a mock/test key and a mock/test base URL.
4. Add a **Manual Trigger** node.
5. Add a **LunchMoney** node.
6. Configure **Resource** as `User` and **Operation** as `Get Current User`.
7. Execute manually only after confirming the credential does not point at production.
8. Verify the output contains only fake or synthetic user data.

After testing, stop n8n and delete `local-n8n/` if you no longer need the local credential database or execution history.

## Troubleshooting

| Symptom | Checks |
| --- | --- |
| LunchMoney node does not appear | Confirm the package is installed under `<N8N_USER_FOLDER>/.n8n/nodes`, restart n8n, check filesystem permissions, and inspect n8n startup logs for package-load errors. |
| Credential test returns 401 or 403 | Verify the token without printing it, confirm the credential and Base URL belong to the intended environment, and check that the mock server expects the supplied fake token. |
| Credential test calls the wrong host | Inspect **Base URL (Advanced)**. The production default is `https://api.lunchmoney.dev/v2`; mock testing requires an explicit mock URL. |
| No items are returned | Check date and status filters, `Return All`/`Limit`, and whether the selected mock fixture or synthetic test budget contains matching records. |
| A JSON field is rejected | Enter valid JSON with the shape required by the operation. Bulk transaction fields must be arrays and are capped at 100 items. Use fake values while diagnosing. |
| A destructive operation is blocked | This is expected until **Confirm Destructive Operation** is enabled. Re-check the environment and target IDs before enabling it; do not bypass the guard. |
| Custom API Call rejects a URL | Use a relative path beginning with `/`. External and protocol-relative URLs are intentionally blocked. |
| An example cannot execute | Install/build the community package, import the JSON, select a mock credential manually, and confirm the referenced node types are available in the installed n8n version. The ingest write node must also be deliberately enabled. |
| Sensitive data appeared in an execution or log | Stop sharing the artifact, restrict access, remove it according to your retention process, rotate any exposed token, and recreate the report with synthetic/redacted data. |

## Planned Package Shape

- Package name: `n8n-nodes-lunchmoney`
- Main node: `LunchMoney`
- Credential type: `LunchMoneyApi`
- Runtime dependencies: none unless later justified and compatible with n8n verification rules

## First Build Slice

1. Scaffold the community node package.
2. Extract the Postman endpoint matrix.
3. Run the API-readiness analysis.
4. Implement credentials and shared HTTP helper.
5. Implement read-only operations first.
6. Add write and destructive operations only after guardrails and tests are in place.
