CREATE TABLE `purge_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runType` enum('manual','automatic') NOT NULL,
	`status` enum('success','failed') NOT NULL,
	`deletedCount` int NOT NULL DEFAULT 0,
	`retentionDays` int NOT NULL,
	`cutoff` timestamp NOT NULL,
	`taskUid` varchar(120),
	`errorMessage` varchar(500),
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `purge_runs_id` PRIMARY KEY(`id`)
);
