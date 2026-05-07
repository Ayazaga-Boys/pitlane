GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;

GRANT SELECT ON public.invite_codes TO authenticated;
GRANT ALL ON public.invite_codes TO service_role;

GRANT INSERT ON public.waiting_list TO anon, authenticated;
GRANT ALL ON public.waiting_list TO service_role;

GRANT SELECT ON public.remote_configs TO authenticated;
GRANT ALL ON public.remote_configs TO service_role;
