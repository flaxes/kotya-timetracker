CREATE TABLE "tasks" (
	"id" INTEGER NOT NULL,
	"external_id" VARCHAR(50) NOT NULL,
	"name" TEXT NOT NULL,
	"status" INTEGER NOT NULL,
	"created_at" DATETIME NOT NULL,
	"updated_at" DATETIME NULL,
	"is_hidden" TINYINT NULL,
	PRIMARY KEY ("id")
);

CREATE TABLE "task_trackers" (
	"id" INTEGER NOT NULL,
	"task_id" INTEGER NOT NULL,
	"started_at" DATETIME NOT NULL,
	"ended_at" DATETIME NULL,
	"wasted_mins" INTEGER NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "tasks_trackers" FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE "logging" (
	"id" INTEGER NOT NULL,
	"task_id" INTEGER NOT NULL,
	"text" TEXT NOT NULL,
	"created_at" DATETIME NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "tasks_trackers" FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);