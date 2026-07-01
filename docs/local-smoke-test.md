# Local n8n Smoke Test

Date: 2026-06-29

## Scope

- n8n `2.26.4` in a new `.smoke-n8n-sprint12` environment.
- Packed `n8n-nodes-lunchmoney@0.1.0-alpha.0` installed locally.
- Synthetic credential pointed at `http://127.0.0.1:4012/v2`.
- Local mock responses only. No production LunchMoney API calls or real financial data.
- Imported workflows remained inactive.

## Results

- Package loaded after installation under `<N8N_USER_FOLDER>/.n8n/nodes`.
- LunchMoney credential appeared in n8n and its `/me` connection test passed.
- `User > Get Current User` returned one flat n8n item.
- category, tag, manual-account, and Plaid-account list operations each returned one flat n8n item.
- transaction list returned one flat n8n item from synthetic mock data.
- Read workflow completed successfully in the n8n execution engine.
- Unconfirmed category deletion failed with `Confirm Destructive Operation must be enabled.`
- Destructive operations expose a required `Confirm Destructive Operation` toggle that defaults to off; metadata tests cover category, tag, manual-account, budget, transaction, group, split, and attachment deletion routes.
- Mock request log contained only GET requests; no destructive request reached the mock API.
- Prepack checks passed: lint, typecheck, build, and 107 unit tests.

## Output Shapes

Observed execution outputs were one item per returned object:

- User: `id`, `user_name`, `email`
- Category/tag/account: `id`, `name`
- Transaction: `id`, `payee`, `amount`, `date`

Visual inspection passed after rerunning the read workflow in the n8n UI. All six nodes displayed one item, and table columns matched the shapes listed above.

## UX Follow-ups

- Document that custom nodes for this setup must be installed under `<N8N_USER_FOLDER>/.n8n/nodes`; `<N8N_USER_FOLDER>/nodes` was not discovered.
- Visual output inspection completed on retry.
- Credential accessibility review confirmed both inputs lack an associated label, `id`, `name`, `aria-label`, and `aria-labelledby`. LunchMoney metadata provides `displayName`; follow-up belongs to the n8n credential-form renderer.

## Safety Checklist

- Mock base URL used: yes.
- Synthetic credential used: yes.
- Synthetic response data used: yes.
- Workflows activated or published: no.
- Production API calls: none.
- Destructive HTTP requests: none.
- Secrets or credential IDs recorded in this document: none.
