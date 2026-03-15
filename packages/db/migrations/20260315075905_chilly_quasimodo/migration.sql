PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_product` (
	`id` text PRIMARY KEY,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`barcode` text UNIQUE,
	`description` text,
	`uom` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`price_cents` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_product`(`id`, `sku`, `name`, `image`, `barcode`, `description`, `uom`, `stock`, `price_cents`, `created_at`, `updated_at`) SELECT `id`, `sku`, `name`, `image`, `barcode`, `description`, `uom`, `stock`, `price_cents`, `created_at`, `updated_at` FROM `product`;--> statement-breakpoint
DROP TABLE `product`;--> statement-breakpoint
ALTER TABLE `__new_product` RENAME TO `product`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `product_sku_idx` ON `product` (`sku`);--> statement-breakpoint
CREATE INDEX `product_name_idx` ON `product` (`name`);