# LunchMoney V2 Endpoint Matrix

Source of truth:

- Postman workspace: `lunchmoney`
- Collection UID: `20003406-32183fec-84c3-4cc5-a741-e7fa74702ef6`
- Spec ID: `477f3074-d947-4d31-bb4d-985003471532`
- API base URL: `https://api.lunchmoney.dev/v2`

Status: pending extraction from Postman MCP.

## Classification Legend

- `read`: does not mutate LunchMoney data
- `write`: creates or updates LunchMoney data
- `bulk`: accepts or affects multiple records
- `destructive`: deletes, unsplits, ungroups, or otherwise removes/irreversibly changes data
- `binary`: uploads/downloads files or uses n8n binary data
- `v1`: planned for first full connector release
- `v1.1`: planned after core operations are stable
- `deferred`: intentionally postponed

## Endpoint Matrix

| Resource | Operation | Method | Path | Params | Body | Response | Pagination | Class | Release | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| me | Get current user | TBD | TBD | TBD | TBD | TBD | No | read | v1 | Extract from Postman |
| summary | Get summary | TBD | TBD | TBD | TBD | TBD | TBD | read | v1 | Extract from Postman |
| categories | Get all categories | TBD | TBD | TBD | TBD | TBD | TBD | read | v1 | Extract from Postman |
| categories | Get a single category | TBD | TBD | TBD | TBD | TBD | No | read | v1 | Extract from Postman |
| categories | Create category or category group | TBD | TBD | TBD | TBD | TBD | No | write | v1 | Extract from Postman |
| categories | Update category or category group | TBD | TBD | TBD | TBD | TBD | No | write | v1 | Extract from Postman |
| categories | Delete category or category group | TBD | TBD | TBD | TBD | TBD | No | destructive | v1 | Requires confirmation |
| manual_accounts | Get all manual accounts | TBD | TBD | TBD | TBD | TBD | TBD | read | v1 | Extract from Postman |
| manual_accounts | Get a single manual account | TBD | TBD | TBD | TBD | TBD | No | read | v1 | Extract from Postman |
| manual_accounts | Create manual account | TBD | TBD | TBD | TBD | TBD | No | write | v1 | Extract from Postman |
| manual_accounts | Update manual account | TBD | TBD | TBD | TBD | TBD | No | write | v1 | Extract from Postman |
| manual_accounts | Delete manual account | TBD | TBD | TBD | TBD | TBD | No | destructive | v1 | Requires confirmation |
| plaid_accounts | Get all Plaid accounts | TBD | TBD | TBD | TBD | TBD | TBD | read | v1 | Extract from Postman |
| plaid_accounts | Get a single Plaid account | TBD | TBD | TBD | TBD | TBD | No | read | v1 | Extract from Postman |
| plaid_accounts | Trigger fetch from Plaid | TBD | TBD | TBD | TBD | TBD | No | write | v1 | Extract from Postman |
| transactions | Get all transactions | TBD | TBD | TBD | TBD | TBD | TBD | read | v1 | High-sensitivity output |
| transactions | Get a single transaction | TBD | TBD | TBD | TBD | TBD | No | read | v1 | High-sensitivity output |
| transactions | Insert one or more transactions | TBD | TBD | TBD | TBD | TBD | No | write bulk | v1 | Guard with validation |
| transactions | Update transaction | TBD | TBD | TBD | TBD | TBD | No | write | v1 | Guard with validation |
| transactions | Update multiple transactions | TBD | TBD | TBD | TBD | TBD | No | write bulk | v1 | Guard with max-count |
| transactions | Delete transaction | TBD | TBD | TBD | TBD | TBD | No | destructive | v1 | Requires confirmation |
| transactions | Bulk delete transactions | TBD | TBD | TBD | TBD | TBD | No | destructive bulk | v1 | Requires confirmation and max-count |
| transactions | Create transaction group | TBD | TBD | TBD | TBD | TBD | No | write | v1.1 | Extract from Postman |
| transactions | Delete transaction group | TBD | TBD | TBD | TBD | TBD | No | destructive | v1.1 | Requires confirmation |
| transactions | Split transaction | TBD | TBD | TBD | TBD | TBD | No | write | v1.1 | Extract from Postman |
| transactions | Unsplit transaction | TBD | TBD | TBD | TBD | TBD | No | destructive | v1.1 | Requires confirmation |
| transactions | Attach file | TBD | TBD | TBD | TBD | TBD | No | binary write | deferred | Build after core operations |
| transactions | Get attachment URL | TBD | TBD | TBD | TBD | TBD | No | binary read | deferred | Build after core operations |
| transactions | Delete attachment | TBD | TBD | TBD | TBD | TBD | No | binary destructive | deferred | Requires confirmation |
| tags | Get all tags | TBD | TBD | TBD | TBD | TBD | TBD | read | v1 | Extract from Postman |
| tags | Get a single tag | TBD | TBD | TBD | TBD | TBD | No | read | v1 | Extract from Postman |
| tags | Create tag | TBD | TBD | TBD | TBD | TBD | No | write | v1 | Extract from Postman |
| tags | Update tag | TBD | TBD | TBD | TBD | TBD | No | write | v1 | Extract from Postman |
| tags | Delete tag | TBD | TBD | TBD | TBD | TBD | No | destructive | v1 | Requires confirmation |
| recurring_items | Get all recurring items | TBD | TBD | TBD | TBD | TBD | TBD | read | v1 | Extract from Postman |
| recurring_items | Get a single recurring item | TBD | TBD | TBD | TBD | TBD | No | read | v1 | Extract from Postman |
| budgets | Get budget settings | TBD | TBD | TBD | TBD | TBD | No | read | v1 | Extract from Postman |
| budgets | Upsert budget | TBD | TBD | TBD | TBD | TBD | No | write | v1 | Guard with validation |
| budgets | Delete budget | TBD | TBD | TBD | TBD | TBD | No | destructive | v1 | Requires confirmation |

## Open Contract Questions

- Does the API provide rate-limit headers and retry guidance?
- Which list endpoints paginate, and what fields indicate next page or `has_more`?
- Are transaction insert/update operations idempotent?
- Are API tokens budget-scoped or account-wide?
- Which response fields may be nullable but are not marked nullable in the spec?

