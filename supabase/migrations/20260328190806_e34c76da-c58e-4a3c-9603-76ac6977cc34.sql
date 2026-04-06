ALTER TABLE wallet_transactions DROP CONSTRAINT wallet_transactions_status_check;

ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_status_check CHECK (status IN ('pending', 'success', 'failed', 'expired'));