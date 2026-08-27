ALTER TABLE `payment_requests` ADD `proofKey` varchar(255);--> statement-breakpoint
ALTER TABLE `payment_requests` ADD `proofFileName` varchar(160);--> statement-breakpoint
ALTER TABLE `payment_requests` ADD `proofUploadedAt` timestamp;--> statement-breakpoint
ALTER TABLE `payment_requests` ADD `proofStatus` enum('pending','approved','rejected') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `payment_requests` ADD `proofNote` varchar(500);