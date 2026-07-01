# Sprint 3 Test Plan

Scope: credentials and core HTTP layer only.

## Unit Test Plan

- Credential field shape: assert credential identity, required secret API key field, password masking, advanced base URL default, and test request shape.
- Auth behavior through mocks: assert requests use `httpRequestWithAuthentication` with the `lunchMoneyApi` credential name and do not manually place bearer tokens in request options.
- Safe error redaction: assert normalized errors redact `Authorization` and `authorization` headers, omit request bodies, and do not leak fake token or fake transaction data.

## Mock Fixtures

- `test/fixtures/lunchmoney.ts` contains only fake values:
  - `fakeLunchMoneyApiKey`
  - `fakeBaseUrl`
  - `fakeNode`
  - `fakeTransactionBody`

## Smoke-Test Checklist

- [ ] Run `npm test` locally with no `.env` file and no real LunchMoney credentials.
- [ ] Confirm Jest passes with fake fixtures only.
- [ ] Confirm no test performs live HTTP requests.
- [ ] Confirm no test requires `LUNCHMONEY_API_KEY` or n8n credential IDs.
- [ ] Confirm auth tests assert n8n credential-helper delegation, not raw bearer headers.
- [ ] Confirm redaction tests fail if fake token or fake transaction data appears in serialized errors.
- [ ] Keep any live integration test local-only and opt-in; do not add to CI without explicit approval.
