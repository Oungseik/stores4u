CREATE TABLE `chat` (
	`id` text PRIMARY KEY,
	`title` text DEFAULT 'New Chat' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `message` (
	`id` text PRIMARY KEY,
	`chat_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_message_chat_id_chat_id_fk` FOREIGN KEY (`chat_id`) REFERENCES `chat`(`id`) ON DELETE CASCADE
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
CREATE TABLE `purchase_invoice` (
	`id` text PRIMARY KEY,
	`invoice_number` text NOT NULL,
	`supplier_id` text NOT NULL,
	`invoice_file_id` text UNIQUE,
	`ocr_result_id` text UNIQUE,
	`invoice_date` text NOT NULL,
	`photo_url` text NOT NULL,
	`subtotal_cents` integer DEFAULT 0 NOT NULL,
	`vat_cents` integer DEFAULT 0 NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`freight_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`validated_by` text,
	`validated_at` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_purchase_invoice_supplier_id_supplier_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`),
	CONSTRAINT `fk_purchase_invoice_invoice_file_id_purchase_invoice_file_id_fk` FOREIGN KEY (`invoice_file_id`) REFERENCES `purchase_invoice_file`(`id`),
	CONSTRAINT `fk_purchase_invoice_ocr_result_id_purchase_invoice_ocr_result_id_fk` FOREIGN KEY (`ocr_result_id`) REFERENCES `purchase_invoice_ocr_result`(`id`),
	CONSTRAINT `purchase_invoice_supplier_invoice_number_unique` UNIQUE(`supplier_id`,`invoice_number`)
);
--> statement-breakpoint
CREATE TABLE `purchase_invoice_file` (
	`id` text PRIMARY KEY,
	`object_path` text NOT NULL,
	`filename` text NOT NULL,
	`file_type` text NOT NULL,
	`size` integer NOT NULL,
	`status` text DEFAULT 'UPLOADED' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "invoice_file_status_check" CHECK("status" IN ('UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED', 'REJECTED', 'REVIEWING', 'REVIEWED'))
);
--> statement-breakpoint
CREATE TABLE `purchase_invoice_item` (
	`id` text PRIMARY KEY,
	`purchase_invoice_id` text NOT NULL,
	`product_id` text NOT NULL,
	`invoice_item_name` text,
	`qty` real NOT NULL,
	`unit_cost_cents` integer NOT NULL,
	`line_subtotal_cents` integer NOT NULL,
	`vat_cents` integer DEFAULT 0 NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`freight_cents` integer DEFAULT 0 NOT NULL,
	`line_total_cents` integer NOT NULL,
	`expiry_date` text,
	`batch_number` text,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_purchase_invoice_item_purchase_invoice_id_purchase_invoice_id_fk` FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoice`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_purchase_invoice_item_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_invoice_ocr_result` (
	`id` text PRIMARY KEY,
	`photo_url` text NOT NULL,
	`invoice_file_id` text,
	`raw_json` text NOT NULL,
	`extracted_text` text,
	`extracted_data` text,
	`confidence_score` real,
	`rejection_reason` text,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_purchase_invoice_ocr_result_invoice_file_id_purchase_invoice_file_id_fk` FOREIGN KEY (`invoice_file_id`) REFERENCES `purchase_invoice_file`(`id`),
	CONSTRAINT "purchase_invoice_ocr_result_confidence_score_check" CHECK("confidence_score" IS NULL OR ("confidence_score" >= 0 AND "confidence_score" <= 1))
);
--> statement-breakpoint
CREATE TABLE `order` (
	`id` text PRIMARY KEY,
	`customer_name` text,
	`customer_phone` text,
	`subtotal_cents` integer DEFAULT 0 NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`vat_cents` integer DEFAULT 0 NOT NULL,
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
CREATE TABLE `inventory_movement` (
	`id` text PRIMARY KEY,
	`product_id` text NOT NULL,
	`purchase_invoice_item_id` text,
	`movement_type` text NOT NULL,
	`qty` real NOT NULL,
	`unit_cost_cents` integer,
	`reference_type` text NOT NULL,
	`reference_id` text,
	`reason` text,
	`occurred_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_inventory_movement_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`),
	CONSTRAINT `fk_inventory_movement_purchase_invoice_item_id_purchase_invoice_item_id_fk` FOREIGN KEY (`purchase_invoice_item_id`) REFERENCES `purchase_invoice_item`(`id`)
);
--> statement-breakpoint
CREATE TABLE `product` (
	`id` text PRIMARY KEY,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`barcode` text UNIQUE,
	`description` text,
	`uom` text NOT NULL,
	`price_cents` integer NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`low_stock_threshold` integer DEFAULT 10,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_alias` (
	`id` text PRIMARY KEY,
	`product_id` text NOT NULL,
	`alias` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_product_alias_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE CASCADE,
	CONSTRAINT `product_alias_product_id_alias_unique` UNIQUE(`product_id`,`alias`)
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
CREATE TABLE `refund` (
	`id` text PRIMARY KEY,
	`order_id` text NOT NULL,
	`refund_total_cents` integer NOT NULL,
	`reason` text NOT NULL,
	`notes` text,
	`refunded_by` text,
	`refunded_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_refund_order_id_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `order`(`id`)
);
--> statement-breakpoint
CREATE TABLE `refund_item` (
	`id` text PRIMARY KEY,
	`refund_id` text NOT NULL,
	`order_item_id` text NOT NULL,
	CONSTRAINT `fk_refund_item_refund_id_refund_id_fk` FOREIGN KEY (`refund_id`) REFERENCES `refund`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_refund_item_order_item_id_order_item_id_fk` FOREIGN KEY (`order_item_id`) REFERENCES `order_item`(`id`)
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
CREATE TABLE `tax_settings` (
	`id` text PRIMARY KEY DEFAULT 'default',
	`enabled` integer DEFAULT true NOT NULL,
	`name` text DEFAULT 'VAT' NOT NULL,
	`rate` real DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `message_chat_id_idx` ON `message` (`chat_id`);--> statement-breakpoint
CREATE INDEX `purchase_invoice_status_created_at_idx` ON `purchase_invoice` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `purchase_invoice_invoice_date_idx` ON `purchase_invoice` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `invoice_file_status_created_at_idx` ON `purchase_invoice_file` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `purchase_invoice_item_purchase_invoice_id_idx` ON `purchase_invoice_item` (`purchase_invoice_id`);--> statement-breakpoint
CREATE INDEX `purchase_invoice_item_product_id_idx` ON `purchase_invoice_item` (`product_id`);--> statement-breakpoint
CREATE INDEX `order_created_at_idx` ON `order` (`created_at`);--> statement-breakpoint
CREATE INDEX `order_item_order_id_idx` ON `order_item` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_item_product_id_idx` ON `order_item` (`product_id`);--> statement-breakpoint
CREATE INDEX `inventory_movement_product_occurred_at_idx` ON `inventory_movement` (`product_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `inventory_movement_reference_idx` ON `inventory_movement` (`reference_type`,`reference_id`);--> statement-breakpoint
CREATE INDEX `inventory_movement_purchase_invoice_item_id_idx` ON `inventory_movement` (`purchase_invoice_item_id`);--> statement-breakpoint
CREATE INDEX `product_sku_idx` ON `product` (`sku`);--> statement-breakpoint
CREATE INDEX `product_name_idx` ON `product` (`name`);--> statement-breakpoint
CREATE INDEX `product_alias_product_id_idx` ON `product_alias` (`product_id`);--> statement-breakpoint
CREATE INDEX `product_category_category_id_idx` ON `product_category` (`category_id`);--> statement-breakpoint
CREATE INDEX `product_supplier_supplier_id_idx` ON `product_supplier` (`supplier_id`);--> statement-breakpoint
CREATE INDEX `refund_order_id_idx` ON `refund` (`order_id`);--> statement-breakpoint
CREATE INDEX `refund_refunded_at_idx` ON `refund` (`refunded_at`);--> statement-breakpoint
CREATE INDEX `refund_item_refund_id_idx` ON `refund_item` (`refund_id`);--> statement-breakpoint
CREATE INDEX `refund_item_order_item_id_idx` ON `refund_item` (`order_item_id`);