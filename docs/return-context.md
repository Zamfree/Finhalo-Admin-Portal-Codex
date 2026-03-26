# Return Context

This project uses a shared return-context layer so cross-module navigation stays deterministic.

## Rule

- Never rely on `router.back()` for workflow return.
- Preserve full route state with `returnTo`.
- Preserve module origin with `source`.

## Core API

Use [use-return-context.ts](D:/Programs/Github/Finhalo-Admin-Portal-Codex/hooks/use-return-context.ts):

- `getCurrentContext()`
- `buildHrefWithReturn(targetPath, targetQuery?)`
- `pushWithReturn(targetPath, targetQuery?)`
- `replaceWithReturn(targetPath, targetQuery?)`
- `getReturnTarget(fallbackPath)`
- `goBackToContext(fallbackPath)`
- `maybeGetSource()`

## Source Page Pattern

For client-side navigation:

```tsx
const { pushWithReturn } = useReturnContext({ source: "commission" });

pushWithReturn("/admin/finance/ledger", {
  account_id: "ACC-1",
});
```

For link-style navigation:

```tsx
<ReturnContextLink href="/admin/commission/upload">
  <AdminButton>Upload Commission</AdminButton>
</ReturnContextLink>
```

## Destination Page Pattern

Render an explicit return action:

```tsx
<ReturnToContextButton
  fallbackPath="/admin/commission"
  label="Back to Queue"
/>
```

If `returnTo` includes drawer-opening query params, returning to that URL should reopen the drawer automatically because drawer state is URL-driven.
