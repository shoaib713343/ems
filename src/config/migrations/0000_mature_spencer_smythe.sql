CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"hash_password" text NOT NULL,
	"refresh_token" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
