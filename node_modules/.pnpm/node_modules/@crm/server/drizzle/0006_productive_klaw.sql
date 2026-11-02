CREATE TABLE `receipt_reversals` (
	`id` text PRIMARY KEY NOT NULL,
	`receipt_id` text NOT NULL,
	`replacement_receipt_id` text NOT NULL,
	`reason` text NOT NULL,
	`action_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`receipt_id`) REFERENCES `payment_receipts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`replacement_receipt_id`) REFERENCES `payment_receipts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `receipt_reversals_receipt_id_unique` ON `receipt_reversals` (`receipt_id`);--> statement-breakpoint
CREATE INDEX `receipt_reversals_replacement_idx` ON `receipt_reversals` (`replacement_receipt_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`shipment_line_id` text NOT NULL,
	`order_id` text NOT NULL,
	`qty` integer NOT NULL,
	`reverses_id` text,
	`action_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`shipment_line_id`) REFERENCES `shipment_lines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "deliveries_qty_check" CHECK(typeof("__new_deliveries"."qty") = 'integer' and "__new_deliveries"."qty" <> 0 and ("__new_deliveries"."qty" < 0) = ("__new_deliveries"."reverses_id" is not null))
);
--> statement-breakpoint
INSERT INTO `__new_deliveries`("id", "shipment_line_id", "order_id", "qty", "action_id", "created_at") SELECT "id", "shipment_line_id", "order_id", "qty", "action_id", "created_at" FROM `deliveries`;--> statement-breakpoint
DROP TABLE `deliveries`;--> statement-breakpoint
ALTER TABLE `__new_deliveries` RENAME TO `deliveries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `deliveries_shipment_line_id_idx` ON `deliveries` (`shipment_line_id`);--> statement-breakpoint
CREATE INDEX `deliveries_order_id_idx` ON `deliveries` (`order_id`);--> statement-breakpoint
ALTER TABLE `payment_receipts` ADD `moved_from_receipt_id` text;