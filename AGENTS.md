# Finhalo AI Engineering Guide

This file defines the architecture, rules, and development standards for AI coding agents working on the Finhalo repository.

AI agents (Codex, Cursor, Claude, Gemini, etc.) must read this file before implementing features.

Finhalo is a fintech SaaS platform that manages broker commission imports, IB rebate distribution, and financial ledger accounting.

The system includes:

- Marketing Website
- Client Portal
- Admin Portal
- Commission Processing Pipeline
- Finance Ledger System

This repository focuses primarily on:

Admin Portal + Commission Engine.

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

Architecture Rules

- Use Server Components by default
- Use Client Components only when interaction is required
- Use Next.js Server Actions for mutations
- Avoid creating unnecessary API routes

---

# Project Structure

Agents must follow this structure.

app/
  admin/
    dashboard/
    users/
    commissions/
    brokers/
    finance/
    ib/
    promotions/
    support/
    settings/
    search/

components/
  admin/
  charts/
  tables/

lib/
  supabase-server.ts
  supabase-client.ts

actions/

types/

docs/

---

# Admin Routes

Admin routes must follow this pattern:

/admin/dashboard
/admin/users
/admin/commissions
/admin/brokers
/admin/finance
/admin/ib
/admin/promotions
/admin/support
/admin/settings
/admin/search

---

# Admin Portal Modules

Dashboard  
Platform analytics and KPI overview.

Users  
User management and trading account binding.

Commissions  
Broker commission CSV import and batch management.

Brokers  
Broker statistics and analytics.

Finance  
Financial ledger, balances, and withdrawals.

IB Network  
Two-level IB referral structure.

Promotions  
Marketing campaigns.

Support  
Client support ticket system.

Settings  
System configuration.

Search  
Global admin search.

---

# Core Commission Data Pipeline

Broker commission data enters the system through CSV import.

Pipeline:

Broker CSV  
↓  
commission_batches  
↓  
commission_records  
↓  
Rebate Engine  
↓  
rebate_records  
↓  
finance_ledger  
↓  
User Balance  

Agents must preserve this pipeline.

---

# IB Commission Structure

Finhalo IB system supports two levels only.

Structure:

Trader  
↑  
L1 (Parent IB)  
↑  
L2 (Grand IB)

Commission waterfall:

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

Rules:

- L2 commission is calculated first
- Trader receives a split of the remaining pool
- L1 receives the remainder
- L2 cannot equal Trader
- Maximum trace depth: 2

All commission settlements must write records to:

rebate_records  
finance_ledger  

---

# Financial Ledger Rules

The finance_ledger table is the source of truth.

User balances must ALWAYS be calculated from ledger entries.

Never store balances directly.

Balance example:

balance = SUM(finance_ledger.amount)

Possible ledger transaction types:

commission  
rebate  
withdrawal  
adjustment  
chargeback  

---

# Commission Batch Processing

Commission imports occur in batches.

Tables involved:

commission_batches  
commission_records  
rebate_records  

Workflow:

1 Upload CSV  
2 Parse CSV  
3 Validate fields  
4 Insert commission batch  
5 Insert commission records  
6 Trigger rebate generation  
7 Settlement writes finance ledger entries  

Batch approval may call RPC:

approve_batch(batch_id)

---

# Database Tables

Core tables used in the system:

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

Analytics must use database views.

Never compute statistics in frontend code.

Views:

admin_kpi_overview  
admin_commission_daily  
admin_platform_profit_daily  
admin_broker_stats  
admin_ib_ranking  
admin_batch_status  

---

# UI Component Structure

AdminLayout

Sidebar  
Topbar  
ContentArea  

Dashboard

KPI Cards  
Charts  
Ranking Tables  

Users

User Table  
User Detail  

Commissions

CSV Upload  
Batch Table  
Batch Detail  

Finance

Ledger Table  
Withdrawal Table  

---

# Coding Standards

Agents must follow these guidelines.

Code Quality

- Write modular components
- Avoid very large files
- Prefer reusable components

Data Access

- Server Components → Supabase server client
- Client Components → Supabase browser client

UI

- Use shadcn components
- Keep styling minimal
- Focus on functionality first

---

# Implementation Workflow

Agents must implement features incrementally.

Recommended development order:

1 Admin Layout  
2 Dashboard  
3 Users  
4 Trading Accounts  
5 Commission Import  
6 Commission Batch  
7 Finance Ledger  
8 Withdrawals  
9 Broker Stats  
10 IB Network  
11 Support Tickets  
12 Global Search  

Each task should produce a clean pull request.

Avoid generating the entire system in one commit.

---

# Important Principles

- Finance ledger is the single source of truth.
- Commission pipeline must remain deterministic.
- IB structure supports two levels only.
- Do not change database schema unless instructed.

Agents must prioritize system correctness over UI design.
