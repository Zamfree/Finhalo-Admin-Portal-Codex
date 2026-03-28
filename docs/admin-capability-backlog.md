# Admin Capability Backlog

This file tracks the major admin capability slots that are intentionally not fully implemented yet.

The project rule remains:

- structure first
- real functionality later
- keep the current module architecture intact

## Already structured

These modules already have meaningful capability skeletons in place:

- Dashboard
- Users
- Accounts
- Network
- Brokers
- Support
- Referral
- Campaigns
- Commission
- Finance
- Settings
- Search

## Still placeholder-only or partially structured

### Commission

- Upload intake is now executable through the CSV form and server action, and the upload surface now includes duplicate precheck and gross preview before batch creation
- Mapping confirmation is now executable through guarded batch actions that mark review-complete status on commission_batches
- Validation detail workflow now re-evaluates commission_records during mapping confirmation and writes batch-level validation/duplicate posture back to commission_batches
- Duplicate conflict handling now includes guarded re-check and clear flow against commission_records duplicate groups; source-row merge/deletion remains deferred
- Upload readiness and simulation review posture are now structurally framed, and approval now enforces a DB-backed simulation gate on commission_batches simulation metadata (migration required)
- Batch status workflow is now DB-first when a real commission batch exists, with placeholder fallback for mock-backed rows
- Batch export is UI-only

### Brokers

- Import configuration is structured, not executable
- Mapping rules are structured, not executable
- Commission setup is structured, not executable
- Account type coverage is structured, not executable

### Support

- Internal notes are now writable through the existing support message stream and rendered back into the admin investigation trail as internal entries
- Action queue is now wired into guarded handoff operations with timeline notes and queue insertion fallback handling
- Reply flow is now wired into the existing server action through a real reply composer surface
- Support workspace and timeline now prefer backend reads with mock fallback, but they still need schema-confirmed production hardening later
- Attachment handling is intentionally not implemented

### Finance

- Withdrawal approve / reject actions are now wired into the drawer workflow and the read path now prefers backend withdrawal rows with mock fallback
- Adjustment creation and batch adjustment are now wired into guarded queue actions with optional audit logging fallback
- Reconciliation exception handling is now wired into guarded per-row queue actions with optional audit logging fallback

### Settings

- Recalculate rebates and reprocess commission batch now have guarded action triggers, with optional audit logging when the backend audit table is available
- Audit trail now prefers backend audit rows with mock fallback

## Deferred by design

These should not be added as fake frontend logic:

- real CSV/XLSX parsing
- automatic column detection
- real duplicate detection engine
- real commission simulation engine
- real settlement approval engine
- true recalculation / replay pipelines
- real notification delivery
- real admin impersonation

## Next high-value structural work

1. Broker configuration surfaces linked to future guarded actions
2. Finance guarded actions for adjustments and reconciliation exception handling
3. Settings operational actions linked to future guarded execution handlers
4. Support internal note surface, if and only if we decide to expose real internal handling flows
5. Search expansion into additional admin entities, only if product scope requires it
