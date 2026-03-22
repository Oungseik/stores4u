CREATE TABLE `tax_settings` (
	`id` text PRIMARY KEY DEFAULT 'default',
	`enabled` integer DEFAULT true NOT NULL,
	`name` text DEFAULT 'VAT' NOT NULL,
	`rate` real DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `invoice` RENAME COLUMN `tax_cents` TO `vat_cents`;--> statement-breakpoint
ALTER TABLE `invoice_item` RENAME COLUMN `tax_cents` TO `vat_cents`;--> statement-breakpoint
ALTER TABLE `order` ADD `vat_cents` integer DEFAULT 0 NOT NULL;