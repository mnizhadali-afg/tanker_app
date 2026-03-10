# CLAUDE.md — Tanker Accounting & Invoice Management System
# سیستم حسابداری و مدیریت فاکتور تانکرها

---

## Project Overview

This is a **multi-user accounting and invoice management system** for tanker operations. It manages accounts, contracts, invoices, tanker entries, payments, and reporting.

**Primary Language:** Farsi (RTL layout). English language support must also be available as a switchable option.

**Stack Recommendation:**
- Frontend: React + TypeScript (with RTL/LTR toggle, i18n via `react-i18next`)
- Backend: Node.js (Express or NestJS) or Python (FastAPI/Django)
- Database: PostgreSQL
- Auth: JWT-based authentication with role-based access control (RBAC)
- Print/PDF: Server-side or client-side PDF generation (e.g., `react-pdf` or `puppeteer`)

---

## Language & Localization

- **Default language: Farsi (fa)**
- UI direction: **RTL** by default
- User can switch to **English (en)**, which switches to **LTR**
- All labels, messages, and field names must have Farsi and English translations
- Number formatting: use Persian digits in Farsi mode, Arabic-Indic or Western as appropriate
- Currency labels: افغانی (AFN) and دلار (USD)

---

## Authentication & Authorization

### Authentication
- Users log in with **username + password**
- Passwords must be **hashed** (bcrypt or argon2)
- On successful login, issue a **JWT access token** (short-lived, e.g. 1h) and a **refresh token** (long-lived, e.g. 7d)
- Refresh token rotation must be supported
- Sessions should be invalidatable (token blacklist or DB-tracked refresh tokens)
- Failed login attempts should be rate-limited

### Roles & Permissions (RBAC)

| Role              | Farsi Label         | Description                                   |
|-------------------|---------------------|-----------------------------------------------|
| `admin`           | مدیر سیستم          | Full access to all modules                    |
| `accountant`      | حسابدار             | Full access except user management            |
| `data_entry`      | اپراتور ثبت         | Can enter tankers, payments; cannot finalize  |
| `viewer`          | مشاهده‌گر           | Read-only access to reports and invoices      |

### Permission Matrix

| Action                        | admin | accountant | data_entry | viewer |
|-------------------------------|-------|------------|------------|--------|
| Manage users                  | ✅    | ❌         | ❌         | ❌     |
| View/Edit accounts            | ✅    | ✅         | ❌         | ✅     |
| Create/Edit contracts         | ✅    | ✅         | ❌         | ✅     |
| Create invoices               | ✅    | ✅         | ✅         | ❌     |
| Finalize invoices             | ✅    | ✅         | ❌         | ❌     |
| Cancel invoices               | ✅    | ✅         | ❌         | ❌     |
| Enter tankers                 | ✅    | ✅         | ✅         | ❌     |
| Register payments             | ✅    | ✅         | ✅         | ❌     |
| View reports                  | ✅    | ✅         | ✅         | ✅     |
| Print invoices                | ✅    | ✅         | ✅         | ✅     |

---

## Data Models

### 1. Account (`accounts`)
All counterparties are stored in a single unified `accounts` table.

```
id, name, type, phone, address, notes, is_active, created_at, updated_at
```

**Account Types (`type` enum):**
- `customer` — مشتری
- `producer` — محصول‌کننده
- `monetary` — حساب پولی (e.g., صرافی AFN, صرافی USD)
- `other` — سایر

**Rules:**
- Customers are used in contracts and invoices
- Producers are linked to tankers via ports (بنادر)
- Monetary accounts are used in payment transactions

---

### 2. Product / Commodity (`products`)
```
id, name, unit, notes, is_active
```

---

### 3. Port (`ports`)
```
id, name, producer_id (FK → accounts where type=producer), notes, is_active
```
Each port is associated with one producer.

---

### 4. Product License (`licenses`)
```
id, license_number, product_id (FK), producer_id (FK), valid_from, valid_to, notes, is_active
```

---

