CREATE TYPE "public"."cost_category" AS ENUM('labor', 'equipment', 'vehicle', 'consumable');--> statement-breakpoint
CREATE TABLE "cost_basis_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category" "cost_category" NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"standard_rate" integer NOT NULL,
	"overtime_rate" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cost_basis_items" ADD CONSTRAINT "cost_basis_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cost_basis_items_tenant_category_name_unit_idx" ON "cost_basis_items" USING btree ("tenant_id","category","name","unit");