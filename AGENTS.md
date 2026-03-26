# Finhalo Admin Portal Architecture

This document defines the current architecture rules for the Finhalo Admin Portal.

All coding agents working in this repository must follow these rules before implementing features or refactors.

## Product Definition

Finhalo is a fintech SaaS platform for:

- importing broker commission reports
- calculating IB rebates
- managing downstream finance ledger visibility
- operating users, accounts, network relationships, support, campaigns, and referrals

The Admin Portal is an internal operator workbench.

It is not a marketing site and it is not a CRM profile system.

The portal should optimize for:

- operational clarity
- fast decision-making
- low cognitive load
- traceable actions
- modular, maintainable code

## Core System Rule

The Admin Portal is a frontend workbench.

Business computation must not live in the UI by default.

Use this split:

- database / views / RPC / server actions:
  - business rules
  - calculations
  - validations
  - decision logic
  - final state transitions
- admin frontend:
  - render the current operational state
  - surface actions
  - provide review / approval / handoff UX
  - give feedback to operators

If a value is a business conclusion, it should come from the server side whenever possible.

## Tech Stack

Frontend

- Next.js 15 App Router
- Tailwind CSS
- shadcn/ui
- Recharts

Backend

- Supabase
- PostgreSQL

Architecture rules

- Prefer Server Components by default
- Use Client Components only for interaction
- Use Server Actions for mutations
- Avoid unnecessary API routes
- Keep service boundaries under `services/admin/*`

## Current Admin Route Structure

All admin features live under `/admin`.

- `/admin/dashboard`
- `/admin/users`
- `/admin/users/[user_id]`
- `/admin/accounts`
- `/admin/accounts/[account_id]`
- `/admin/brokers`
- `/admin/brokers/[broker_id]`
- `/admin/commission`
- `/admin/commission/upload`
- `/admin/commission/batches`
- `/admin/commission/batches/[batch_id]`
- `/admin/finance`
- `/admin/finance/ledger`
- `/admin/finance/withdrawals`
- `/admin/finance/adjustments`
- `/admin/finance/reconciliation`
- `/admin/network`
- `/admin/referral`
- `/admin/referral/[referral_id]`
- `/admin/campaigns`
- `/admin/campaigns/[campaign_id]`
- `/admin/support`
- `/admin/support/[ticket_id]`
- `/admin/settings`
- `/admin/search`

Compatibility redirects may still exist for legacy entry points such as:

- `/admin/campaign`
- `/admin/promotions`

Do not introduce new legacy aliases unless explicitly required.

## Module Architecture Standard

Use the established admin module pattern.

For a standard module, prefer:

- `page.tsx`:
  - server entry
  - fetch data through `services/admin/*`
  - prepare summary data
  - render page shell
- `*-page-client.tsx`:
  - orchestration only
  - filters
  - drawer state
  - local interaction state
- `_types.ts`:
  - module-local view types
- `_mappers.ts`:
  - domain/service data -> view model transformation
- `_shared.tsx`:
  - reusable local UI pieces
- `drawer/*`:
  - drawer shell and tab sections

Shared UI patterns already in use:

- `PageHeader`
- `DataPanel`
- `DataTable`
- `FilterBar`
- drawer / detail panel pattern

Do not invent a second architecture.

## Current Module Responsibilities

### Dashboard

Operational overview and KPI monitoring.

Should remain analytics-first and read-first.

### Users

Identity and operator-facing user context.

Includes:

- user directory
- owned accounts visibility
- downstream activity summary

### Accounts

Trading-account-level operational review.

Includes:

- account directory
- relationship snapshot visibility
- related activity

### Commission

Batch processing workbench.

This module is not a reporting dashboard.

Primary purpose:

- decide whether a batch can be posted

Current UX direction:

- one main queue page
- row click opens decision drawer
- upload remains a support route

### Finance

Ledger and withdrawal operations.

Important rule:

- balances must be derived from `finance_ledger`
- do not introduce separately stored balances in frontend code

### Brokers

Broker operations and broker-specific configuration surfaces.

### Network

Relationship-centric module.

Primary focus:

- user position in network
- uplink / downline visibility
- light business signals only

Do not turn it into a trader analytics page.

### Referral

Referral program operations.

Must remain distinct from Network.

### Campaigns

Campaign operations.

Must remain distinct from Referral.

Should stay rule/performance-driven, not CRM-like.

### Support

Support investigation workbench.

Not a generic inbox.

Operators should be able to:

- review ticket context
- see related entities
- reply
- leave internal notes
- hand off to the right module

### Settings

System configuration and guarded operational actions.

### Search

Global admin search across major operational entities.

## Core Commission Pipeline

Preserve this pipeline:

Broker CSV
-> commission_batches
-> commission_records
-> rebate_records
-> finance_ledger
-> operator-visible balances and finance outcomes

Important rules:

- commission records must always belong to a batch
- do not create a global commission-records page
- user balances must be derived from ledger visibility

## IB / Referral Relationship Constraints

The current relationship model supports two levels:

- Trader
- L1
- L2

Rules:

- L2 is calculated before trader and L1 split
- L2 cannot equal trader
- maximum depth is 2

## Data and Analytics Rules

- analytics should come from database views or server-side data sources
- do not compute final business analytics in client components
- frontend can reshape display data, but should not become the business engine

Known analytics view targets include:

- `admin_kpi_overview`
- `admin_commission_daily`
- `admin_platform_profit_daily`
- `admin_broker_stats`
- `admin_ib_ranking`
- `admin_batch_status`

## Development Rules

- implement incrementally
- do not dump an entire system in one pass
- keep modules modular
- preserve existing route structure unless explicitly changing IA
- do not add fake business logic just to make UI look complete
- if real execution is not ready, add a clean structural slot and document it
- prefer service-boundary cleanup before adding more UI complexity

## Current Priorities

When improving this project, prioritize in this order:

1. correctness of data flow
2. service / server-side rule ownership
3. operator workflow clarity
4. architectural consistency
5. UI polish

## Design Context

This admin portal should feel:

- calm
- precise
- trustworthy
- restrained

Design should support a serious operator workspace.

Avoid:

- CRM-heavy profile layouts
- decorative dashboard clutter
- marketing-site flourishes
- explanatory product-language blocks that slow decision-making

Preferred references in spirit:

- Linear
- Stripe Dashboard
- Vercel

The goal is:

- unified structure
- efficient execution
- clean implementation
- simple interaction
- extensible modules
- maintainable code
