ALTER TABLE public.wallets
  ADD CONSTRAINT wallets_owner_id_fkey
  FOREIGN KEY (owner_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;