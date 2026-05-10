-- Add index on tankers.producer_id for faster producer balance aggregation queries
CREATE INDEX IF NOT EXISTS "tankers_producer_id_idx" ON "tankers"("producer_id");
