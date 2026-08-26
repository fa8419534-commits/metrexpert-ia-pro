ALTER TABLE `client_access_codes` ADD `paymentMethod` varchar(32);--> statement-breakpoint
ALTER TABLE `client_access_codes` ADD `paymentReference` varchar(120);--> statement-breakpoint
ALTER TABLE `client_access_codes` ADD `paidAt` timestamp;