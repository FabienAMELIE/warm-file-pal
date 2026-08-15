DO $$
DECLARE owner_id CONSTANT uuid := 'd6780491-e3e5-48e0-8dcb-673ef25d4380';
DECLARE t text;
BEGIN
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon';
  EXECUTE format('CREATE POLICY "single user profile" ON public.profiles FOR ALL TO anon USING (id = %L) WITH CHECK (id = %L)', owner_id, owner_id);
  FOREACH t IN ARRAY ARRAY['accounts','assets','transactions','valuations','goals','journal_entries'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon', t);
    EXECUTE format('CREATE POLICY "single user access" ON public.%I FOR ALL TO anon USING (user_id = %L) WITH CHECK (user_id = %L)', t, owner_id, owner_id);
  END LOOP;
END $$;