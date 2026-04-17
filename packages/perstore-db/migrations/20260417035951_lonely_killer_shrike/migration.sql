ALTER TABLE `purchase_invoice_file` ADD `chat_message_id` text REFERENCES message(id);--> statement-breakpoint
CREATE INDEX `purchase_invoice_file_chat_message_id_idx` ON `purchase_invoice_file` (`chat_message_id`);
