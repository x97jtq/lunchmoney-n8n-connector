# LunchMoney V2 Endpoint Matrix

Source of truth:

- Postman workspace: `lunchmoney`
- Collection: `Lunch Money API - v2`
- Collection UID: `20003406-32183fec-84c3-4cc5-a741-e7fa74702ef6`
- OpenAPI spec: `Lunch Money API - v2`
- Spec ID: `477f3074-d947-4d31-bb4d-985003471532`
- API base URL: `https://api.lunchmoney.dev/v2`
- Static mock base URL: `https://mock.lunchmoney.dev/v2`
- Auth: collection-level Bearer token using `{{bearerToken}}`
- Extraction date: 2026-06-16

No live LunchMoney API calls were run for this extraction. The matrix is based on Postman MCP reads of workspace metadata, the lightweight collection map, targeted collection requests, targeted saved success responses, and the OpenAPI spec metadata.

## Classification Legend

- `read`: does not mutate LunchMoney data
- `write`: creates, updates, queues, groups, splits, or otherwise changes data
- `bulk`: accepts or affects multiple records
- `destructive`: deletes, unsplits, ungroups, or otherwise removes/irreversibly changes data
- `binary/file`: uploads files, returns signed file URLs, or deletes attachments
- `v1`: planned for first full connector release
- `v1.1`: planned after core operations are stable
- `deferred`: intentionally postponed

## Endpoint Matrix

