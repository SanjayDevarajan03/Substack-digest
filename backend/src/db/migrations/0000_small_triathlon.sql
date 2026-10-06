CREATE TABLE `users` (
	`email` text PRIMARY KEY NOT NULL,
	`handles` text NOT NULL,
	`cadence` text NOT NULL,
	`day` text,
	`time` text NOT NULL,
	`month` text
);
