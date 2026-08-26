CREATE TABLE `client_access_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codeHash` varchar(64) NOT NULL,
	`clientName` varchar(160) NOT NULL,
	`monthlyQuota` int NOT NULL,
	`monthlyUsed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`disabledAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_access_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_access_codes_codeHash_unique` UNIQUE(`codeHash`)
);