### 5. Contract (`contracts`)
```
id, code, customer_id (FK → accounts), product_id (FK), calculation_type, 
default_rate_per_ton_afn, default_rate_per_ton_usd, default_exchange_rate,
other_default_costs (JSONB), notes, is_active, created_at, updated_at
```

**Calculation Types (`calculation_type` enum):**
- `cost_based` — بر اساس هزینه‌ها (افغانی)
- `cost_based_usd` — بر اساس هزینه‌ها با تبدیل به دلار
- `per_ton` — فی‌تن

**Rules:**
- One contract belongs to one customer
- One contract is for one product
- One contract can have many invoices
- Default rates/costs pre-fill tanker fields but are overridable

---

### 6. Invoice (`invoices`)
```
id, invoice_number (auto-generated), contract_id (FK), customer_id (FK),
status, issue_date, notes, created_by (FK → users), finalized_at, 
finalized_by (FK → users), canceled_at, canceled_by (FK → users),
created_at, updated_at
```

**Invoice Number Format:** `GAS-MO-0001` (sequential, prefix configurable)

**Status enum:**
- `draft` — پیش‌نویس
- `final` — نهایی
- `canceled` — لغو شده

**Rules:**
- Invoice number is reserved on creation (Draft state)
- Both Draft and Final invoices count toward customer balance
- Once Finalized: no edits allowed to amounts/calculations
- To correct a Final invoice: create an adjustment/corrective invoice
- Tankers cannot exist without an invoice

---

### 7. Tanker (`tankers`)
Each tanker is a line item within an invoice.

```
id, invoice_id (FK), contract_id (FK), port_id (FK), producer_id (FK),
license_id (FK),
tanker_number, entry_date,

-- Weight
product_weight,        -- وزن محصولی
bill_weight,           -- وزن بارنامه
tonnage_basis,         -- مبنای تناژ: 'product_weight' | 'bill_weight'

-- Exchange rate
exchange_rate,         -- نرخ ارز

-- Shared costs (customer AND producer)
cost_product,          -- محصولی
cost_public_benefits,  -- فواید عامه
cost_fmn_60,           -- ف.م.ن 60 پول
cost_fmn_20,           -- ف.م.ن 20 پول
cost_quality_control,  -- کنترل کیفیت

-- Separate costs AFN (customer / producer pairs)
cost_dozbalagh_customer,       cost_dozbalagh_producer,        -- دوزبلاغ
cost_escort_customer,          cost_escort_producer,           -- اسکورت
cost_bascule_customer,         cost_bascule_producer,          -- باسکول
cost_overnight_customer,       cost_overnight_producer,        -- شبخواب
cost_bank_commission_customer, cost_bank_commission_producer,  -- کمیشن بانک
cost_rent_afn_customer,        cost_rent_afn_producer,         -- کرایه افغانی
cost_misc_afn_customer,        cost_misc_afn_producer,         -- متفرقه افغانی
cost_broker_commission_customer, cost_broker_commission_producer, -- کمیشن بارچالان
cost_exchanger_commission_customer, cost_exchanger_commission_producer, -- کمیشن صراف

-- Separate costs USD (customer / producer pairs)
cost_license_commission_customer, cost_license_commission_producer, -- کمیشن جواز
cost_rent_usd_customer,        cost_rent_usd_producer,         -- کرایه دلاری
cost_misc_usd_customer,        cost_misc_usd_producer,         -- متفرقه دلاری

-- Customer-only fields
transport_cost,                -- ترانسپورت
commodity_percent_debt,        -- فیصدی جنسی (بدهی کالایی)

-- Per-ton fields (used when calculation_type = per_ton)
rate_per_ton_afn,
rate_per_ton_usd,

-- Calculated outputs (stored for audit/finalization)
customer_debt_afn,
customer_debt_usd,
customer_debt_commodity,
producer_receivable_afn,
producer_receivable_usd,

created_at, updated_at
```

**Data Entry UX:**
- Excel-like grid input (spreadsheet-style)
- Support paste of multiple rows at once
- Tab/Enter navigation between cells
- Auto-fill from contract defaults on row creation
- Recalculate on change of: `product_weight`, `bill_weight`, `tonnage_basis`, `exchange_rate`, `contract_id`, `rate_per_ton_afn`, `rate_per_ton_usd`