| Resource | Operation | Method | Path | Params | Body | Success response | Pagination | Class | Release | Mock-safe | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| me | Get current user | GET | `/me` | None | None | `200` user object | No | read | v1 | Yes | High-sensitivity identity/account metadata; do not log response bodies. |
| summary | Get summary | GET | `/summary` | Query: `start_date`, `end_date`, `include_exclude_from_budgets`, `include_occurrences`, `include_past_budget_dates`, `include_totals`, `include_rollover_pool` | None | `200` budget summary object with `categories` and optional totals/occurrences | No explicit pagination | read | v1 | Yes | `start_date` and `end_date` operate as a pair. |
| categories | Get all categories | GET | `/categories` | Query: `format`, `is_group` | None | `200` `{ categories: [...] }` | No | read | v1 | Yes | `format` may be ignored when `is_group` is set. |
| categories | Get a single category | GET | `/categories/{id}` | Path: `id` | None | `201` category object in saved example; likely should be `200` for a read | No | read | v1 | Yes | Contract ambiguity: saved response code says `201 Created` for a GET. Confirm against spec/client behavior before implementation tests. |
| categories | Create category or category group | POST | `/categories` | None | JSON category/group fields: `name`, `description`, `is_income`, `exclude_from_budget`, `exclude_from_totals`, `is_group`, optional `children` | `201` category/group object | No | write | v1 | Mock only | Requires validation and explicit user intent. |
| categories | Update category or category group | PUT | `/categories/{id}` | Path: `id` | JSON partial category fields; system fields tolerated but ignored | `200` updated category/group object | No | write | v1 | Mock only | Cannot convert category to group or group to category. Updating `children` replaces the group children list. |
| categories | Delete category or category group | DELETE | `/categories/{id}` | Path: `id`; query: `force` | None | `204` no content | No | destructive | v1 | Mock only | Requires confirmation. `force=true` can delete despite dependencies. |
| manual_accounts | Get all manual accounts | GET | `/manual_accounts` | None | None | `200` `{ manual_accounts: [...] }` | No | read | v1 | Yes | High-sensitivity balances/account metadata; do not log response bodies. |
| manual_accounts | Get a single manual account | GET | `/manual_accounts/{id}` | Path: `id` | None | `200` manual account object | No | read | v1 | Yes | High-sensitivity balances/account metadata. |
| manual_accounts | Create manual account | POST | `/manual_accounts` | None | JSON account fields; required by spec: `name`, `type`, `balance`; optional currency, institution, subtype, status, metadata | `201` manual account object | No | write | v1 | Mock only | Requires validation; should default to synthetic/test budgets for integration tests. |
| manual_accounts | Update manual account | PUT | `/manual_accounts/{id}` | Path: `id` | JSON partial account fields; system fields tolerated but ignored | `200` updated manual account object | No | write | v1 | Mock only | Balance changes affect financial state. Require explicit user intent. |
| manual_accounts | Delete manual account | DELETE | `/manual_accounts/{id}` | Path: `id`; query: `delete_items`, `delete_balance_history` | None | `204` no content | No | destructive | v1 | Mock only | Requires confirmation. `delete_items=true` is irreversible and can delete transactions, rules, and recurring items. |
| plaid_accounts | Get all Plaid accounts | GET | `/plaid_accounts` | None | None | `200` `{ plaid_accounts: [...] }` | No | read | v1 | Yes | High-sensitivity institution/account metadata; do not log response bodies. |
| plaid_accounts | Get a single Plaid account | GET | `/plaid_accounts/{id}` | Path: `id` | None | `200` Plaid account object | No | read | v1 | Yes | High-sensitivity institution/account metadata. |
| plaid_accounts | Trigger fetch from Plaid | POST | `/plaid_accounts/fetch` | Query: `start_date`, `end_date`, `id` | None | `202` accepted, no body | No | write | v1.1 | Mock only | Queues a background import. Do not run live without explicit confirmation. May return `425 Too Early`. |
| transactions | Get all transactions | GET | `/transactions` | Query: `start_date`, `end_date`, `created_since`, `updated_since`, `manual_account_id`, `plaid_account_id`, `recurring_id`, `category_id`, `tag_id`, `is_group_parent`, `status`, `is_pending`, `include_pending`, `include_metadata`, `include_split_parents`, `include_group_children`, `include_children`, `include_files`, `limit`, `offset` | None | `200` `{ transactions: [...], has_more: boolean }` | Yes: `limit`, `offset`, `has_more` | read | v1 | Yes | Highest-sensitivity data. Default list operations should minimize date range/limit and avoid metadata/files unless requested. |
| transactions | Get a single transaction | GET | `/transactions/{id}` | Path: `id` | None | `200` transaction object | No | read | v1 | Yes | Single read includes metadata/files/children that list responses omit by default. |
| transactions | Insert one or more transactions | POST | `/transactions` | None | JSON `{ transactions: [...] }`; 1-500 transaction objects | `201` `{ transactions: [...], skipped_duplicates: [...] }` | No | write, bulk | v1 | Mock only | Guard with max count, validation, and duplicate/idempotency handling. |
| transactions | Update transaction | PUT | `/transactions/{id}` | Path: `id`; query: `update_balance` | JSON partial transaction fields | `201` updated transaction object in saved example | No | write | v1 | Mock only | Contract ambiguity: saved response uses `201 Created` for an update. Split/grouped transactions cannot be modified. |
| transactions | Update multiple transactions | PUT | `/transactions` | None | JSON `{ transactions: [...] }`; each object must include `id` plus an update field; 1-500 items | `200` `{ transactions: [...] }` | No | write, bulk | v1 | Mock only | Guard with max count and confirmation for broad updates. Split/grouped transactions cannot be modified. |
| transactions | Delete transaction | DELETE | `/transactions/{id}` | Path: `id` | None | `204` no content | No | destructive | v1 | Mock only | Requires confirmation. Fails for split/grouped transactions with guidance to unsplit or ungroup first. |
| transactions | Bulk delete transactions | DELETE | `/transactions` | None | JSON `{ ids: [...] }`; 1-500 IDs | `204` no content | No | destructive, bulk | v1 | Mock only | Requires confirmation and max-count guard. Fails for duplicate IDs, missing IDs, or split/grouped transaction constraints. |
| transactions | Create transaction group | POST | `/transactions/group` | None | JSON `{ ids: [...], payee, date }` | `201` grouped parent transaction with `children` | No | write | v1.1 | Mock only | Mutates visibility/state of child transactions; require explicit confirmation. |
| transactions | Delete transaction group | DELETE | `/transactions/group/{id}` | Path: `id` | None | `204` no content | No | destructive | v1.1 | Mock only | Ungroups original transactions without deleting them. Still state-changing; require confirmation. |
| transactions | Split transaction | POST | `/transactions/split/{id}` | Path: `id` | JSON `{ child_transactions: [...] }` | `201` split parent transaction with `children` | No | write | v1.1 | Mock only | Mutates transaction visibility/state; require explicit confirmation. |
| transactions | Unsplit transaction | DELETE | `/transactions/split/{id}` | Path: `id` | None | `204` no content | No | destructive | v1.1 | Mock only | Deletes split children and restores parent transaction. Require confirmation. |
| transactions | Attach file to transaction | POST | `/transactions/{transaction_id}/attachments` | Path: `transaction_id` | Multipart form-data: required `file` up to 10 MB, optional text `notes` | `201` file attachment metadata | No | write, binary/file | v1 | Mock only | Uses n8n binary input and synthetic fixtures only. Never commit receipt files. |
| transactions | Get attachment download URL | GET | `/transactions/attachments/{file_id}` | Path: `file_id` | None | `200` signed URL envelope with `url`, `expires_at` | No | read, binary/file | v1 | Mock only | Signed URLs are sensitive. Return/store only when explicitly requested; do not log or persist returned URLs. |
| transactions | Delete attachment | DELETE | `/transactions/attachments/{file_id}` | Path: `file_id` | None | `204` no content | No | destructive, binary/file | v1 | Mock only | Requires confirmation. |
| tags | Get all tags | GET | `/tags` | None | None | `200` `{ tags: [...] }` | No | read | v1 | Yes | Low-risk relative to transactions, but still user-specific metadata. |
| tags | Get a single tag | GET | `/tags/{id}` | Path: `id` | None | `200` tag object | No | read | v1 | Yes |  |
| tags | Create tag | POST | `/tags` | None | JSON tag fields; request example uses `name` | `201` tag object | No | write | v1 | Mock only | Require validation for name and optional display fields. |
| tags | Update tag | PUT | `/tags/{id}` | Path: `id` | JSON partial tag fields; system fields tolerated but ignored | `200` updated tag object | No | write | v1 | Mock only |  |
| tags | Delete tag | DELETE | `/tags/{id}` | Path: `id`; query: `force` | None | `204` no content | No | destructive | v1 | Mock only | Requires confirmation. `force=true` can delete despite transaction/rule dependencies. |
| recurring_items | Get all recurring items | GET | `/recurring_items` | Query: `start_date`, `end_date`, `include_suggested` | None | `200` recurring items object | No explicit pagination | read | v1 | Yes | `start_date` and `end_date` operate as a pair. Response shape appears nested as `recurring_items.recurring_items` in saved example. |
| recurring_items | Get a single recurring item | GET | `/recurring_items/{id}` | Path: `id`; query: `start_date`, `end_date` | None | `200` recurring item object | No | read | v1 | Yes | Saved response label incorrectly says tag object; request/shape indicate recurring item. |
| budgets | Get budget settings | GET | `/budgets/settings` | None | None | `200` budget settings object | No | read | v1 | Yes | Use before budget writes to validate period settings. |
| budgets | Upsert budget | PUT | `/budgets` | None | JSON: `start_date`, `category_id`, `amount`, optional `currency`, `notes` | `200` budget object | No | write | v1 | Mock only | `start_date` must match a valid budget period start. |
| budgets | Delete budget | DELETE | `/budgets` | Query: `category_id`, `start_date` | None | `204` no content | No | destructive | v1 | Mock only | Idempotent if no budget exists, but still destructive when one exists. Requires confirmation. |

