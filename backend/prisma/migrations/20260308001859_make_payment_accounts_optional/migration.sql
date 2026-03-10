-- DropForeignKey
ALTER TABLE "monetary_transactions" DROP CONSTRAINT "monetary_transactions_monetary_account_id_fkey";

-- DropForeignKey
ALTER TABLE "monetary_transactions" DROP CONSTRAINT "monetary_transactions_payee_account_id_fkey";

-- DropForeignKey
ALTER TABLE "monetary_transactions" DROP CONSTRAINT "monetary_transactions_payer_account_id_fkey";

-- AlterTable
ALTER TABLE "monetary_transactions" ALTER COLUMN "payer_account_id" DROP NOT NULL,
ALTER COLUMN "payee_account_id" DROP NOT NULL,
ALTER COLUMN "monetary_account_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "monetary_transactions" ADD CONSTRAINT "monetary_transactions_payer_account_id_fkey" FOREIGN KEY ("payer_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monetary_transactions" ADD CONSTRAINT "monetary_transactions_payee_account_id_fkey" FOREIGN KEY ("payee_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monetary_transactions" ADD CONSTRAINT "monetary_transactions_monetary_account_id_fkey" FOREIGN KEY ("monetary_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
