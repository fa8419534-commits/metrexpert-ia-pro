CREATE TABLE `free_trial_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientName` varchar(160),
	`phone` varchar(32),
	`phoneHash` varchar(64),
	`email` varchar(320),
	`emailHash` varchar(64),
	`trialAt` timestamp NOT NULL DEFAULT (now()),
	`convertedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `free_trial_contacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `free_trial_contacts_phoneHash_unique` UNIQUE(`phoneHash`),
	CONSTRAINT `free_trial_contacts_emailHash_unique` UNIQUE(`emailHash`)
);
