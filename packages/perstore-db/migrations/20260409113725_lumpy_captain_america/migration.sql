CREATE TABLE `product_image` (
	`id` text PRIMARY KEY,
	`product_id` text NOT NULL,
	`object_path` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_product_image_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `product_image_product_id_idx` ON `product_image` (`product_id`);