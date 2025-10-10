-- Create enum for application roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'broker', 'viewer');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role (returns highest priority role)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'manager' THEN 2
      WHEN 'broker' THEN 3
      WHEN 'viewer' THEN 4
    END
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for brokers table
DROP POLICY IF EXISTS "Users can view their own brokers" ON public.brokers;
CREATE POLICY "Users can view brokers based on role"
  ON public.brokers
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "Users can update their own brokers" ON public.brokers;
CREATE POLICY "Users can update brokers based on role"
  ON public.brokers
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Users can delete their own brokers" ON public.brokers;
CREATE POLICY "Admins can delete brokers"
  ON public.brokers
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for clients table
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
CREATE POLICY "Users can view clients based on role"
  ON public.clients
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
CREATE POLICY "Users can update clients based on role"
  ON public.clients
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
CREATE POLICY "Managers and admins can delete clients"
  ON public.clients
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

-- Update RLS policies for sales table
DROP POLICY IF EXISTS "Users can view their own sales" ON public.sales;
CREATE POLICY "Users can view sales based on role"
  ON public.sales
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "Users can update their own sales" ON public.sales;
CREATE POLICY "Brokers and admins can update sales"
  ON public.sales
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Users can delete their own sales" ON public.sales;
CREATE POLICY "Admins can delete sales"
  ON public.sales
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updating updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();