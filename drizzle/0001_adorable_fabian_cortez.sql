CREATE TABLE `company_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_name` text DEFAULT '',
	`siret` text DEFAULT '',
	`address` text DEFAULT '',
	`email` text DEFAULT '',
	`phone` text DEFAULT '',
	`website` text DEFAULT '',
	`logo_base64` text,
	`default_notes` text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`amount` real NOT NULL,
	`method` text DEFAULT 'Virement',
	`notes` text,
	`paid_at` integer,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `invoices` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE `quotes` ADD `updated_at` integer;