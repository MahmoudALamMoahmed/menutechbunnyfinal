-- إنشاء جدول مناطق التوصيل
CREATE TABLE public.delivery_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  delivery_price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة للجميع
CREATE POLICY "مناطق التوصيل مرئية للجميع"
ON public.delivery_areas
FOR SELECT
USING (true);

-- سياسة الإدارة لأصحاب المطاعم
CREATE POLICY "أصحاب المطاعم يمكنهم إدارة مناطق التوصيل"
ON public.delivery_areas
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM branches
    JOIN restaurants ON restaurants.id = branches.restaurant_id
    WHERE branches.id = delivery_areas.branch_id
    AND restaurants.owner_id = auth.uid()
  )
);

-- تريجر لتحديث updated_at
CREATE TRIGGER update_delivery_areas_updated_at
BEFORE UPDATE ON public.delivery_areas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();