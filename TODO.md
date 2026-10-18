# Admin Dashboard TODO

## App Approval Workflow

- [x] Replace the current merchant verification-gated approval stages with the app submission lifecycle: `in_review` -> approved/live or rejected.
- [x] Consume `GET /api/v1/admin/merchants/:id/review` and `GET /api/v1/admin/merchants/:id/preview`; show the submitted release version and render the exact immutable candidate manifest.
- [x] Wire `POST /api/v1/admin/merchants/:id/apps/approve` and `/apps/reject` to the review actions; require and display the rejection reason.
- [x] Remove the old status-only `POST /api/v1/admin/merchants/:id/approve` action from app publication UX; app approval is the only action that activates the submitted release for mobile.
- [x] Show submission status and latest release status in the merchant list, and refresh mobile availability after approval.
- [x] Add integration tests for review preview, approve, reject, and preventing approval while no submission is awaiting review.

The backend now stages merchant publications as private `pending_review` releases. Admin approval promotes that exact release to production; rejection leaves the current approved release active, if one exists. New app review is restricted to platform `super_admin` and `operations` roles.
