ALTER TABLE `shop` RENAME COLUMN `region` TO `state`;--> statement-breakpoint
ALTER TABLE `shop` ADD `zip_code` text;--> statement-breakpoint
ALTER TABLE `shop` ADD `email` text;