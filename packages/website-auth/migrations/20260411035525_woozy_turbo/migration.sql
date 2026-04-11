PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_shop` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo` text,
	`hero_image` text,
	`title` text,
	`description` text,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`state` text,
	`zip_code` text,
	`country` text,
	`phone` text NOT NULL,
	`email` text,
	`tax_id` text,
	`turso_db_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_shop_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_shop`(`id`, `name`, `slug`, `logo`, `hero_image`, `title`, `description`, `address`, `city`, `state`, `zip_code`, `country`, `phone`, `email`, `tax_id`, `turso_db_url`, `is_active`, `user_id`, `created_at`, `updated_at`) SELECT `id`, `name`, `slug`, `logo`, `hero_image`, `title`, `description`, `address`, `city`, `state`, `zip_code`, `country`, `phone`, `email`, `tax_id`, `turso_db_url`, `is_active`, `user_id`, `created_at`, `updated_at` FROM `shop`;--> statement-breakpoint
DROP TABLE `shop`;--> statement-breakpoint
ALTER TABLE `__new_shop` RENAME TO `shop`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `shop_slug_idx` ON `shop` (`slug`);--> statement-breakpoint
CREATE INDEX `shop_user_id_idx` ON `shop` (`user_id`);