# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0-alpha.0] - Unreleased

### Added

- Initial LunchMoney V2 n8n community node package.
- Bearer-token credential with configurable base URL for mock and test environments.
- LunchMoney resources and operations backed by shared request, pagination, and error helpers.
- Confirmation and validation guardrails for destructive and bulk operations.
- Unit tests using synthetic data and local mock-only n8n smoke coverage.
- GitHub Actions verification and manually gated npm provenance publishing workflow.

### Security

- Authorization values and sensitive request data are excluded from committed fixtures and release artifacts.
- Live LunchMoney integration remains local-only and opt-in.
