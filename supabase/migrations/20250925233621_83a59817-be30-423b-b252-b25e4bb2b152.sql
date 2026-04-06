-- Create sizes table for menu items
CREATE TABLE public.sizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;

-- Create policies for sizes
CREATE POLICY "الأحجام مرئية للجميع" 
ON public.sizes 
FOR SELECT 
USING (true);

CREATE POLICY "أصحاب المطاعم يمكنهم إدارة أحجام أصنافهم" 
ON public.sizes 
FOR ALL 
USING (EXISTS (
  SELECT 1 
  FROM menu_items 
  JOIN restaurants ON restaurants.id = menu_items.restaurant_id 
  WHERE menu_items.id = sizes.menu_item_id 
  AND restaurants.owner_id = auth.uid()
));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_sizes_updated_at
BEFORE UPDATE ON public.sizes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraint
ALTER TABLE public.sizes 
ADD CONSTRAINT sizes_menu_item_id_fkey 
FOREIGN KEY (menu_item_id) 
REFERENCES public.menu_items(id) 
ON DELETE CASCADE;