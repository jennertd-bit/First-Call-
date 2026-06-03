-- Runtime application role for FirstCall (spec §11: RLS-enforced isolation).
--
-- The default `postgres`/service role BYPASSES RLS, so it must NOT be used for
-- tenant-facing queries. This role is a plain LOGIN role with table privileges
-- but NO superuser / NO bypassrls — RLS policies in rls.sql apply to it.
--
-- Apply once after migrations, before rls.sql. Change the password before any
-- non-local deployment (or use Supabase-managed roles in hosted environments).

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'firstcall_app') then
    create role firstcall_app login password 'firstcall_app_dev' nosuperuser nobypassrls noinherit;
  end if;
end
$$;

grant usage on schema public to firstcall_app;
grant select, insert, update, delete on all tables in schema public to firstcall_app;
grant usage, select on all sequences in schema public to firstcall_app;

-- Future tables/sequences created by the migration owner.
alter default privileges in schema public
  grant select, insert, update, delete on tables to firstcall_app;
alter default privileges in schema public
  grant usage, select on sequences to firstcall_app;
