-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'accountant', 'data_entry', 'viewer');
CREATE TYPE "AccountType" AS ENUM ('customer', 'producer', 'monetary', 'other');
CREATE TYPE "CalculationType" AS ENUM ('cost_based', 'cost_based_usd', 'per_ton');
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'final', 'canceled');
CREATE TYPE "TonnageBasis" AS ENUM ('product_weight', 'bill_weight');
CREATE TYPE "TransactionType" AS ENUM ('payment_in', 'payment_out', 'exchange');
CREATE TYPE "PaymentLevel" AS ENUM ('customer', 'contract', 'invoice');

-- Atomic invoice number sequence
CREATE SEQUENCE invoice_number_seq START 1;

-- CreateTable users
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'data_entry',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateTable refresh_tokens
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateTable accounts
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accounts_type_idx" ON "accounts"("type");

-- CreateTable products
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable ports
CREATE TABLE "ports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "producer_id" TEXT NOT NULL,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ports_producer_id_idx" ON "ports"("producer_id");

-- CreateTable licenses
CREATE TABLE "licenses" (
    "id" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "producer_id" TEXT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "licenses_producer_id_idx" ON "licenses"("producer_id");
CREATE INDEX "licenses_product_id_idx" ON "licenses"("product_id");

-- CreateTable contracts
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "calculation_type" "CalculationType" NOT NULL,
    "default_rate_per_ton_afn" DECIMAL(18,4),
    "default_rate_per_ton_usd" DECIMAL(18,4),
    "default_exchange_rate" DECIMAL(18,4),
    "other_default_costs" JSONB,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "contracts_code_key" ON "contracts"("code");
CREATE INDEX "contracts_customer_id_idx" ON "contracts"("customer_id");

-- CreateTable invoices
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
    "issue_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "finalized_at" TIMESTAMP(3),
    "finalized_by" TEXT,
    "canceled_at" TIMESTAMP(3),
    "canceled_by" TEXT,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");
CREATE INDEX "invoices_customer_id_idx" ON "invoices"("customer_id");
CREATE INDEX "invoices_contract_id_idx" ON "invoices"("contract_id");
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateTable tankers
CREATE TABLE "tankers" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "port_id" TEXT NOT NULL,
    "producer_id" TEXT NOT NULL,
    "license_id" TEXT,
    "tanker_number" TEXT NOT NULL,
    "entry_date" TIMESTAMP(3) NOT NULL,
    "product_weight" DECIMAL(18,4) NOT NULL,
    "bill_weight" DECIMAL(18,4) NOT NULL,
    "tonnage_basis" "TonnageBasis" NOT NULL DEFAULT 'product_weight',
    "exchange_rate" DECIMAL(18,4) NOT NULL,
    "cost_product" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_public_benefits" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_fmn_60" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_fmn_20" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_quality_control" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_dozbalagh_customer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_dozbalagh_producer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_escort_customer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_escort_producer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_bascule_customer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_bascule_producer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_overnight_customer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_overnight_producer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_bank_commission_customer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_bank_commission_producer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_rent_afn_customer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_rent_afn_producer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_misc_afn_customer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_misc_afn_producer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_broker_commission_customer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_broker_commission_producer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_exchanger_commission_customer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_exchanger_commission_producer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_license_commission_customer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_license_commission_producer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_rent_usd_customer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_rent_usd_producer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_misc_usd_customer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cost_misc_usd_producer" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "transport_cost" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "commodity_percent_debt" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "rate_per_ton_afn" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "rate_per_ton_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "customer_debt_afn" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "customer_debt_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "customer_debt_commodity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "producer_receivable_afn" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "producer_receivable_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tankers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "tankers_invoice_id_idx" ON "tankers"("invoice_id");
CREATE INDEX "tankers_contract_id_idx" ON "tankers"("contract_id");

-- CreateTable monetary_transactions
CREATE TABLE "monetary_transactions" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "payer_account_id" TEXT NOT NULL,
    "payee_account_id" TEXT NOT NULL,
    "monetary_account_id" TEXT NOT NULL,
    "linked_level" "PaymentLevel" NOT NULL,
    "customer_id" TEXT,
    "contract_id" TEXT,
    "invoice_id" TEXT,
    "amount_afn" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "amount_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "exchange_rate" DECIMAL(18,4),
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "monetary_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "monetary_transactions_customer_id_idx" ON "monetary_transactions"("customer_id");
CREATE INDEX "monetary_transactions_invoice_id_idx" ON "monetary_transactions"("invoice_id");
CREATE INDEX "monetary_transactions_contract_id_idx" ON "monetary_transactions"("contract_id");

-- CreateTable commodity_transactions
CREATE TABLE "commodity_transactions" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "contract_id" TEXT,
    "invoice_id" TEXT,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commodity_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "commodity_transactions_customer_id_idx" ON "commodity_transactions"("customer_id");

-- AddForeignKey constraints
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ports" ADD CONSTRAINT "ports_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_finalized_by_fkey" FOREIGN KEY ("finalized_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_canceled_by_fkey" FOREIGN KEY ("canceled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tankers" ADD CONSTRAINT "tankers_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tankers" ADD CONSTRAINT "tankers_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tankers" ADD CONSTRAINT "tankers_port_id_fkey" FOREIGN KEY ("port_id") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tankers" ADD CONSTRAINT "tankers_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tankers" ADD CONSTRAINT "tankers_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "monetary_transactions" ADD CONSTRAINT "monetary_transactions_payer_account_id_fkey" FOREIGN KEY ("payer_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "monetary_transactions" ADD CONSTRAINT "monetary_transactions_payee_account_id_fkey" FOREIGN KEY ("payee_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "monetary_transactions" ADD CONSTRAINT "monetary_transactions_monetary_account_id_fkey" FOREIGN KEY ("monetary_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "monetary_transactions" ADD CONSTRAINT "monetary_transactions_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "monetary_transactions" ADD CONSTRAINT "monetary_transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "monetary_transactions" ADD CONSTRAINT "monetary_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "commodity_transactions" ADD CONSTRAINT "commodity_transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "commodity_transactions" ADD CONSTRAINT "commodity_transactions_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "commodity_transactions" ADD CONSTRAINT "commodity_transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "commodity_transactions" ADD CONSTRAINT "commodity_transactions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "commodity_transactions" ADD CONSTRAINT "commodity_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
