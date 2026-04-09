PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_product_image` (
	`id` text PRIMARY KEY,
	`product_id` text NOT NULL,
	`object_path` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_product_image_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE CASCADE,
	CONSTRAINT `product_image_product_id_object_path_unique` UNIQUE(`product_id`,`object_path`)
);
--> statement-breakpoint
INSERT INTO `__new_product_image`(`id`, `product_id`, `object_path`, `position`, `created_at`) SELECT `id`, `product_id`, `object_path`, `position`, `created_at` FROM `product_image`;--> statement-breakpoint
DROP TABLE `product_image`;--> statement-breakpoint
ALTER TABLE `__new_product_image` RENAME TO `product_image`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `product_image_product_id_idx` ON `product_image` (`product_id`);