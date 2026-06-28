CREATE TABLE "connected_accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"label" text NOT NULL,
	"cipher" text,
	"iv" text,
	"auth_tag" text,
	"enc_key_version" integer DEFAULT 1 NOT NULL,
	"caldav_url" text,
	"ical_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_synced_at" timestamp with time zone,
	CONSTRAINT "connected_accounts_provider" CHECK ("connected_accounts"."provider" in ('google', 'caldav', 'ical'))
);
--> statement-breakpoint
CREATE TABLE "external_calendars" (
	"id" uuid PRIMARY KEY NOT NULL,
	"connected_account_id" uuid NOT NULL,
	"external_calendar_id" text NOT NULL,
	"name" text,
	"color" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"board_id" uuid,
	"sync_token" text,
	"ctag" text,
	"last_synced_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "synced_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"external_calendar_id" uuid NOT NULL,
	"uid" text NOT NULL,
	"recurrence_id" text,
	"title" text,
	"start" timestamp with time zone,
	"end" timestamp with time zone,
	"start_tz" text,
	"end_tz" text,
	"all_day" boolean DEFAULT false NOT NULL,
	"rrule" text,
	"exdates" jsonb,
	"series_uid" text,
	"is_master" boolean DEFAULT false NOT NULL,
	"status" text,
	"last_seen_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "synced_events_status" CHECK ("synced_events"."status" is null or "synced_events"."status" in ('confirmed', 'cancelled'))
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "accent_color" text DEFAULT 'sky';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "tag_style" text DEFAULT 'underline';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "show_calendar_events" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "lists" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "start_time" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "linked_event_id" uuid;--> statement-breakpoint
ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_calendars" ADD CONSTRAINT "external_calendars_connected_account_id_connected_accounts_id_fk" FOREIGN KEY ("connected_account_id") REFERENCES "public"."connected_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_calendars" ADD CONSTRAINT "external_calendars_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "synced_events" ADD CONSTRAINT "synced_events_external_calendar_id_external_calendars_id_fk" FOREIGN KEY ("external_calendar_id") REFERENCES "public"."external_calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "external_calendars_account_idx" ON "external_calendars" USING btree ("connected_account_id");--> statement-breakpoint
CREATE INDEX "synced_events_cal_start_idx" ON "synced_events" USING btree ("external_calendar_id","start");--> statement-breakpoint
CREATE INDEX "synced_events_cal_uid_idx" ON "synced_events" USING btree ("external_calendar_id","uid");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_recurrence_id_tasks_id_fk" FOREIGN KEY ("recurrence_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_id_tasks_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_linked_event_id_synced_events_id_fk" FOREIGN KEY ("linked_event_id") REFERENCES "public"."synced_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasks_parent_id_idx" ON "tasks" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "tasks_recurrence_id_idx" ON "tasks" USING btree ("recurrence_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_recurrence_date_uq" ON "tasks" USING btree ("recurrence_id","date") WHERE "tasks"."recurrence_id" is not null;