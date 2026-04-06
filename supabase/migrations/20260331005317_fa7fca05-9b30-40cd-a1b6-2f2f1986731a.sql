
CREATE TABLE public.contact_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  restaurant_name text,
  message text,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_insert_leads" ON public.contact_leads
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "sales_read_leads" ON public.contact_leads
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "sales_update_leads" ON public.contact_leads
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_contact_leads_updated_at
  BEFORE UPDATE ON public.contact_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
