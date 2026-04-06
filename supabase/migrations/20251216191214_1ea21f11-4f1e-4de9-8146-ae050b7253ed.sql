-- إنشاء جدول الفروع
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  whatsapp_phone TEXT,
  delivery_phone TEXT,
  working_hours TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "الفروع مرئية للجميع" 
ON public.branches 
FOR SELECT 
USING (true);

CREATE POLICY "أصحاب المطاعم يمكنهم إدارة فروعهم" 
ON public.branches 
FOR ALL 
USING (EXISTS ( 
  SELECT 1 FROM restaurants 
  WHERE restaurants.id = branches.restaurant_id 
  AND restaurants.owner_id = auth.uid()
));

-- تريجر لتحديث updated_at
CREATE TRIGGER update_branches_updated_at
BEFORE UPDATE ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();