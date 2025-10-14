-- Fix clients delete policy to allow users to delete their own clients
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Managers and admins can delete clients" ON public.clients;

-- Create a new policy that allows users to delete their own clients, plus admins/managers
CREATE POLICY "Users can delete their own clients"
  ON public.clients
  FOR DELETE
  USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );
