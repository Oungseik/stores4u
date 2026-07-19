ALTER TABLE `invoice_settings` ADD `show_state` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `invoice_settings` ADD `show_country` integer DEFAULT true NOT NULL;--> statement-breakpoint
UPDATE `invoice_settings` SET `show_state` = false, `show_country` = false WHERE `show_address` = false;