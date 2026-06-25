CREATE TABLE "boards" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"position" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"id" uuid PRIMARY KEY NOT NULL,
	"board_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" text NOT NULL,
	CONSTRAINT "lists_id_board_id_unique" UNIQUE("id","board_id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"board_id" uuid NOT NULL,
	"title" text NOT NULL,
	"notes" text,
	"date" date,
	"list_id" uuid,
	"position" text NOT NULL,
	"color" text,
	"done" boolean DEFAULT false NOT NULL,
	"rolled_over_from" date,
	"recurrence_rule" text,
	"recurrence_id" uuid,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasks_date_xor_list" CHECK (("tasks"."date" is not null) <> ("tasks"."list_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_list_board_fk" FOREIGN KEY ("list_id","board_id") REFERENCES "public"."lists"("id","board_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasks_board_date_position_idx" ON "tasks" USING btree ("board_id","date","position");--> statement-breakpoint
CREATE INDEX "tasks_list_position_idx" ON "tasks" USING btree ("list_id","position");