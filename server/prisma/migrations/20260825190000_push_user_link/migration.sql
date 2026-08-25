-- Link push subscriptions to the user account and enforce a single
-- active subscription per user so re-subscribing can never create
-- duplicate / zombie rows that confuse delivery.

-- Drop any subscriptions that have no employee link (legacy admins).
-- They will be re-created on next subscribe with a proper user_id.
DELETE FROM "push_subscriptions" WHERE "employee_id" IS NULL;

ALTER TABLE "push_subscriptions" ADD COLUMN "user_id" INTEGER;
UPDATE "push_subscriptions" SET "user_id" = "employee_id" WHERE "user_id" IS NULL;
ALTER TABLE "push_subscriptions" ALTER COLUMN "user_id" SET NOT NULL;

ALTER TABLE "push_subscriptions"
  ADD CONSTRAINT "push_subscriptions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "push_subscriptions"
  DROP CONSTRAINT IF EXISTS "push_subscriptions_employee_id_endpoint_key";
CREATE UNIQUE INDEX "push_subscriptions_user_id_key" ON "push_subscriptions"("user_id");
