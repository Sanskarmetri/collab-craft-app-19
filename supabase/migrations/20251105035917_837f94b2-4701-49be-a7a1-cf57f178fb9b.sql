-- Add INSERT policy to profiles table for defense-in-depth
-- This allows users to create their own profile during signup
-- Works alongside the handle_new_user() trigger

CREATE POLICY "Users can insert their own profile during signup"
  ON public.profiles 
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add comment explaining the security architecture
COMMENT ON POLICY "Users can insert their own profile during signup" ON public.profiles IS 
  'Defense-in-depth: Allows authenticated users to create their own profile. Works with handle_new_user() trigger which runs with SECURITY DEFINER privileges during signup.';