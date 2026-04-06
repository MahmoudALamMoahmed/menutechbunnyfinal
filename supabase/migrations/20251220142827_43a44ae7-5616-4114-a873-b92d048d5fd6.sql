-- Create extras table for restaurant add-ons
CREATE TABLE public.extras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extras ENABLE ROW LEVEL SECURITY;

-- Extras are visible to everyone
CREATE POLICY "الإضافات مرئية للجميع"
ON public.extras
FOR SELECT
USING (true);

-- Restaurant owners can manage their extras
CREATE POLICY "أصحاب المطاعم يمكنهم إدارة إضافاتهم"
ON public.extras
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = extras.restaurant_id
    AND restaurants.owner_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_extras_updated_at
BEFORE UPDATE ON public.extras
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();