---

## Calculation Logic

### Effective Tonnage
```
if tonnage_basis == 'product_weight' → effective_tonnage = product_weight
if tonnage_basis == 'bill_weight'    → effective_tonnage = bill_weight
```

### Customer Debt Calculation

#### A) `cost_based` — هزینه‌ای افغانی
```
customer_debt_afn = (all shared costs)
  + cost_product + cost_public_benefits + cost_fmn_60 + cost_fmn_20 + cost_quality_control
  + cost_dozbalagh_customer + cost_escort_customer + cost_bascule_customer
  + cost_overnight_customer + cost_bank_commission_customer + cost_rent_afn_customer
  + cost_misc_afn_customer + cost_broker_commission_customer + cost_exchanger_commission_customer
  + transport_cost

customer_debt_usd = cost_license_commission_customer + cost_rent_usd_customer + cost_misc_usd_customer

customer_debt_commodity = commodity_percent_debt  (recorded as commodity, not monetary)
```

#### B) `cost_based_usd` — هزینه‌ای با تبدیل به دلار
```
afn_total = (same as cost_based customer_debt_afn formula above)
customer_debt_usd = (afn_total / exchange_rate) 
  + cost_license_commission_customer + cost_rent_usd_customer + cost_misc_usd_customer

customer_debt_afn = 0  (everything converted to USD)
```

#### C) `per_ton` — فی‌تن
```
customer_debt_afn = effective_tonnage × rate_per_ton_afn
customer_debt_usd = effective_tonnage × rate_per_ton_usd
```

---

### Producer Receivable Calculation
**Always calculated using cost-based method regardless of customer's contract type:**
```
producer_receivable_afn =
    cost_product + cost_public_benefits + cost_fmn_60 + cost_fmn_20 + cost_quality_control
  + cost_dozbalagh_producer + cost_escort_producer + cost_bascule_producer
  + cost_overnight_producer + cost_bank_commission_producer + cost_rent_afn_producer
  + cost_misc_afn_producer + cost_broker_commission_producer + cost_exchanger_commission_producer

producer_receivable_usd =
    cost_license_commission_producer + cost_rent_usd_producer + cost_misc_usd_producer
```

---

## Payment Transactions

### Monetary Payments (`monetary_transactions`)
```
id, type ('payment_in' | 'payment_out' | 'exchange'),
payer_account_id (FK → accounts),
payee_account_id (FK → accounts),
monetary_account_id (FK → accounts where type=monetary),
linked_level ('customer' | 'contract' | 'invoice'),
customer_id (FK, nullable),
contract_id (FK, nullable),
invoice_id (FK, nullable),
amount_afn, amount_usd,
exchange_rate (for currency conversion transactions),
transaction_date, notes, created_by (FK → users),
created_at
```

**Payment levels:**
- Customer-level: general payment against customer balance
- Contract-level: payment linked to a specific contract
- Invoice-level: payment linked to a specific invoice

**Currency Conversion support:**
- Customer pays AFN → settled in USD account (store both amounts + exchange rate)
- Customer pays USD → settled in AFN account

---

### Commodity Transactions (`commodity_transactions`)
```
id, customer_id (FK), contract_id (FK, nullable), invoice_id (FK, nullable),
product_id (FK), quantity, unit, transaction_date, notes, created_by (FK → users),
created_at
```
Used to reduce customer's commodity debt balance.

---

## Reports & Balances

### Customer Balance
- Sum of `customer_debt_afn` from all **Draft + Final** tankers (not Canceled invoices)
- Minus monetary payments (AFN)
- Sum of `customer_debt_usd` from all Draft + Final tankers
- Minus monetary payments (USD)
- Sum of `customer_debt_commodity`
- Minus commodity transactions

### Invoice Status Report
- List invoices with status, total AFN debt, total USD debt, payment status

### Transaction History
- Per customer / per contract / per invoice

---

## Invoice Printing

**Rules:**
- Show only customer-facing data (never show producer costs)
- Hide columns where all values in the invoice are zero
- Show tanker line items

