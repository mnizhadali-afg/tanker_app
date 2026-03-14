-- Add unique constraint to products.name (skip if duplicates exist)
ALTER TABLE products ADD CONSTRAINT products_name_key UNIQUE (name);

-- Add 'account' value to PaymentLevel enum
ALTER TYPE "PaymentLevel" ADD VALUE IF NOT EXISTS 'account';
