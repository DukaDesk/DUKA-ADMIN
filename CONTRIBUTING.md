# Contributing — Admin Portal

**Knowledge Base Version:** 0.3.x
**Engineering Governance:** `repository-governance/PR_STANDARD.md`, `BRANCHING_STANDARD.md`, `VERSIONING_STANDARD.md`, `REVIEW_STANDARD.md`

## Branching

Follow `BRANCHING_STANDARD.md`: `main` is deployable, feature branches `feat/<spec-id>-<short>`, fix `fix/<issue>`, docs `docs/<topic>`. Rebase before PR.

Example: `feat/UI-0003-dashboard-shell`, `fix/SEC-0002-rbac-heal`

## Commit Conventions

Reference specs by ID:

```
feat(UI-0003): add dashboard summary cards live via BFF
fix(SEC-0002): heal getdukadesk role to platform_operator
docs(ADMIN): add Administration domain audit log date range
```

Format: `type(scope): subject` where `type` in `feat, fix, docs, chore, test, refactor`, `scope` is spec or domain.

## Pull Request Process

Per `PR_STANDARD.md`:
1. Branch from `main`, implement against `ARCHITECTURE_ALIGNMENT.md` constraints.
2. Update `PROGRESS.md` if status changes.
3. Add tests (`tests/` Playwright) for `UI-0003` ACs: shell renders, role-aware nav, invite user, update settings.
4. Ensure `npm run build` + `npm run typecheck` pass; `npm run lint` max-warnings 0.
5. Request review per `CODEOWNERS`; no self-merge.
6. Reference spec IDs in PR description and link KB docs.

## Review Standard

Per `REVIEW_STANDARD.md`: one reviewer from CODEOWNERS, verify KB traceability, role-aware visibility, live data (no mocks), error handling (403, retry), accessibility (`aria-*`).

## Tests

- **E2E:** Playwright `tests/smoke.spec.ts` covers login, navigation, merchants search, settings tabs, dashboard charts.
- **Role-based:** Add tests per `SEC-0002` TC-01-03 (customer 403, tenant owner 200, admin UI hide).
- Run `npx playwright install` then `npm run test`.

## Versioning

Per `VERSIONING_STANDARD.md` SemVer; update `CHANGELOG.md` per `Keep a Changelog`.

## Forbidden

Do not commit `.env`, secrets, `mockCall`/`MOCK_*` (live only), emoji (use `lucide-react`), or modify accepted ADRs without ADR.
