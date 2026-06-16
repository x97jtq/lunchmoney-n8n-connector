# Release Checklist

Package: `n8n-nodes-lunchmoney`

Status: scaffold-ready only. Do not publish until implementation, smoke testing, and explicit release approval are complete.

## Metadata

- [x] Package name is `n8n-nodes-lunchmoney`.
- [x] Keyword `n8n-community-node-package` is present.
- [x] `package.json` includes `n8n.credentials`.
- [x] `package.json` includes `n8n.nodes`.
- [x] Package is public-scoped with provenance enabled in `publishConfig`.
- [x] Runtime package contents are restricted with `files`.

## Local Verification

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run build`
- [x] `npm pack`
- [x] Fresh `npm ci`
- [x] Full `npm run prepack` after fresh install
- [x] Targeted secret-pattern scan
- [ ] Local n8n smoke test
- [ ] Clean install from packed tarball into local n8n

## CI and Publish

- [x] CI workflow runs install, lint, typecheck, tests, build, and pack dry-run.
- [x] Publish workflow is manual-only.
- [x] Publish workflow requires `confirm_publish` input set to `PUBLISH`.
- [x] Publish workflow requests `id-token: write` for npm provenance/trusted publishing.
- [x] Publish workflow supports `NPM_TOKEN` fallback through the `npm` environment.

## Package Inspection Notes

Last inspected package: `n8n-nodes-lunchmoney-0.1.0-alpha.0.tgz`

Expected files:

- `LICENSE`
- `README.md`
- `package.json`
- `dist/credentials/LunchMoneyApi.credentials.js`
- `dist/credentials/LunchMoneyApi.credentials.d.ts`
- `dist/credentials/LunchMoneyApi.credentials.js.map`
- `dist/nodes/LunchMoney/LunchMoney.node.js`
- `dist/nodes/LunchMoney/LunchMoney.node.d.ts`
- `dist/nodes/LunchMoney/LunchMoney.node.js.map`
- `dist/nodes/LunchMoney/lunchmoney.svg`

Excluded from package:

- `.env` and `.env.example`
- `.github/`
- `docs/`
- `test/`
- source TypeScript files
- `node_modules/`
- local npm cache
- logs and coverage

Secret scan result: no real tokens, credentials, API keys, account data, transaction data, receipt files, or credential IDs were found. Expected safe matches remain in docs and source for placeholder terms such as `apiKey`, `Authorization`, and `token`.

## Release Blockers

- Node implementation is still minimal and has not been smoke-tested in n8n.
- Postman endpoint matrix still contains `TBD` entries.
- API readiness report is still pending.
- npm audit reports no production vulnerabilities with `npm audit --omit=dev`, but full dev dependency audit currently reports transitive issues from tooling and should be reviewed before public release.
- Publishing requires explicit user confirmation.
