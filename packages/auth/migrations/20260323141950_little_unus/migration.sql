CREATE TABLE `social_connection` (
	`id` text PRIMARY KEY,
	`shop_id` text NOT NULL,
	`platform` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`page_id` text NOT NULL,
	`page_name` text NOT NULL,
	`page_access_token` text NOT NULL,
	`page_access_token_expires_at` integer,
	`user_access_token` text,
	`user_refresh_token` text,
	`permissions` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_social_connection_shop_id_shop_id_fk` FOREIGN KEY (`shop_id`) REFERENCES `shop`(`id`) ON DELETE CASCADE,
	CONSTRAINT `social_connection_shop_id_platform_unique` UNIQUE(`shop_id`,`platform`)
);
--> statement-breakpoint
CREATE INDEX `social_connection_shop_id_idx` ON `social_connection` (`shop_id`);--> statement-breakpoint
CREATE INDEX `social_connection_platform_idx` ON `social_connection` (`platform`);