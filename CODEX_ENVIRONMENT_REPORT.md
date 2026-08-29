# Repository and Codex Cloud Readiness Report

This report records the limitations that remain after the repository-readiness
fixes in this change.

## Issues with the repo itself

- ESLint succeeds but reports 24 warnings. These include synchronous state
  updates in effects, unused declarations, a hook dependency warning, and an
  unsupported ARIA attribute. They should be addressed feature-by-feature and
  lint should eventually run with `--max-warnings=0` in CI.
- The E2E tests depend on a migrated and seeded PostgreSQL database, but the CI
  workflow currently runs only lint, unit tests, and build. A PostgreSQL service,
  migration/seed step, Playwright browser installation, and E2E job are still
  needed for integration coverage.
- The E2E comparison test only checks the not-found state for fake profile IDs;
  it does not create two profiles or verify the alignment and topic breakdown
  described by its test name.
- Google OAuth cannot be exercised without developer-owned credentials. The
  repository documents this now, but it has no mocked OAuth integration test.

## Issues with the configuration of the Codex cloud environment

- Docker is not installed, so the repository's PostgreSQL Compose service cannot
  be started in this environment. Database migrations, seeding, and database-
  backed browser flows therefore cannot be validated here.
- Playwright's Chromium binary is not preinstalled, and an attempted `npx
  playwright install chromium` was rejected with HTTP 403 by the configured
  download endpoint. E2E tests cannot launch a browser until that download is
  permitted or a compatible browser is included in the image.
- The environment cannot reach Google Fonts reliably. The application no longer
  requires that connection during builds, but this may affect other projects
  that fetch remote assets at build time.
- No Git remote is configured on the checked-out repository. A push cannot be
  performed until the environment supplies an authenticated remote URL.
- The environment sets an obsolete npm `http-proxy` configuration key, causing
  a warning on every npm command; npm reports that support will be removed in
  its next major release.
