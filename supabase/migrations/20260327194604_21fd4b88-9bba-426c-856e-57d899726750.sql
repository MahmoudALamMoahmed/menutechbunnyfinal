-- سياسة تعديل الأرصدة للسوبر أدمن
CREATE POLICY "super_admin_update_wallets"
ON public.wallets
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- سياسة تعديل الاشتراكات للسوبر أدمن
CREATE POLICY "super_admin_update_subscriptions"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- سياسة إدراج اشتراكات للسوبر أدمن
CREATE POLICY "super_admin_insert_subscriptions"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- سياسة تعديل معاملات المحافظ للسوبر أدمن
CREATE POLICY "super_admin_update_wallet_transactions"
ON public.wallet_transactions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- سياسة إدراج معاملات المحافظ للسوبر أدمن
CREATE POLICY "super_admin_insert_wallet_transactions"
ON public.wallet_transactions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));