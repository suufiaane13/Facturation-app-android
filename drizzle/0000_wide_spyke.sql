CREATE TABLE `catalog` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`default_price` real DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`email` text,
	`phone` text,
	`is_archived` integer DEFAULT false,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` text NOT NULL,
	`client_id` integer NOT NULL,
	`quote_id` integer,
	`status` text DEFAULT 'Brouillon',
	`total` real DEFAULT 0,
	`amount_paid` real DEFAULT 0,
	`balance_due` real DEFAULT 0,
	`materials` text,
	`created_at` integer,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE TABLE `line_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`doc_id` integer NOT NULL,
	`doc_type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`unit_price` real NOT NULL,
	`quantity` real NOT NULL,
	`total` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quote_number` text NOT NULL,
	`client_id` integer NOT NULL,
	`status` text DEFAULT 'Brouillon',
	`subtotal` real DEFAULT 0,
	`discount` real DEFAULT 0,
	`total` real DEFAULT 0,
	`materials` text,
	`notes` text,
	`created_at` integer,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quotes_quote_number_unique` ON `quotes` (`quote_number`);