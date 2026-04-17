-- Fix circular RLS policy on superadmin_users
-- Previous policy required being superadmin to check if you're a superadmin → infinite recursion.
-- New approach: users can always read their own row; full list access uses service role.

DROP POLICY IF EXISTS "superadmin_users_superadmin_select" ON public.superadmin_users;
DROP POLICY IF EXISTS "superadmin_users_read_own" ON public.superadmin_users;

-- Users can read their own row (enough for auth gate in layout + API routes)
CREATE POLICY "superadmin_users_read_own" ON public.superadmin_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
