CREATE TABLE `subscriptions` (
	`email` text NOT NULL,
	`handle` text NOT NULL,
	`cadence` text NOT NULL,
	`last_sent_at` integer,
	PRIMARY KEY(`email`, `handle`)
);
--> statement-breakpoint
-- Backfill: one subscription row per handle already stored in users.handles,
-- inheriting that user's account-level cadence.
INSERT OR IGNORE INTO `subscriptions` (`email`, `handle`, `cadence`, `last_sent_at`)
SELECT `users`.`email`, `j`.`value`, `users`.`cadence`, NULL
FROM `users`, json_each(`users`.`handles`) AS `j`;
