CREATE TABLE `chat_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` integer PRIMARY KEY NOT NULL,
	`story_id` integer NOT NULL,
	`parent_id` integer,
	`by` text,
	`text` text,
	`time` integer,
	`synced_at` text NOT NULL,
	FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stories` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`url` text,
	`text` text,
	`by` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`descendants` integer DEFAULT 0,
	`time` integer NOT NULL,
	`type` text DEFAULT 'story' NOT NULL,
	`synced_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`stories_count` integer DEFAULT 0,
	`comments_count` integer DEFAULT 0,
	`status` text DEFAULT 'running' NOT NULL,
	`error` text
);
