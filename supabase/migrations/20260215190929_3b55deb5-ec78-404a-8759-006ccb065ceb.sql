
-- اضافة عمود طريقة استقبال الطلبات للفروع
ALTER TABLE branches ADD COLUMN order_mode TEXT DEFAULT 'whatsapp';

-- اضافة اعمدة تفصيلية لجدول الطلبات
ALTER TABLE orders ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE orders ADD COLUMN delivery_area_id UUID REFERENCES delivery_areas(id);
ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN customer_address TEXT;
