CREATE TYPE "public"."cause_of_loss" AS ENUM('water', 'fire', 'mold', 'storm', 'other');--> statement-breakpoint
CREATE TYPE "public"."coverage_bucket" AS ENUM('master', 'ho6');--> statement-breakpoint
CREATE TYPE "public"."ho6_status" AS ENUM('verified', 'pending', 'none');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('new', 'dispatched', 'on_site', 'estimate', 'signed', 'complete', 'lost');--> statement-breakpoint
CREATE TYPE "public"."op_tier" AS ENUM('10_10', '15_15', '20_20', 'custom');--> statement-breakpoint
CREATE TYPE "public"."owner_role" AS ENUM('hoa', 'unit_owner', 'tenant');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('condo', 'single', 'commercial');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'pm', 'vendor_staff', 'vendor_admin', 'superadmin');--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"unit_id" uuid,
	"owner_role" "owner_role" NOT NULL,
	"cause_of_loss" "cause_of_loss" NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "job_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimate_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estimate_id" uuid NOT NULL,
	"code" text NOT NULL,
	"description" text NOT NULL,
	"qty" real NOT NULL,
	"unit_price" integer NOT NULL,
	"bucket" "coverage_bucket" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"op_tier" "op_tier" DEFAULT '10_10' NOT NULL,
	"nte_flag" boolean DEFAULT false NOT NULL,
	"ballpark_total" integer DEFAULT 0 NOT NULL,
	"master_total" integer DEFAULT 0 NOT NULL,
	"ho6_total" integer DEFAULT 0 NOT NULL,
	"confidence" real,
	"flagged" boolean DEFAULT false NOT NULL,
	"override_by" uuid,
	"override_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historical_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"raw_labor" integer NOT NULL,
	"raw_materials" integer NOT NULL,
	"raw_equipment" integer NOT NULL,
	"op_stripped" boolean DEFAULT true NOT NULL,
	"market" text NOT NULL,
	"cause_of_loss" "cause_of_loss" NOT NULL,
	"scope" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market" text NOT NULL,
	"cause_of_loss" "cause_of_loss" NOT NULL,
	"raw_labor" integer NOT NULL,
	"raw_materials" integer NOT NULL,
	"raw_equipment" integer NOT NULL,
	"scope" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"quarantined" boolean DEFAULT false NOT NULL,
	"source_tenant_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"file_url" text,
	"parsed_coverage" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "msas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"property_id" uuid,
	"op_tier" "op_tier" DEFAULT '10_10' NOT NULL,
	"specialty_pricing" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"contact" text NOT NULL,
	"role" "owner_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" text NOT NULL,
	"description" text NOT NULL,
	"iicrc_category" text,
	"unit" text NOT NULL,
	"unit_price" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"type" "property_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"branding" jsonb NOT NULL,
	"default_op_tier" "op_tier" DEFAULT '10_10' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"unit_number" text NOT NULL,
	"owner_id" uuid,
	"ho6_status" "ho6_status" DEFAULT 'none' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid,
	"role" "user_role" NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_line_items" ADD CONSTRAINT "estimate_line_items_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_override_by_users_id_fk" FOREIGN KEY ("override_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_jobs" ADD CONSTRAINT "historical_jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_policies" ADD CONSTRAINT "master_policies_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "msas" ADD CONSTRAINT "msas_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "msas" ADD CONSTRAINT "msas_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owners" ADD CONSTRAINT "owners_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;