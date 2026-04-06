
CREATE VIEW public.wallets_with_restaurants AS
SELECT 
  w.id,
  w.owner_id,
  w.balance,
  w.created_at,
  w.updated_at,
  r.name as restaurant_name,
  r.username as restaurant_username
FROM wallets w
LEFT JOIN restaurants r ON r.owner_id = w.owner_id;
