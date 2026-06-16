# n8n-nodes-lunchmoney

An n8n community node for the LunchMoney V2 API.

Status: planning and scaffold preparation. The connector is not ready for production use yet.

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

## Development Sources

- Postman workspace: `lunchmoney`
- Collection UID: `20003406-32183fec-84c3-4cc5-a741-e7fa74702ef6`
- Spec ID: `477f3074-d947-4d31-bb4d-985003471532`
- API base URL: `https://api.lunchmoney.dev/v2`
- Auth: Bearer token

## Project Docs

- [Implementation Plan](docs/implementation-plan.md)
- [Endpoint Matrix](docs/lunchmoney-endpoint-matrix.md)
- [API Readiness Report](docs/lunchmoney-api-readiness.md)
- [Task Backlog](tasks.md)

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

