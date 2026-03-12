CREATE TABLE `invoice` (
	`id` text PRIMARY KEY,
	`invoice_number` text NOT NULL,
	`supplier_id` text NOT NULL,
	`ocr_result_id` text UNIQUE,
	`invoice_date` text NOT NULL,
	`photo_url` text NOT NULL,
	`subtotal_cents` integer DEFAULT 0 NOT NULL,
	`tax_cents` integer DEFAULT 0 NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`freight_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`validated_by` text,
	`validated_at` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_invoice_supplier_id_supplier_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`),
	CONSTRAINT `fk_invoice_ocr_result_id_invoice_ocr_result_id_fk` FOREIGN KEY (`ocr_result_id`) REFERENCES `invoice_ocr_result`(`id`),
	CONSTRAINT `invoice_supplier_invoice_number_unique` UNIQUE(`supplier_id`,`invoice_number`)
);
--> statement-breakpoint
CREATE TABLE `invoice_item` (
	`id` text PRIMARY KEY,
	`invoice_id` text NOT NULL,
	`product_id` text NOT NULL,
	`qty` real NOT NULL,
	`unit_cost_cents` integer NOT NULL,
	`line_subtotal_cents` integer NOT NULL,
	`tax_cents` integer DEFAULT 0 NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`freight_cents` integer DEFAULT 0 NOT NULL,
	`line_total_cents` integer NOT NULL,
	`expiry_date` text,
	`batch_number` text,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_invoice_item_invoice_id_invoice_id_fk` FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_invoice_item_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoice_ocr_result` (
	`id` text PRIMARY KEY,
	`photo_url` text NOT NULL,
	`raw_json` text NOT NULL,
	`extracted_text` text,
	`extracted_data` text,
	`confidence_score` real,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "invoice_ocr_result_confidence_score_check" CHECK("confidence_score" IS NULL OR ("confidence_score" >= 0 AND "confidence_score" <= 1)),
	CONSTRAINT "invoice_ocr_result_status_check" CHECK("status" IN ('PENDING', 'PROCESSED', 'FAILED', 'LINKED'))
);
--> statement-breakpoint
CREATE TABLE `image` (
	`object_path` text PRIMARY KEY,
	`filename` text NOT NULL,
	`type` text DEFAULT 'image/webp' NOT NULL,
	`size` integer NOT NULL,
	`uploaded_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `setting` (
	`id` text PRIMARY KEY,
	`logo` text,
	`hero_image` text,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`region` text,
	`country` text,
	`phone` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order` (
	`id` text PRIMARY KEY,
	`order_number` text NOT NULL UNIQUE,
	`customer_name` text,
	`customer_phone` text,
	`subtotal_cents` integer DEFAULT 0 NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_item` (
	`id` text PRIMARY KEY,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`qty` real NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`line_total_cents` integer NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_order_item_order_id_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_order_item_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`)
);
--> statement-breakpoint
CREATE TABLE `category` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL UNIQUE,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventory_batch` (
	`id` text PRIMARY KEY,
	`product_id` text NOT NULL,
	`invoice_item_id` text,
	`qty` real NOT NULL,
	`remaining_qty` real NOT NULL,
	`expiry_date` text,
	`batch_number` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_inventory_batch_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`),
	CONSTRAINT `fk_inventory_batch_invoice_item_id_invoice_item_id_fk` FOREIGN KEY (`invoice_item_id`) REFERENCES `invoice_item`(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_movement` (
	`id` text PRIMARY KEY,
	`product_id` text NOT NULL,
	`batch_id` text,
	`invoice_item_id` text,
	`movement_type` text NOT NULL,
	`qty` real NOT NULL,
	`unit_cost_cents` integer,
	`reference_type` text,
	`reference_id` text,
	`reason` text,
	`occurred_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_inventory_movement_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`),
	CONSTRAINT `fk_inventory_movement_batch_id_inventory_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `inventory_batch`(`id`),
	CONSTRAINT `fk_inventory_movement_invoice_item_id_invoice_item_id_fk` FOREIGN KEY (`invoice_item_id`) REFERENCES `invoice_item`(`id`)
);
--> statement-breakpoint
CREATE TABLE `product` (
	`id` text PRIMARY KEY,
	`sku` text NOT NULL UNIQUE,
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
CREATE TABLE `product_category` (
	`product_id` text NOT NULL,
	`category_id` text NOT NULL,
	CONSTRAINT `product_category_pk` PRIMARY KEY(`product_id`, `category_id`),
	CONSTRAINT `fk_product_category_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_product_category_category_id_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `product_supplier` (
	`product_id` text NOT NULL,
	`supplier_id` text NOT NULL,
	`is_preferred` text DEFAULT '0' NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `product_supplier_pk` PRIMARY KEY(`product_id`, `supplier_id`),
	CONSTRAINT `fk_product_supplier_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_product_supplier_supplier_id_supplier_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `supplier` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`contact_name` text,
	`phone` text,
	`email` text,
	`address` text,
	`payment_terms` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `invoice_status_created_at_idx` ON `invoice` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `invoice_invoice_date_idx` ON `invoice` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `invoice_item_invoice_id_idx` ON `invoice_item` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `invoice_item_product_id_idx` ON `invoice_item` (`product_id`);--> statement-breakpoint
CREATE INDEX `order_created_at_idx` ON `order` (`created_at`);--> statement-breakpoint
CREATE INDEX `order_item_order_id_idx` ON `order_item` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_item_product_id_idx` ON `order_item` (`product_id`);--> statement-breakpoint
CREATE INDEX `inventory_batch_product_expiry_created_available_idx` ON `inventory_batch` (`product_id`,`expiry_date`,`created_at`) WHERE "inventory_batch"."remaining_qty" > 0;--> statement-breakpoint
CREATE INDEX `inventory_batch_product_remaining_qty_idx` ON `inventory_batch` (`product_id`,`remaining_qty`);--> statement-breakpoint
CREATE INDEX `inventory_batch_invoice_item_id_idx` ON `inventory_batch` (`invoice_item_id`);--> statement-breakpoint
CREATE INDEX `inventory_movement_product_occurred_at_idx` ON `inventory_movement` (`product_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `inventory_movement_reference_idx` ON `inventory_movement` (`reference_type`,`reference_id`);--> statement-breakpoint
CREATE INDEX `inventory_movement_batch_id_idx` ON `inventory_movement` (`batch_id`);--> statement-breakpoint
CREATE INDEX `inventory_movement_invoice_item_id_idx` ON `inventory_movement` (`invoice_item_id`);--> statement-breakpoint
CREATE INDEX `product_category_category_id_idx` ON `product_category` (`category_id`);--> statement-breakpoint
CREATE INDEX `product_supplier_supplier_id_idx` ON `product_supplier` (`supplier_id`);