-- Fix sales delete policy to allow users to delete their own sales
-- The previous policy only allowed admins to delete, which caused issues
-- where the frontend would optimistically remove items but the database wouldn't delete them

DROP POLICY IF EXISTS "Admins can delete sales" ON public.sales;

CREATE POLICY "Users can delete their own sales or admins can delete any"
  ON public.sales
  FOR DELETE
  USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'admin')
  );
