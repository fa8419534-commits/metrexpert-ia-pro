CREATE TABLE `payment_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestKey` varchar(64) NOT NULL,
	`clientName` varchar(160) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`email` varchar(320),
	`planQuota` int NOT NULL,
	`amountXof` int NOT NULL,
	`paymentMethod` enum('wave','moov','mtn','autre') NOT NULL,
	`paymentReference` varchar(120) NOT NULL,
	`status` enum('pending','confirmed','rejected') NOT NULL DEFAULT 'pending',
	`accessCodeId` int,
	`adminNote` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_requests_requestKey_unique` UNIQUE(`requestKey`)
);
