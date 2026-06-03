-- Tenant-isolation RLS (spec §11). Apply AFTER `drizzle-kit migrate`.
-- Defense in depth: queries also filter by tenant_id, but never trust the
-- client for it — these policies are the backstop at the DB layer.
--
-- Assumes a request-scoped GUC `app.tenant_id` set per connection/transaction
-- (e.g. `select set_config('app.tenant_id', '<uuid>', true)`), and Supabase
-- JWTs carrying the tenant claim. superadmin bypasses via service role.

alter table tenants            enable row level security;
alter table users              enable row level security;
alter table properties         enable row level security;
alter table owners             enable row level security;
alter table units              enable row level security;
alter table master_policies    enable row level security;
alter table msas               enable row level security;
alter table price_list_items   enable row level security;
alter table claims             enable row level security;
alter table estimates          enable row level security;
alter table estimate_line_items enable row level security;
alter table historical_jobs    enable row level security;

-- Helper: current tenant from the request GUC.
create or replace function app_current_tenant() returns uuid
  language sql stable
  as $$ select nullif(current_setting('app.tenant_id', true), '')::uuid $$;

-- Direct tenant-scoped tables.
create policy tenant_isolation on properties
  using (tenant_id = app_current_tenant());
create policy tenant_isolation on owners
  using (tenant_id = app_current_tenant());
create policy tenant_isolation on msas
  using (tenant_id = app_current_tenant());
create policy tenant_isolation on price_list_items
  using (tenant_id = app_current_tenant());
create policy tenant_isolation on claims
  using (tenant_id = app_current_tenant());
create policy tenant_isolation on historical_jobs
  using (tenant_id = app_current_tenant());

-- Tenant of own row (users may have null tenant_id for superadmin).
create policy tenant_isolation on users
  using (tenant_id = app_current_tenant() or tenant_id is null);

-- Indirect: scoped through their parent's tenant.
create policy tenant_isolation on units
  using (exists (
    select 1 from properties p
    where p.id = units.property_id
      and p.tenant_id = app_current_tenant()
  ));
create policy tenant_isolation on master_policies
  using (exists (
    select 1 from properties p
    where p.id = master_policies.property_id
      and p.tenant_id = app_current_tenant()
  ));
create policy tenant_isolation on estimates
  using (exists (
    select 1 from claims c
    where c.id = estimates.claim_id
      and c.tenant_id = app_current_tenant()
  ));
create policy tenant_isolation on estimate_line_items
  using (exists (
    select 1 from estimates e
    join claims c on c.id = e.claim_id
    where e.id = estimate_line_items.estimate_id
      and c.tenant_id = app_current_tenant()
  ));

-- learning_records is the shared, anonymized dataset: intentionally NOT
-- tenant-scoped. Access restricted to the service role only.
alter table learning_records enable row level security;
-- (no permissive policy -> only service role / superadmin can read/write)

-- cost_basis_items is the confidential internal T&M cost basis. It must never
-- reach any client surface, so it is locked to the service role only: RLS on
-- with no permissive policy (app role sees zero rows), plus an explicit revoke
-- of the default table grants as defense in depth.
alter table cost_basis_items enable row level security;
revoke all on cost_basis_items from firstcall_app;
-- (no permissive policy -> only service role / superadmin can read/write)
