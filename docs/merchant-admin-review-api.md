# Merchant admin review API handoff

This document describes the backend contract expected by the Admin Portal merchant review screen. The attached `MerchantDetailScreen.jsx` contains example/demo merchant data; the portal must use live API responses and must not copy that sample data into the application.

## Endpoint summary

The frontend already calls the routes below. This handoff does not assume they are implemented on the backend: please verify each route and its response shape. If a route already exists, update its contract rather than adding a duplicate route.

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/bff/admin/merchants` | Merchant list; row identity and both approval statuses |
| `GET` | `/admin/merchants/{merchantId}/review` | Merchant owner, credentials, compliance, subscription, app and review metadata |
| `GET` | `/admin/merchants/{merchantId}/preview` | Draft app design used by the phone preview |
| `POST` | `/admin/merchants/{merchantId}/verify` | Approve stage 1 merchant/compliance verification |
| `POST` | `/admin/merchants/{merchantId}/verify-reject` | Reject stage 1 credentials with a reason |
| `POST` | `/admin/merchants/{merchantId}/apps/approve` | Approve and publish stage 2 app submission |
| `POST` | `/admin/merchants/{merchantId}/apps/reject` | Reject stage 2 app submission with a reason |

If the review and preview routes are absent, those are the read endpoints the backend needs to add. The four action routes are already wired in the frontend service and should be implemented or confirmed as part of the same integration.

## Merchant list response

Each merchant row needs these fields. Keep the API's normal response envelope if applicable; the UI already unwraps common `{ data: ... }` envelopes.

```ts
type MerchantListItem = {
  id: string;
  name: string;
  email?: string;
  status?: string;
  verificationStatus: "pending" | "verified" | "rejected";
  appStatus: "none" | "in_review" | "approved" | "rejected";
  plan?: string;
  createdAt?: string; // ISO 8601
};
```

## Merchant review response

`GET /admin/merchants/{merchantId}/review` should return current persisted data for the requested merchant. Do not return fixture/demo content. A response can use this shape (optional fields may be omitted when the merchant has not supplied them):

```ts
type MerchantReview = {
  tenant: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    profilePicture?: string;
    verificationStatus: "pending" | "verified" | "rejected";
    appStatus: "none" | "in_review" | "approved" | "rejected";
    complianceSubmittedAt?: string; // ISO 8601; signals that stage 1 was submitted
    appSubmittedAt?: string; // ISO 8601
    createdAt?: string; // ISO 8601
    owner?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      emailVerified?: boolean;
      phoneNumber?: string;
      profilePicture?: string;
      profileImage?: string;
      avatarUrl?: string;
    };
    users?: Array<{ user: MerchantReview["tenant"]["owner"] }>;
    subscription?: {
      status?: string;
      plan?: { name?: string; price?: number; currency?: string };
      currentPeriodEnd?: string;
      renewalDate?: string;
      nextBillingDate?: string;
      expiresAt?: string;
    };
    app?: {
      name?: string;
      category?: string;
      slug?: string;
      template?: string;
      submittedAt?: string;
    };
  };
  verificationStatus?: "pending" | "verified" | "rejected";
  appStatus?: "none" | "in_review" | "approved" | "rejected";
  compliance?: Array<{
    id: string;
    businessName?: string;
    status: string;
    regNo?: string;
    taxId?: string;
    nin?: string;
    bvn?: string;
    reviewNote?: string;
    documents?: Array<{ name?: string; url: string }>;
  }>;
  quota?: { used?: number; currentDay?: number; limit?: number; max?: number; requestsPerDay?: number };
  app?: MerchantReview["tenant"]["app"];
  releases?: Array<{ version?: string | number; status?: string }>;
  draftPages?: Array<unknown>;
};
```

The review response must keep the verification and app statuses current after an action. The frontend uses the compliance collection or one of the submission timestamps to determine that stage 1 has actually been submitted; an absent status must not be treated as verified.

## App preview response

`GET /admin/merchants/{merchantId}/preview` must return the merchant's saved, unpublished design, not the published app or an example design. `pages` is the preferred canonical field; `screens` and `draftPages` are also accepted by the current preview renderer.

```ts
type MerchantAppPreview = {
  tenant?: { name?: string };
  name?: string;
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
    borderRadius?: string;
  };
  navigation?: Array<string | { label?: string; title?: string; name?: string }> | { items: unknown[] };
  pages: Array<{
    id?: string;
    name?: string;
    title?: string;
    slug?: string;
    isHome?: boolean;
    sections?: Array<{
      id?: string;
      config?: { title?: string };
      components?: Array<{
        id?: string;
        type?: string;
        props?: Record<string, unknown>;
        config?: Record<string, unknown>;
      }>;
    }>;
  }>;
};
```

For merchants with no app design, return an empty page list or an explicit not-found response. Do not synthesize pages. The admin UI disables app approval until at least one preview page is returned.

## Action behavior and validation

- Stage 1 starts when the merchant submits compliance credentials. `POST .../verify` transitions a submitted merchant to `verified`; `POST .../verify-reject` transitions it to `rejected` and stores the required reason.
- Stage 2 is available only after stage 1 is `verified` and the merchant submits an app with status `in_review`.
- `POST .../apps/approve` must validate those preconditions server-side and transition the app to `approved`/published. The client-side button is only a convenience; it is not authorization.
- `POST .../apps/reject` requires and stores a reason, transitions the app to `rejected`, and leaves it unpublished.
- Return the updated merchant/review state from successful action responses where practical. Reject invalid transitions with an appropriate `4xx` response (for example, `409 Conflict`) and a useful message.
- Enforce admin permissions and audit each verification, rejection, approval, and publication on the server. Keep credential/document access restricted to authorized admin roles; document links should be authenticated or short-lived.

## Acceptance checks

1. The review and preview responses contain the selected merchant's persisted data and never return the attached mock merchant.
2. A pending merchant with no compliance submission cannot be verified.
3. An unverified merchant cannot submit an app for admin approval.
4. An app cannot be approved unless its real preview is available and its current status is `in_review`.
5. Reject actions require a reason; successful state changes appear in the list and detail view after refresh.