## Endpoint Coverage Notes

- The lightweight collection map contains 39 request items; all 39 are represented in the matrix.
- Collection-level auth is Bearer token. Individual requests have `auth: null`, so they inherit collection auth.
- Collection variable `baseUrl` is `https://api.lunchmoney.dev/v2`; the OpenAPI spec also lists `https://mock.lunchmoney.dev/v2` for static mock use.
- No request-level pre-request scripts or test scripts were present in the targeted reads.
- Saved response examples are synthetic mock-style examples. They are useful for response-shape discovery but should not be copied into fixtures without sanitization and review.
- Static mock testing is safe for read behavior and schema parsing. For write/destructive/binary operations, use the mock only for request construction and response parsing; do not run against production without explicit user confirmation.

## Error Behavior

Common response examples across the collection include:

- `400` for invalid request body or validation failure.
- `401` for missing/invalid Bearer token.
- `404` for missing resources.
- `425` for Plaid fetch calls made too soon after a previous fetch.
- `429` for rate limiting.
- `500` for server errors.

Connector behavior should normalize these into n8n-friendly errors while preserving the API error payload in a sanitized way. Do not include tokens, signed URLs, receipt filenames, or full financial records in thrown messages or logs.

## Attachment Contract Re-check

Re-checked through targeted Postman MCP reads on 2026-06-17. No live LunchMoney API calls were run.

- Upload request: `POST /transactions/{transaction_id}/attachments` uses `multipart/form-data` with a required file part named `file` and an optional text part named `notes`. The Postman description says the file must be less than 10 MB. The saved success response is `201 Created` and returns file metadata including an attachment id, uploader id, original name, MIME type, size, notes, source, and creation timestamp.
- Download URL request: `GET /transactions/attachments/{file_id}` has no query/body fields. The saved success response is `200 OK` and returns a JSON envelope with a signed `url` and `expires_at`. Treat both fields as sensitive; do not log, snapshot, or persist them in test fixtures.
- Delete request: `DELETE /transactions/attachments/{file_id}` has no query/body fields. The saved success response is `204 No Content`. This remains destructive and requires explicit confirmation before any live execution.
- All three attachment requests inherit collection Bearer auth and had no request-level scripts in the targeted Postman reads.

## Contract Ambiguities and Questions

- `GET /categories/{id}` has a saved success response code of `201 Created`; a read endpoint likely should be `200 OK`.
- `PUT /transactions/{id}` has a saved success response code of `201 Created`; confirm whether production returns `201` or `200`.
- The `recurring_items` list saved response appears nested as `{ recurring_items: { recurring_items: [...] } }`; confirm whether this is intentional.
- The `GET /recurring_items/{id}` saved response label refers to a tag object even though the request and body are recurring-item shaped.
- Pagination is explicit only for `GET /transactions` via `limit`, `offset`, and `has_more`; confirm whether other list endpoints are intentionally unpaginated.
- The spec and collection include `cookieAuth` in addition to Bearer auth. The connector should use Bearer only unless LunchMoney documents cookie auth for API clients.
- Rate-limit response examples exist, but exact headers/retry guidance still need confirmation from public docs before implementing retry behavior.
- Transaction insert/update idempotency is not fully defined. `skipped_duplicates` and `external_id` behavior should drive duplicate handling, but connector operations should not assume all writes are idempotent.
- Attachment download returns signed URLs with an `expires_at` field. The contract still does not state whether the signed URL itself requires auth or whether the n8n operation should expose the URL, download into binary data, or support both modes.
