CREATE TABLE `generation_windows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scopeKey` varchar(255) NOT NULL,
	`windowKind` enum('hour','day') NOT NULL,
	`windowStart` timestamp NOT NULL,
	`count` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generation_windows_id` PRIMARY KEY(`id`),
	CONSTRAINT `generation_windows_scopeKey_unique` UNIQUE(`scopeKey`)
);
