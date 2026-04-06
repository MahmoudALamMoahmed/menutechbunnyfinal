
DO $$
BEGIN
  -- branches → restaurants
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'branches_restaurant_id_fkey') THEN
    ALTER TABLE public.branches ADD CONSTRAINT branches_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;
  END IF;

  -- categories → restaurants
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_restaurant_id_fkey') THEN
    ALTER TABLE public.categories ADD CONSTRAINT categories_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;
  END IF;

  -- menu_items → restaurants
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_restaurant_id_fkey') THEN
    ALTER TABLE public.menu_items ADD CONSTRAINT menu_items_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;
  END IF;

  -- menu_items → categories
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_category_id_fkey') THEN
    ALTER TABLE public.menu_items ADD CONSTRAINT menu_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;

  -- extras → restaurants
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'extras_restaurant_id_fkey') THEN
    ALTER TABLE public.extras ADD CONSTRAINT extras_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;
  END IF;

  -- orders → restaurants
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_restaurant_id_fkey') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;
  END IF;

  -- orders → branches
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_branch_id_fkey') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;

  -- orders → delivery_areas
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_delivery_area_id_fkey') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_delivery_area_id_fkey FOREIGN KEY (delivery_area_id) REFERENCES public.delivery_areas(id) ON DELETE SET NULL;
  END IF;

  -- branch_staff → restaurants
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'branch_staff_restaurant_id_fkey') THEN
    ALTER TABLE public.branch_staff ADD CONSTRAINT branch_staff_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;
  END IF;

  -- branch_staff → branches
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'branch_staff_branch_id_fkey') THEN
    ALTER TABLE public.branch_staff ADD CONSTRAINT branch_staff_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;

  -- branch_payment_methods → branches
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'branch_payment_methods_branch_id_fkey') THEN
    ALTER TABLE public.branch_payment_methods ADD CONSTRAINT branch_payment_methods_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;

  -- sizes → menu_items
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sizes_menu_item_id_fkey') THEN
    ALTER TABLE public.sizes ADD CONSTRAINT sizes_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;
  END IF;

  -- subscriptions → restaurants
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_restaurant_id_fkey') THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;
  END IF;

  -- subscriptions → plans
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_plan_id_fkey') THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);
  END IF;

  -- subscription_transactions → restaurants
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscription_transactions_restaurant_id_fkey') THEN
    ALTER TABLE public.subscription_transactions ADD CONSTRAINT subscription_transactions_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;
  END IF;

  -- subscription_transactions → plans
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscription_transactions_plan_id_fkey') THEN
    ALTER TABLE public.subscription_transactions ADD CONSTRAINT subscription_transactions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);
  END IF;

  -- subscription_transactions → subscriptions
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscription_transactions_subscription_id_fkey') THEN
    ALTER TABLE public.subscription_transactions ADD CONSTRAINT subscription_transactions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;
  END IF;

  -- wallet_transactions → wallets
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wallet_transactions_wallet_id_fkey') THEN
    ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id) ON DELETE CASCADE;
  END IF;

  -- delivery_areas → branches
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'delivery_areas_branch_id_fkey') THEN
    ALTER TABLE public.delivery_areas ADD CONSTRAINT delivery_areas_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;
END $$;
