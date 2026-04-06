-- إنشاء جدول المطاعم
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE, -- اسم المطعم في الرابط مثل "hany"
  name TEXT NOT NULL, -- اسم المطعم الكامل
  description TEXT,
  cover_image_url TEXT,
  logo_url TEXT,
  phone TEXT,
  whatsapp_phone TEXT DEFAULT '01062698964',
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "المطاعم مرئية للجميع" 
ON public.restaurants 
FOR SELECT 
USING (true);

CREATE POLICY "أصحاب المطاعم يمكنهم إنشاء مطعمهم" 
ON public.restaurants 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "أصحاب المطاعم يمكنهم تحديث مطعمهم" 
ON public.restaurants 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "أصحاب المطاعم يمكنهم حذف مطعمهم" 
ON public.restaurants 
FOR DELETE 
USING (auth.uid() = owner_id);

-- إنشاء جدول الفئات
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS للفئات
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "الفئات مرئية للجميع" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "أصحاب المطاعم يمكنهم إدارة فئات مطعمهم" 
ON public.categories 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE id = restaurant_id AND owner_id = auth.uid()
  )
);

-- إنشاء جدول الأصناف
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS للأصناف
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "الأصناف مرئية للجميع" 
ON public.menu_items 
FOR SELECT 
USING (true);

CREATE POLICY "أصحاب المطاعم يمكنهم إدارة أصناف مطعمهم" 
ON public.menu_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE id = restaurant_id AND owner_id = auth.uid()
  )
);

-- إنشاء جدول الطلبات
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items JSONB NOT NULL, -- قائمة الأصناف المطلوبة
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS للطلبات
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "أصحاب المطاعم يمكنهم رؤية طلبات مطعمهم" 
ON public.orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE id = restaurant_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "يمكن للجميع إنشاء طلبات" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "أصحاب المطاعم يمكنهم تحديث طلبات مطعمهم" 
ON public.orders 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE id = restaurant_id AND owner_id = auth.uid()
  )
);

-- إنشاء triggers للتحديث التلقائي للتاريخ
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();