-- Allow users to assign their own role during signup
-- This fixes the issue where new users cannot register because only admins could insert roles

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;

-- Create a new policy that allows users to insert their own role during signup
-- OR allows admins to insert roles for other users
CREATE POLICY "Users can set own role during signup or admins can manage"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id  -- User can insert their own role
    OR public.has_role(auth.uid(), 'admin')  -- OR user is an admin
  );

-- Add comment for documentation
COMMENT ON POLICY "Users can set own role during signup or admins can manage" 
  ON public.user_roles IS 
  'Allows users to set their own role during registration (broker or manager), or admins to manage roles for any user';
