ALTER TABLE "estimate_line_items" ADD COLUMN "labor_cost" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "estimate_line_items" ADD COLUMN "equipment_cost" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "estimate_line_items" ADD COLUMN "material_cost" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "estimate_line_items" ADD COLUMN "hours" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "estimate_line_items" ADD COLUMN "xa_unit_price" integer;--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "raw_labor" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "raw_equipment" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "raw_materials" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "labor_hours" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "timeline_days" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "historical_jobs" ADD COLUMN "claim_id" uuid;--> statement-breakpoint
ALTER TABLE "historical_jobs" ADD COLUMN "est_labor_hours" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "historical_jobs" ADD COLUMN "actual_labor" integer;--> statement-breakpoint
ALTER TABLE "historical_jobs" ADD COLUMN "actual_materials" integer;--> statement-breakpoint
ALTER TABLE "historical_jobs" ADD COLUMN "actual_equipment" integer;--> statement-breakpoint
ALTER TABLE "historical_jobs" ADD COLUMN "actual_hours" real;--> statement-breakpoint
ALTER TABLE "historical_jobs" ADD CONSTRAINT "historical_jobs_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE set null ON UPDATE no action;