# Remaining PRD Work

This checklist records the PRD work that remains after the currently completed backlog items. It is a progress snapshot, not a claim that the unchecked items have been implemented or validated.

## Completed

- [x] Fail-closed access and server-side role/scope enforcement.
- [x] API contract mapping and platform-admin OTP session handling.
- [x] User, organization, and role administration.
- [x] Merchant/app review lifecycle, including approval without credential verification.
- [x] Accurate platform overview metrics and health reporting.
- [x] Audit governance for successful and denied/failed admin mutations.

## Remaining

- [ ] **Mutation validation and feedback (P0; in progress):** Finish validating the current changes. Across supported mutations, validate inputs, prevent duplicate submissions, confirm consequential actions, preserve safe input on failure, and show success only after authoritative confirmation. Verify safe errors, denied-action messages, and failure handling. Covers FR-015/017/018/020/024, SEC-08/09/10, AC-08/11/12, NFR-03/07/08.
- [ ] **Secure table search and pagination (P0):** Ensure relevant lists use server-side search/filter/sort/pagination, row actions follow effective permissions, detail navigation preserves authorization boundaries, and empty states guide operators. Test that results cannot include out-of-scope records. Covers FR-016, AC-09, NFR-02/14, UX §14.2.
- [ ] **Subscriptions and capability visibility (P1):** Verify authoritative subscription/capability data, platform-versus-merchant distinctions, read/manage permissions, and unavailable states. Keep financial detail read-only unless approved backend operations and roles are confirmed. Covers FR-013, PRD §9.4 and §16.1.
- [ ] **Operational reports and exports (P1):** Implement only supported reports/exports, with separate permission checks, server-enforced scope, privacy minimisation, correct filters, and confirmation for large or sensitive exports. Covers FR-021, SEC-11, NFR-12.
- [ ] **Support and policy workflows (P1):** Integrate case/task assignment and escalation, and governed policy lifecycle, through canonical services. Do not create duplicate local workflow or policy engines. Require authorized review/approval/publication and audit where APIs support it. Covers FR-022/023, SEC-13, RBAC-05/12, §16.1.
- [ ] **Responsive and accessible admin UX (P1):** Audit the shared shell, navigation, tables, forms, dialogs, and loading/empty/error/success states for keyboard operation, accessible names, and desktop/tablet/small-screen usability. Fix verified gaps and validate toward WCAG 2.2 AA. Covers FR-024/025, NFR-08/09/13, UX §14.
- [ ] **Performance and operational hardening (P1):** Measure representative list/read performance; ensure cancellation/retry behavior cannot corrupt data or show stale success; correlate safe frontend/API errors using request IDs; and validate scalability and the supported browser matrix with engineering. Covers NFR-01/02/03/11/13/14 and FR-024.
- [ ] **Approved platform analytics (P2):** After KPI definitions and authoritative endpoints are approved, add deeper reporting/custom dashboards for B2B platform metrics. Keep booking KPIs and booking analytics removed. Covers FR-004, §5.1 P2, §19.
- [ ] **Acceptance and release validation (P0 release gate):** Run or extend functional, role-matrix, direct-API, cross-merchant, revocation, mutation-failure, audit, metric-accuracy, accessibility, and regression tests for AC-01–14 and §15.1. Record passed, blocked, and failed checks; do not treat test-environment failures as passes.

## Notes

- The mutation-feedback item is still in progress; the latest portal changes need lint, typecheck, build, and focused test validation before it can be marked complete.
- The items above are the open entries from the current implementation backlog. Update this file as each item is completed and validated.