### Print layout by contract type:

#### `per_ton` contract:
- Tanker details (number, date, port)
- Tonnage basis label
- Effective tonnage
- Rate per ton (AFN and/or USD)
- Amount per tanker
- Invoice total

#### `cost_based` contract:
- Tanker details
- All customer cost columns (non-zero only)
- Row subtotal
- Invoice grand total (AFN + USD separately)

#### `cost_based_usd` contract:
- Tanker details
- Customer cost columns
- Exchange rate per row
- USD subtotal per row
- Invoice grand total (USD)

---

## UI/UX Requirements

### General
- **RTL layout** in Farsi mode; **LTR** in English mode
- Language toggle in the top navigation bar
- Responsive design (desktop-first, tablet support)
- Farsi font: Vazirmatn or IRANSans
- English font: Inter or system sans-serif

### Tanker Entry Grid
- Spreadsheet/Excel-like interface
- Paste multiple rows (parse clipboard TSV/CSV)
- Inline editing with keyboard navigation (Tab, Enter, Arrow keys)
- Auto-calculate on cell change
- Highlight overridden default values
- Sticky header row

### Invoice Management
- Invoice list with filters: status, customer, contract, date range
- Quick-view summary panel
- "Finalize" button with confirmation dialog
- "Create Adjustment Invoice" button on Final invoices

### Dashboard (optional but recommended)
- Total outstanding balances (AFN + USD)
- Recent invoices
- Recent payments

---

## Project File Structure (Recommended)

```
/
├── frontend/
│   ├── src/
│   │   ├── locales/          # fa.json, en.json
│   │   ├── components/
│   │   │   ├── TankerGrid/   # Excel-like grid component
│   │   │   ├── InvoicePrint/ # Print templates per contract type
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── accounts/
│   │   │   ├── contracts/
│   │   │   ├── invoices/
│   │   │   ├── tankers/
│   │   │   ├── payments/
│   │   │   └── reports/
│   │   ├── hooks/
│   │   ├── store/            # State management (Zustand or Redux)
│   │   └── utils/
│   │       └── calculations.ts  # All tanker calculation logic (testable)
│
├── backend/
│   ├── src/
│   │   ├── auth/             # JWT, refresh tokens, RBAC middleware
│   │   ├── accounts/
│   │   ├── contracts/
│   │   ├── invoices/
│   │   ├── tankers/
│   │   ├── payments/
│   │   ├── reports/
│   │   └── users/
│   └── prisma/ (or migrations/)
│       └── schema.prisma
│
└── CLAUDE.md
```

---

## Key Business Rules Summary

1. **Invoice number** is reserved on Draft creation — never reused even if canceled
2. **Draft + Final** invoices both contribute to customer balance; Canceled do not
3. **Finalized invoices are immutable** — corrections require new adjustment invoices
4. **Tankers must always belong to an invoice** — no orphan tankers
5. **Producer receivable** is always calculated by cost-based method, independent of customer contract type
6. **Auto-filled fields** from contract defaults are user-overridable
7. **Recalculate** customer debt and producer receivable whenever: `product_weight`, `bill_weight`, `tonnage_basis`, `exchange_rate`, `contract`, `rate_per_ton_*` change
8. **Commodity debt** is non-monetary and tracked separately
9. **Print output** must never expose producer costs to customer
10. **Zero-value columns** are hidden in print output

---

## Development Notes for Claude Code

- Start with **database schema** and **migrations** first
- Implement **calculation logic** as pure functions with unit tests (`utils/calculations.ts`)
- Build **authentication** before any protected routes
- The **TankerGrid** component is the most complex UI piece — treat it as a standalone component
- Use **i18next** with `fa` as default namespace; all user-facing strings must be in translation files
- RTL support: use CSS `direction: rtl` on root in Farsi mode; Tailwind `rtl:` variants or a dedicated RTL CSS file
- Invoice number generation must be **atomic/transactional** to avoid duplicates under concurrent requests
- Store **calculated values** (debt totals) on the tanker row for audit trail — do not recalculate at report time for finalized invoices
