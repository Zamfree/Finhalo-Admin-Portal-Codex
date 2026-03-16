# Finhalo Admin Portal Architecture

This document defines the architecture and system rules for the Finhalo Admin Portal.

AI coding agents (Codex, Cursor, Claude Code, Gemini, etc.) must read this document before implementing admin features.

Finhalo is a fintech SaaS platform designed to process broker commission reports, calculate IB rebates, and manage financial ledger accounting.

The Admin Portal is used by platform operators to manage users, commission imports, financial settlements, brokers, and IB networks.

---

# Tech Stack

Frontend

- Next.js 15 (App Router)
- TailwindCSS
- shadcn/ui
- Recharts

Backend

- Supabase
- PostgreSQL

Architecture rules

- Use Server Components by default
- Use Client Components only when interaction is required
- Use Next.js Server Actions for mutations
- Avoid unnecessary API routes

---

# Admin Portal Route Structure

All admin pages must be under the `/admin` path.

/admin  
│  
├─ /dashboard  
│  
├─ /users  
│   └─ /users/[user_id]  
│  
├─ /commissions  
│   ├─ /upload  
│   └─ /batches  
│       └─ /batches/[batch_id]  
│  
├─ /brokers  
│   └─ /brokers/[broker_id]  
│  
├─ /finance  
│   ├─ /ledger  
│   └─ /withdrawals  
│  
├─ /ib  
│   ├─ /network  
│   ├─ /ranking  
│   └─ /ib/[ib_id]  
│  
├─ /promotions  
│  
├─ /support  
│   ├─ /tickets  
│   └─ /tickets/[ticket_id]  
│  
├─ /settings  
│  
└─ /search  

Important rules

- Commission records must always belong to a commission batch
- Do NOT create a global commission records page
- User balances must not be stored separately
- User balances must always be derived from the finance ledger

---

# Admin Portal Modules

## Dashboard

Displays platform analytics and KPI metrics.

Typical components

- KPI cards
- commission trend chart
- platform profit chart
- IB ranking table

Analytics must always use database views.

---

## Users

Manages platform users.

Features

- search users
- view user profile
- view trading accounts
- view commission history
- view rebate history

Tables

users  
profiles  
trading_accounts  

---

## Commissions

Handles broker commission imports.

Features

- upload broker commission CSV
- view commission batches
- view batch details
- approve commission batches

Tables

commission_batches  
commission_records  
rebate_records  

Batch detail pages display commission records belonging to that batch.

---

## Brokers

Displays broker statistics and analytics.

Tables

brokers

Analytics views

admin_broker_stats

---

## Finance

Handles financial ledger and withdrawal management.

Routes

/admin/finance/ledger  
/admin/finance/withdrawals  

Tables

finance_ledger  
withdrawals  

Important rule

User balances must always be calculated from finance_ledger.

Example balance calculation

balance = SUM(finance_ledger.amount)

---

## IB Network

Manages IB relationships and statistics.

IB structure supports only two levels.

Structure

Trader  
↑  
L1 (Parent IB)  
↑  
L2 (Grand IB)

Tables

ib_relationships  
rebate_records  

Views

admin_ib_ranking

---

## Promotions

Manages marketing campaigns and promotional events.

---

## Support

Handles client support tickets.

Routes

/admin/support/tickets  
/admin/support/tickets/[ticket_id]

---

## Settings

Manages system configuration and platform settings.

---

## Search

Provides global admin search across major entities.

Search targets

users  
trading_accounts  
commission_batches  
withdrawals  

---

# Core Commission Pipeline

Finhalo processes broker commission data only.

The system does NOT store full trading history.

Commission pipeline

Broker CSV  
↓  
commission_batches  
↓  
commission_records  
↓  
IB rebate engine  
↓  
rebate_records  
↓  
finance_ledger  
↓  
User balance  

Agents must preserve this pipeline.

---

# IB Commission Distribution

IB commission structure supports two levels only.

Structure

Trader  
↑  
L1  
↑  
L2  

Waterfall distribution

Gross Commission  
↓  
Admin Fee (minimum 10%)  
↓  
L2 Commission  
↓  
Remaining Pool  
↓  
Trader Share  
↓  
L1 Share  

Rules

- L2 commission is calculated first
- L2 cannot equal Trader
- Maximum referral depth is 2
- All payouts must generate records in

rebate_records  
finance_ledger  

---

# Database Tables

Core system tables

users  
profiles  
brokers  
trading_accounts  

commission_batches  
commission_records  
rebate_records  

finance_ledger  
withdrawals  

ib_relationships  

---

# Analytics Views

All analytics must use database views.

Do NOT compute analytics in frontend code.

Views

admin_kpi_overview  
admin_commission_daily  
admin_platform_profit_daily  
admin_broker_stats  
admin_ib_ranking  
admin_batch_status  

---

# UI Structure

Admin layout

Sidebar  
Topbar  
Content Area  

Dashboard

KPI cards  
Charts  
Ranking tables  

Tables

User table  
Commission batch table  
Finance ledger table  
Withdrawal table  

---

# Development Principles

AI agents must follow these principles

- Implement features incrementally
- Avoid generating the entire system in one commit
- Prioritize system correctness over UI design
- Keep components modular
- Follow the defined data pipeline

Recommended development order

1. Admin Layout  
2. Dashboard  
3. Users  
4. Trading Accounts  
5. Commission Import  
6. Commission Batch  
7. Finance Ledger  
8. Withdrawals  
9. Brokers  
10. IB Network  
11. Support  
12. Search  
